/**
 * Ponuda za B1 nivo - NaKI publika (crm level=B1, source=naki, stage nov/kontaktiran).
 * NaKI ne razlikuje B1.1 od B1.2, pa mejl nudi OBA otvorena termina + link na besplatno
 * testiranje za one koji ne znaju gde stoje:
 *   B1.2 - cetvrtak 13.08. u 18h, Milica Vucic, do 29.09.
 *   B1.1 - utorak   18.08. u 18h, Suzana Marjanovic, do 01.10.
 *
 * Filteri iskljucenja (isti kao send-b12-ponuda.ts) + dedup vs danasnja B1.2 kampanja:
 *   orders.payment_status='completed' + course_access + individual_enrollments
 *   + email_optouts + email_bounces + _b12_ponuda_sent_2026-08-11.json
 *
 *   npx tsx scripts/send-b1-naki-ponuda.ts            # DRY - lista i brojevi
 *   npx tsx scripts/send-b1-naki-ponuda.ts --preview  # DRY + snimi HTML pregled
 *   npx tsx scripts/send-b1-naki-ponuda.ts --send
 */
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

for (const f of [".env.local", ".env.production"]) {
  const p = path.resolve(__dirname, "..", f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
    const [k, ...v] = line.split("=");
    if (k && v.length && !process.env[k.trim()]) process.env[k.trim()] = v.join("=").trim();
  }
}
const RESEND_KEY = process.env.RESEND_API_KEY!;
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FROM = "Hartweger <info@hartweger.rs>";
const SUBJECT = "Dva B1 termina kreću ove nedelje - koji je tvoj?";
const B12_URL = "https://www.hartweger.rs/kursevi/grupni-kurs-nemackog-b1-2";
const B11_URL = "https://www.hartweger.rs/kursevi/grupni-kurs-nemackog-jezika-b1-1-2";
const TEST_URL = "https://www.hartweger.rs/besplatno-testiranje";
const KAMPANJA = "b1-naki-ponuda-2026-08-11";
const SEND = process.argv.includes("--send");
const PREVIEW = process.argv.includes("--preview");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Primalac { email: string; name: string | null; crm_id: string | null; }

function cistoIme(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const n = raw.trim();
  if (!n || n.includes("@")) return null;
  return n.split(/\s+/)[0];
}

function buildEmail(firstName: string | null): string {
  const pozdrav = firstName ? `Ćao ${firstName},` : "Ćao,";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f8f9fa;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e">
<span style="display:none;max-height:0;overflow:hidden;color:#f8f9fa">B1.1 i B1.2 kreću ove nedelje - male grupe, po 6 polaznika.</span>
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="text-align:center;padding:8px 0 20px"><img src="https://www.hartweger.rs/logo.jpg" alt="Hartweger" width="150" style="max-width:150px;height:auto"><div style="font-size:13px;color:#999;margin-top:6px">Škola nemačkog jezika</div></div>
<div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
<h1 style="font-size:22px;margin:0 0 16px;color:#1a1a2e">B1 kreće ove nedelje - u dva termina</h1>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px">${pozdrav}</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">iz razgovora sa NaKI, našim asistentom za nemački, videli smo da si negde na B1 nivou. Ove nedelje otvaramo <strong>oba B1 termina</strong>, pa biraš onaj koji ti odgovara:</p>
<div style="background:#fff8f3;border-left:3px solid #e8915a;border-radius:6px;padding:16px 18px;margin:0 0 14px"><div style="font-size:15px;line-height:1.7;color:#1a1a2e"><strong>B1.1 - ako tek ulaziš u B1</strong><br>prvi čas <strong>utorak 18.08. u 18:00</strong>, sa profesorkom Suzanom Marjanović<br>utorkom i četvrtkom 18:00-19:00, do 01.10.<br><a href="${B11_URL}" style="color:#4fb1d3;font-weight:700">Pogledaj B1.1 →</a></div></div>
<div style="background:#f3f9fc;border-left:3px solid #4fb1d3;border-radius:6px;padding:16px 18px;margin:0 0 18px"><div style="font-size:15px;line-height:1.7;color:#1a1a2e"><strong>B1.2 - ako si B1.1 već završio/la</strong><br>prvi čas <strong>četvrtak 13.08. u 18:00</strong>, sa profesorkom Milicom Vučić<br>utorkom i četvrtkom 18:00-19:00, do 29.09.<br><a href="${B12_URL}" style="color:#4fb1d3;font-weight:700">Pogledaj B1.2 →</a></div></div>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px"><strong>Oba kursa nose isto:</strong> živu online nastavu u maloj grupi do 6 polaznika, 7 nedelja i 14 časova, video lekcije prof. Nataše Hartweger uz vežbe i testove na platformi dostupne 24/7 godinu dana, objašnjenja na našem jeziku, sav materijal uključen bez kupovine udžbenika i sertifikat po položenom završnom ispitu.</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">Cena je ista za oba: <strong>19.600 din.</strong> (oko 168 €) - moguće i na rate karticama Banca Intesa. Mesto se zauzima kad uplata prođe.</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 22px">Nisi siguran/na koji je tvoj nivo? Uradi naše <a href="${TEST_URL}" style="color:#4fb1d3;font-weight:700">besplatno testiranje</a> - traje par minuta i odmah dobijaš preporuku. Ako ti nijedan termin ne odgovara ili imaš pitanje, samo odgovori na ovaj mejl.</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:20px 0 0">Pozdrav,<br><strong>Hartweger tim</strong></p>
</div>
<div style="text-align:center;font-size:12px;color:#999;padding:18px 0">Hartweger - Škola nemačkog jezika · <a href="https://www.hartweger.rs" style="color:#999">hartweger.rs</a><br>Dobijaš ovaj mejl jer si nam se javio/la sa pitanjem o kursevima nemačkog.</div>
</div></body></html>`;
}

const validEmail = (e: string) =>
  /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) && !/\.(con|comcom|gamil\.com)$/.test(e);

async function fetchAll<T>(table: string, select: string): Promise<T[]> {
  const out: T[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await supabase.from(table).select(select).range(from, from + page - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...(data as T[]));
    if (!data || data.length < page) break;
  }
  return out;
}

async function buildAudience(): Promise<Primalac[]> {
  const porudzbine = await fetchAll<{ email: string; payment_status: string }>("orders", "email, payment_status");
  const kontakti = await fetchAll<{ id: string; email: string; name: string | null; level: string | null; source: string; stage: string }>(
    "crm_contacts", "id, email, name, level, source, stage");
  const optouts = await fetchAll<{ email: string }>("email_optouts", "email");
  const bounces = await fetchAll<{ email: string }>("email_bounces", "email");

  const izbaci = new Set<string>();
  for (const o of porudzbine) if (o.email && o.payment_status === "completed") izbaci.add(o.email.toLowerCase());
  for (const r of optouts) if (r.email) izbaci.add(r.email.toLowerCase());
  for (const r of bounces) if (r.email) izbaci.add(r.email.toLowerCase());

  // dedup vs danasnja B1.2 kampanja - niko ne dobija dva mejla isti dan
  const b12Path = path.resolve(__dirname, "_b12_ponuda_sent_2026-08-11.json");
  if (fs.existsSync(b12Path)) {
    const b12: Array<{ email: string }> = JSON.parse(fs.readFileSync(b12Path, "utf-8"));
    for (const r of b12) izbaci.add(r.email.toLowerCase());
  }

  const pristupi = await fetchAll<{ user_id: string }>("course_access", "user_id");
  const individualni = await fetchAll<{ user_id: string }>("individual_enrollments", "user_id");
  const saPristupom = new Set([...pristupi, ...individualni].map((a) => a.user_id));
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`auth users: ${error.message}`);
    for (const u of data.users) {
      if (u.email && saPristupom.has(u.id)) izbaci.add(u.email.toLowerCase());
    }
    if (data.users.length < 1000) break;
  }

  const primaoci: Primalac[] = [];
  const uzeto = new Set<string>();
  for (const c of kontakti.filter((c) => c.email)) {
    const email = c.email.toLowerCase();
    if (c.source === "naki" && c.level === "B1" && ["nov", "kontaktiran"].includes(c.stage) &&
        validEmail(email) && !izbaci.has(email) && !uzeto.has(email)) {
      primaoci.push({ email, name: cistoIme(c.name), crm_id: c.id });
      uzeto.add(email);
    }
  }
  return primaoci;
}

async function run() {
  const publika = await buildAudience();
  console.log(`Publika: ${publika.length} (NaKI, level B1) | Subject: ${SUBJECT}`);

  if (PREVIEW) {
    const f = path.resolve(__dirname, `_b1_naki_preview.html`);
    fs.writeFileSync(f, buildEmail("Ime"));
    console.log(`Pregled: ${f}`);
  }
  if (!SEND) {
    publika.forEach((p) => console.log(`  ${p.email}${p.name ? ` (${p.name})` : ""}`));
    console.log(`\n[DRY] --send da pošaljem.`);
    return;
  }

  fs.writeFileSync(path.resolve(__dirname, "_b1_naki_ponuda_2026-08-11.json"), JSON.stringify(publika, null, 2));

  let ok = 0, fail = 0;
  const poslato: Array<{ email: string; crm_id: string | null }> = [];
  for (const p of publika) {
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
    if (res.ok) { ok++; poslato.push({ email: p.email, crm_id: p.crm_id }); }
    else { fail++; console.error(`  ✗ ${p.email}: ${res.status} ${await res.text()}`); }
    await sleep(600);
  }
  console.log(`\n✓ Poslato: ${ok}, neuspeha: ${fail} (od ${publika.length}).`);
  fs.writeFileSync(path.resolve(__dirname, "_b1_naki_ponuda_sent_2026-08-11.json"), JSON.stringify(poslato, null, 2));
  console.log(`Lista poslatih u _b1_naki_ponuda_sent_2026-08-11.json - sledi CRM sinhronizacija.`);
}
run().catch((e) => { console.error(e); process.exit(1); });
