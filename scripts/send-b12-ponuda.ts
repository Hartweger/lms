/**
 * Ponuda za B1.2 grupu (prvi cas cetvrtak 13.08.2026 u 18h, uto+cet 18-19h, Milica Vucic).
 * Publika: poslednji test po mejlu = B1.2 (dakle B1.1 savladan, fali jos jedan korak do punog B1).
 * NaKI lidovi level=B1 NISU ukljuceni - NaKI ne razlikuje B1.1 od B1.2, pa bi dobar deo dobio
 * ponudu za pogresan nivo (za njih ide B1.1 grupa od 18.08).
 * Publika se racuna zivo iz baze; snapshot se snima u _b12_ponuda_2026-08-11.json.
 *
 * Filteri iskljucenja (isti kao send-a11-ponuda.ts):
 *   orders.payment_status='completed' + course_access + individual_enrollments
 *   + email_optouts + email_bounces
 *
 *   npx tsx scripts/send-b12-ponuda.ts            # DRY - lista i brojevi
 *   npx tsx scripts/send-b12-ponuda.ts --preview  # DRY + snimi HTML pregled
 *   npx tsx scripts/send-b12-ponuda.ts --send
 */
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

// .env.local nema RESEND_API_KEY (zivi u .env.production) - ucitavamo oba, prvi pobedjuje
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
const SUBJECT = "B1.2 grupa kreće u četvrtak - završi B1 do kraja septembra";
const KURS_URL = "https://www.hartweger.rs/kursevi/grupni-kurs-nemackog-b1-2";
const KAMPANJA = "b12-ponuda-2026-08-11";
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
<span style="display:none;max-height:0;overflow:hidden;color:#f8f9fa">Mala grupa, prvi čas u četvrtak u 18h - kraj kursa 29.09.</span>
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="text-align:center;padding:8px 0 20px"><img src="https://www.hartweger.rs/logo.jpg" alt="Hartweger" width="150" style="max-width:150px;height:auto"><div style="font-size:13px;color:#999;margin-top:6px">Škola nemačkog jezika</div></div>
<div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
<h1 style="font-size:22px;margin:0 0 16px;color:#1a1a2e">Fali ti još jedan korak do punog B1</h1>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px">${pozdrav}</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">na našem besplatnom testiranju tvoj rezultat je bio <strong>B1.2</strong> - znači da si B1.1 već iza sebe i da ti fali još samo jedan korak do kompletnog B1.</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">Taj korak sad kreće: <strong>B1.2 grupa počinje u četvrtak 13.08. u 18:00</strong>, a završava se 29.09.</p>
<div style="background:#fff8f3;border-left:3px solid #e8915a;border-radius:6px;padding:16px 18px;margin:0 0 18px"><div style="font-size:15px;line-height:1.8;color:#1a1a2e"><strong>Šta te čeka:</strong><br>• živa online nastava sa profesorkom Milicom Vučić, utorkom i četvrtkom 18:00-19:00<br>• mala grupa, najviše 6 polaznika - trenutno je 5 mesta slobodno<br>• 7 nedelja nastave, ukupno 14 časova<br>• video lekcije prof. Nataše Hartweger, vežbe i testovi na platformi, dostupni 24/7 godinu dana<br>• objašnjenja na našem jeziku, uz konverzaciju na svakom času<br>• sav materijal je uključen, udžbenike ne kupuješ<br>• sertifikat po položenom završnom ispitu</div></div>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">Na B1.2 se zaokružuje ono što B1 nivo zapravo traži: da vodiš razgovor o poslu, planovima i iskustvu, razumeš duži tekst i izraziš mišljenje bez pripreme. To je nivo koji se najčešće traži za posao i papire u Nemačkoj.</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">Cena celog kursa: <strong>19.600 din.</strong> (oko 168 €) - moguće i na rate karticama Banca Intesa. Mesto se zauzima kad uplata prođe.</p>
<div style="text-align:center;margin:26px 0"><a href="${KURS_URL}" style="display:inline-block;background:#4fb1d3;color:#fff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 34px;border-radius:8px">Rezerviši svoje mesto →</a></div>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 22px">Ako ti termin od 18h ne odgovara ili imaš bilo koje pitanje, samo odgovori na ovaj mejl - stavljamo te na listu za sledeći B1.2 termin.</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:20px 0 0">Pozdrav,<br><strong>Hartweger tim</strong></p>
</div>
<div style="text-align:center;font-size:12px;color:#999;padding:18px 0">Hartweger - Škola nemačkog jezika · <a href="https://www.hartweger.rs" style="color:#999">hartweger.rs</a><br>Dobijaš ovaj mejl jer si uradio/la naše besplatno testiranje nemačkog.</div>
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
  const testovi = await fetchAll<{ email: string | null; recommended_level: string; created_at: string }>(
    "placement_test_results", "email, recommended_level, created_at");
  const porudzbine = await fetchAll<{ email: string; payment_status: string }>("orders", "email, payment_status");
  const kontakti = await fetchAll<{ id: string; email: string; name: string | null; level: string | null; source: string; stage: string }>(
    "crm_contacts", "id, email, name, level, source, stage");
  const optouts = await fetchAll<{ email: string }>("email_optouts", "email");
  const bounces = await fetchAll<{ email: string }>("email_bounces", "email");

  // iskljuceni: platili, imaju bilo kakav pristup, odjavili se ili im mejl pada
  const izbaci = new Set<string>();
  for (const o of porudzbine) if (o.email && o.payment_status === "completed") izbaci.add(o.email.toLowerCase());
  for (const r of optouts) if (r.email) izbaci.add(r.email.toLowerCase());
  for (const r of bounces) if (r.email) izbaci.add(r.email.toLowerCase());

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

  const saMejlom = kontakti.filter((c) => c.email);
  const crmPoMejlu = new Map(saMejlom.map((c) => [c.email.toLowerCase(), c]));

  // poslednji test po mejlu
  const poslednji = new Map<string, string>();
  for (const t of testovi
    .filter((t) => t.email && validEmail(t.email))
    .sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    poslednji.set(t.email!.toLowerCase(), t.recommended_level);
  }

  const primaoci: Primalac[] = [];
  for (const [email, nivo] of poslednji) {
    if (nivo === "B1.2" && !izbaci.has(email)) {
      const c = crmPoMejlu.get(email);
      primaoci.push({ email, name: cistoIme(c?.name), crm_id: c?.id ?? null });
    }
  }
  return primaoci;
}

async function run() {
  const publika = await buildAudience();
  console.log(`Publika: ${publika.length} (poslednji test = B1.2) | Subject: ${SUBJECT}`);

  if (PREVIEW) {
    const f = path.resolve(__dirname, `_b12_preview.html`);
    fs.writeFileSync(f, buildEmail("Ime"));
    console.log(`Pregled: ${f}`);
  }
  if (!SEND) {
    publika.forEach((p) => console.log(`  ${p.email}${p.name ? ` (${p.name})` : ""}`));
    console.log(`\n[DRY] --send da pošaljem.`);
    return;
  }

  fs.writeFileSync(path.resolve(__dirname, "_b12_ponuda_2026-08-11.json"), JSON.stringify(publika, null, 2));

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
  fs.writeFileSync(path.resolve(__dirname, "_b12_ponuda_sent_2026-08-11.json"), JSON.stringify(poslato, null, 2));
  console.log(`Lista poslatih u _b12_ponuda_sent_2026-08-11.json - sledi CRM sinhronizacija.`);
}
run().catch((e) => { console.error(e); process.exit(1); });
