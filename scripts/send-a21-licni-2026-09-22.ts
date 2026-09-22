/**
 * Licni mejlovi za A2.1 grupu od 01.10 - samo oni sa „Ceka termin: A2.1" koji NISU dobili
 * Gmail ponudu 13.09 (Ajla, Ivona, Jasmina jesu). Violeta + Aleksandar Lukic.
 *   npx tsx scripts/send-a21-licni-2026-09-22.ts          # DRY
 *   npx tsx scripts/send-a21-licni-2026-09-22.ts --send
 */
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

for (const f of [".env.local", ".env.production"]) {
  const p = path.resolve(__dirname, "..", f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
    const [k, ...v] = line.split("=");
    const key = k?.trim();
    const val = v.join("=").trim().replace(/^["']|["']$/g, "");
    if (key && val && !process.env[key]) process.env[key] = val;
  }
}
const RESEND_KEY = process.env.RESEND_API_KEY!;
if (!RESEND_KEY || RESEND_KEY.length < 20) throw new Error("RESEND_API_KEY nije postavljen");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const FROM = "Hartweger <info@hartweger.rs>";
const KAMPANJA = "a21-licni-2026-09-22";
const SEND = process.argv.includes("--send");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const A21_URL = "https://www.hartweger.rs/kursevi/grupni-kurs-nemackog-jezika-a2";
const TEST_URL = "https://www.hartweger.rs/besplatno-testiranje";

interface Primalac { email: string; ime: string; subject: string; uvod: string; napomena?: string; }
const P = (t: string) => `<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px">${t}</p>`;

const A21_BOX = `<div style="background:#f6f3fc;border-left:3px solid #8f7ad3;border-radius:6px;padding:16px 18px;margin:0 0 14px"><div style="font-size:15px;line-height:1.7;color:#1a1a2e"><strong>Grupni kurs A2.1</strong><br>prvi čas <strong>četvrtak 01.10. u 19:00</strong>, profesorka Milica Vučić<br>utorkom i četvrtkom 19:00-20:00, 7 nedelja i 14 časova, do 17.11.<br><a href="${A21_URL}" style="color:#4fb1d3;font-weight:700">Pogledaj A2.1 →</a></div></div>`;

function buildEmail(p: Primalac): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f8f9fa;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e">
<span style="display:none;max-height:0;overflow:hidden;color:#f8f9fa">A2.1 kreće u četvrtak 01.10. u 19h, mala grupa do 6 polaznika.</span>
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="text-align:center;padding:8px 0 20px"><img src="https://www.hartweger.rs/logo.jpg" alt="Hartweger" width="150" style="max-width:150px;height:auto"><div style="font-size:13px;color:#999;margin-top:6px">Škola nemačkog jezika</div></div>
<div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px">Ćao ${p.ime},</p>
${p.uvod}
${A21_BOX}
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px"><strong>Šta kurs nosi:</strong> živu online nastavu u maloj grupi do 6 polaznika, video lekcije prof. Nataše Hartweger uz vežbe i testove na platformi dostupne 24/7 godinu dana, objašnjenja na našem jeziku, sav materijal uključen bez kupovine udžbenika i sertifikat po položenom završnom ispitu.</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">Cena je <strong>19.600 din.</strong> (oko 168 €), moguće i na rate karticama Banca Intesa. Mesto se zauzima kad uplata prođe.</p>
${p.napomena ?? ""}
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 22px">Ako imaš bilo kakvo pitanje ili ti termin ne odgovara, samo odgovori na ovaj mejl.</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:20px 0 0">Pozdrav,<br><strong>Hartweger tim</strong></p>
</div>
<div style="text-align:center;font-size:12px;color:#999;padding:18px 0">Hartweger - Škola nemačkog jezika · <a href="https://www.hartweger.rs" style="color:#999">hartweger.rs</a><br>Dobijaš ovaj mejl jer si nam se javio/la sa pitanjem o kursevima nemačkog.</div>
</div></body></html>`;
}

const PRIMAOCI: Primalac[] = [
  { email: "violeta95jankovic@gmail.com", ime: "Violeta",
    subject: "Otvoren je termin za A2.1 - četvrtak 01.10.",
    uvod: P(`početkom septembra nam je sa tvoje adrese stigao zahtev da javimo kad se otvori termin za A2.1. Otvoren je - i kreće sledeće nedelje, u četvrtak 01.10.`),
    napomena: P(`Ako nisi sigurna da li je A2.1 pravi ulaz, uradi naše <a href="${TEST_URL}" style="color:#4fb1d3;font-weight:700">besplatno testiranje</a> - traje par minuta i odmah dobijaš preporuku.`) },
  { email: "aleksandarlukic@outlook.de", ime: "Aleksandre",
    subject: "Novi termin za A2.1 - četvrtak 01.10.",
    uvod: P(`u avgustu smo se dopisivali oko upisa u A2.1 grupu i plaćanja iz inostranstva, a upis se tada nije završio. Sad kreće nov termin, pa ti javljamo na vreme:`),
    napomena: P(`Plaćanje iz Nemačke ide bilo kojom platnom karticom bez provizije (Visa, Mastercard, Amex), a moguć je i PayPal uz proviziju. Ako nešto zapne pri plaćanju, odgovori na ovaj mejl i rešićemo zajedno.`) },
];

async function logCrm(p: Primalac, resendId: string | null) {
  const { data: c, error: e1 } = await supabase.from("crm_contacts").select("id, stage").ilike("email", p.email).maybeSingle();
  if (e1 || !c) throw new Error(`crm_contacts ${p.email}: ${e1?.message ?? "nema kontakta"}`);
  const { error: e3 } = await supabase.from("crm_interactions").insert({
    contact_id: c.id, channel: "mejl", direction: "odlazna",
    summary: `Lični mejl: ${p.subject}`,
    body: `Poslato preko Resend skripte send-a21-licni-2026-09-22.ts. Resend id: ${resendId ?? "?"}`,
    occurred_at: new Date().toISOString(), meta: { kampanja: KAMPANJA, resend_id: resendId },
  });
  if (e3) throw new Error(`crm_interactions ${p.email}: ${e3.message}`);
  const patch: Record<string, unknown> = { last_interaction_at: new Date().toISOString(), level: "A2" };
  if (c.stage === "nov") patch.stage = "kontaktiran";
  const { error: e4 } = await supabase.from("crm_contacts").update(patch).eq("id", c.id);
  if (e4) throw new Error(`crm_contacts update ${p.email}: ${e4.message}`);
}

async function run() {
  const emails = PRIMAOCI.map((p) => p.email.toLowerCase());
  const { data: opt } = await supabase.from("email_optouts").select("email").in("email", emails);
  if (opt && opt.length) throw new Error(`Odjavljeni: ${opt.map((o) => o.email).join(", ")}`);
  console.log(`Primalaca: ${PRIMAOCI.length} | ${KAMPANJA}`);
  if (!SEND) { PRIMAOCI.forEach((p) => console.log(`  ${p.email} - ${p.subject}`)); console.log("[DRY]"); return; }
  const poslato: Array<{ email: string; resend_id: string | null; crm: boolean }> = [];
  for (const p of PRIMAOCI) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `${KAMPANJA}/${p.email}` },
      body: JSON.stringify({ from: FROM, to: [p.email], reply_to: "info@hartweger.rs", subject: p.subject, html: buildEmail(p) }),
    });
    if (!res.ok) { console.error(`  ✗ ${p.email}: ${res.status} ${await res.text()}`); continue; }
    const body = await res.json().catch(() => ({}));
    const rid = body?.id ?? null;
    let crm = true;
    try { await logCrm(p, rid); } catch (e) { crm = false; console.error(`  ⚠ CRM: ${(e as Error).message}`); }
    poslato.push({ email: p.email, resend_id: rid, crm });
    console.log(`  ✓ ${p.email} ${rid ?? ""}${crm ? "" : " (CRM NIJE upisan)"}`);
    await sleep(600);
  }
  fs.writeFileSync(path.resolve(__dirname, "_a21_licni_sent_2026-09-22.json"), JSON.stringify(poslato, null, 2));
  console.log(`✓ Poslato: ${poslato.length} od ${PRIMAOCI.length}`);
}
run().catch((e) => { console.error(e); process.exit(1); });
