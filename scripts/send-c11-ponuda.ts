/**
 * Ponuda za grupni C1.1 (start 05.08.2026, sre+sub 18:15-19:15) ljudima koji su na
 * stranici kursa ostavili mejl dok termina nije bilo („Čeka termin: C1.1").
 * NIJE cold outreach - sami su tražili da ih obavestimo.
 *
 * Tekst rodno neutralan (jedna verzija za sve). Posle slanja: upis u crm_interactions
 * (izlazna) + stage -> „ponuda", da se nikom ne pošalje dva puta i da ostane trag.
 *
 *   npx tsx scripts/send-c11-ponuda.ts            # DRY - samo ispiše
 *   npx tsx scripts/send-c11-ponuda.ts --send     # ŠALJE (tek posle Natašinog OK)
 */
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [k, ...v] = line.split("=");
  if (k && v.length && !process.env[k.trim()]) process.env[k.trim()] = v.join("=").trim();
}
const RESEND_KEY = process.env.RESEND_API_KEY!;
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

const FROM = "Hartweger <info@hartweger.rs>";
const SUBJECT = "Otvorili smo termin za C1.1 - grupa kreće 5. avgusta";
const KURS_URL = "https://www.hartweger.rs/kursevi/grupni-kurs-c1-1";
const SEND = process.argv.includes("--send");
const KAMPANJA = "c11-ponuda-2026-07-25";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function buildEmail(firstName: string | null): string {
  const pozdrav = firstName ? `Ćao ${firstName},` : "Ćao,";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f8f9fa;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e">
<span style="display:none;max-height:0;overflow:hidden;color:#f8f9fa">Grupni C1.1 kreće u sredu, 5. avgusta - sreda i subota 18:15-19:15.</span>
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="text-align:center;padding:8px 0 20px"><img src="https://www.hartweger.rs/logo.jpg" alt="Hartweger" width="150" style="max-width:150px;height:auto"><div style="font-size:13px;color:#999;margin-top:6px">Škola nemačkog jezika</div></div>
<div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
<h1 style="font-size:22px;margin:0 0 16px;color:#1a1a2e">Otvorili smo termin za C1.1</h1>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px">${pozdrav}</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">zapisali smo tvoj mejl da te obavestimo kada otvorimo termin za grupni <strong>C1.1</strong>. Termin je sada otvoren i nastava kreće <strong>u sredu, 5. avgusta</strong>.</p>
<div style="background:#fff8f3;border-left:3px solid #e8915a;border-radius:6px;padding:16px 18px;margin:0 0 18px"><div style="font-size:15px;line-height:1.8;color:#1a1a2e"><strong>Detalji:</strong><br>• živa online nastava (Google Meet), sredom i subotom 18:15-19:15<br>• 7 nedelja nastave, profesorka Marija Radojković Stanojić<br>• mala grupa, najviše 6 polaznika - svako dobija reč na svakom času<br>• kompleksni tekstovi, prezentacije, pisanje eseja i priprema za Goethe C1<br>• cena celog kursa: <strong>21.200 din.</strong></div></div>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px"><strong>Novo:</strong> uz C1.1 od ove grupe dobijaš i prateći materijal na platformi - objašnjenja gramatike sa tabelama za svih 12 lekcija, kartice za učenje reči, vežbe i test posle svake lekcije, i završni test sa sertifikatom. Materijalu pristupaš 0-24, godinu dana, i van termina nastave.</p>
<div style="text-align:center;margin:22px 0"><a href="${KURS_URL}" style="display:inline-block;background:#4fb1d3;color:#fff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 34px;border-radius:8px">Pogledaj kurs i prijavi se →</a></div>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">Plaćanje je moguće karticom, uplatnicom ili preko PayPal-a; na rate ide karticama Banca Intesa. Mesto u grupi se čuva na uplatu, a za formiranje grupe potrebno je najmanje 3 polaznika.</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 22px">Ako ti ovaj termin ne odgovara ili nisi siguran/na da je C1.1 pravi nivo za tebe, samo odgovori na ovaj mejl pa ćemo se dogovoriti.</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0">Vidimo se u sredu?</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:20px 0 0">Pozdrav,<br><strong>Hartweger tim</strong></p>
</div>
<div style="text-align:center;font-size:12px;color:#999;padding:18px 0">Hartweger - Škola nemačkog jezika · <a href="https://www.hartweger.rs" style="color:#999">hartweger.rs</a><br>Dobijaš ovaj mejl jer si na stranici kursa C1.1 ostavio/la mejl da te obavestimo kada otvorimo termin.</div>
</div></body></html>`;
}

interface Primalac { email: string; name: string | null; crm_id?: string; ostavio?: string }

async function run() {
  const input = JSON.parse(fs.readFileSync(path.resolve(__dirname, "_c11_ponuda_2026-07-25.json"), "utf-8"));
  const primaoci: Primalac[] = input.cekaju_termin;
  console.log(`${input.povod}\n`);
  console.log(`Publika: ${primaoci.length} | Subject: ${SUBJECT}`);

  // Zaštita od duplog slanja: ako je kampanja već upisana u CRM, preskoči tog primaoca.
  // PAZI: dozvoljene vrednosti za direction su „dolazna" / „odlazna" / „interna"
  // (CHECK crm_interactions_direction_check). „izlazna" tiho pada.
  const { data: vecPoslato } = await sb
    .from("crm_interactions")
    .select("contact_id")
    .eq("channel", "mejl")
    .eq("direction", "odlazna")
    .ilike("summary", `%${KAMPANJA}%`);
  const poslatoIds = new Set((vecPoslato ?? []).map((r) => r.contact_id));
  const zaSlanje = primaoci.filter((p) => !p.crm_id || !poslatoIds.has(p.crm_id));
  if (poslatoIds.size) console.log(`Već poslato ranije: ${primaoci.length - zaSlanje.length}`);

  if (!SEND) {
    zaSlanje.forEach((p) => console.log(`  → ${p.email}${p.name ? ` (${p.name})` : ""} - ostavio mejl ${p.ostavio ?? "?"}`));
    console.log(`\n[DRY] Ništa nije poslato. Pokreni sa --send.`);
    return;
  }

  let ok = 0, fail = 0;
  for (const p of zaSlanje) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `${KAMPANJA}/${p.email}`,
      },
      body: JSON.stringify({
        from: FROM, to: [p.email], reply_to: "info@hartweger.rs",
        subject: SUBJECT, html: buildEmail(p.name),
      }),
    });
    if (!res.ok) {
      fail++;
      console.error(`  ✗ ${p.email}: ${res.status} ${await res.text()}`);
      await sleep(600);
      continue;
    }
    ok++;
    console.log(`  ✓ ${p.email}`);
    if (p.crm_id) {
      // Trag u CRM-u: interakcija + faza „ponuda" (nijedan mejl bez traga).
      // Greška se NE gulta - bez traga ne znamo kome je šta poslato.
      const { error: iErr } = await sb.from("crm_interactions").insert({
        contact_id: p.crm_id,
        channel: "mejl",
        direction: "odlazna",
        summary: `Ponuda C1.1 grupa 05.08 (${KAMPANJA})`,
        body: `Poslata ponuda za grupni C1.1 (start 05.08.2026, sre+sub 18:15-19:15, 21.200 din) na zahtev „obavesti me kad otvorite termin".`,
      });
      if (iErr) console.error(`  ! CRM trag NIJE upisan za ${p.email}: ${iErr.message}`);
      const { error: uErr } = await sb
        .from("crm_contacts")
        .update({ stage: "ponuda", level: "C1", last_interaction_at: new Date().toISOString() })
        .eq("id", p.crm_id);
      if (uErr) console.error(`  ! Faza NIJE promenjena za ${p.email}: ${uErr.message}`);
    }
    await sleep(600);
  }
  console.log(`\n✓ Poslato: ${ok}, neuspeha: ${fail} (od ${zaSlanje.length}).`);
}
run().catch((e) => { console.error(e); process.exit(1); });
