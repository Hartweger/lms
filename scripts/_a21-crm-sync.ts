/**
 * CRM sinhronizacija za kampanju a21-ponuda-2026-08-04 (julsko pravilo):
 *  - upsert kontakta ako ne postoji (source=testiranje, stage=kontaktiran)
 *  - svaki primalac dobija crm_interactions zapis (meta.kampanja)
 *  - NaKI lidovi stage nov -> kontaktiran
 * Idempotentno: preskace interakcije koje vec postoje za kampanju.
 *   npx tsx scripts/_a21-crm-sync.ts
 */
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [k, ...v] = line.split("=");
  if (k && v.length && !process.env[k.trim()]) process.env[k.trim()] = v.join("=").trim();
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const KAMPANJA = "a21-ponuda-2026-08-04";

async function run() {
  const poslato: Array<{ email: string; crm_id: string | null; variant: string }> = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "_a21_ponuda_sent_2026-08-04.json"), "utf-8"));

  const { data: postojece, error: e0 } = await supabase
    .from("crm_interactions").select("contact_id").eq("meta->>kampanja", KAMPANJA);
  if (e0) throw e0;
  const vecZabelezeno = new Set((postojece ?? []).map((r) => r.contact_id));

  let noviKontakti = 0, interakcije = 0, prebaceno = 0;
  for (const p of poslato) {
    let contactId = p.crm_id;
    if (!contactId) {
      const { data: found } = await supabase.from("crm_contacts").select("id").ilike("email", p.email).maybeSingle();
      if (found) contactId = found.id;
    }
    if (!contactId) {
      const nivo = p.variant === "prag" ? "A1" : "A2";
      const note = p.variant === "prag"
        ? "Besplatno testiranje: rezultat A1.2 (7/10 na A1.2 bloku - prag za A2.1)"
        : "Besplatno testiranje: rezultat A2.1";
      const { data: ins, error } = await supabase.from("crm_contacts")
        .insert({ email: p.email, source: "testiranje", stage: "kontaktiran", level: nivo, note })
        .select("id").single();
      if (error) { console.error(`  ✗ kontakt ${p.email}: ${error.message}`); continue; }
      contactId = ins.id; noviKontakti++;
    }
    if (!vecZabelezeno.has(contactId)) {
      const { error } = await supabase.from("crm_interactions").insert({
        contact_id: contactId, channel: "mejl", direction: "odlazna",
        summary: "Ponuda za A2.1 grupu (start 05.08. u 18h)",
        occurred_at: new Date().toISOString(),
        meta: { kampanja: KAMPANJA, varijanta: p.variant },
      });
      if (error) { console.error(`  ✗ interakcija ${p.email}: ${error.message}`); continue; }
      interakcije++;
    }
    const { data: upd } = await supabase.from("crm_contacts")
      .update({ stage: "kontaktiran", last_interaction_at: new Date().toISOString() })
      .eq("id", contactId).eq("stage", "nov").select("id");
    if (upd && upd.length) prebaceno++;
    else await supabase.from("crm_contacts").update({ last_interaction_at: new Date().toISOString() }).eq("id", contactId);
  }
  console.log(`✓ Novi kontakti: ${noviKontakti}, interakcije: ${interakcije}, nov->kontaktiran: ${prebaceno} (od ${poslato.length}).`);
}
run().catch((e) => { console.error(e); process.exit(1); });
