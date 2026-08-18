/**
 * Ponuda za B1.1 grupu (prvi cas utorak 18.08.2026 u 18h, uto+cet 18-19h, Suzana Marjanovic).
 * Publika: poslednji test po mejlu = B1.1 I nikad nije dobio/la nijednu odlaznu CRM kampanju.
 * Namerno usko: 38 od 51 kandidata je vec dobilo neku kampanju, njima se danas ne salje.
 *
 * Filteri iskljucenja:
 *   orders.payment_status='completed' + course_access + individual_enrollments
 *   + email_optouts + email_bounces
 *   + sumnjivi domeni (suggestEmailFix) - npr. gmai.com je registrovan typosquat,
 *     ne bounce-uje nego tiho odlazi trecem licu
 *   + svako ko ima ijednu `odlazna` interakciju u crm_interactions
 *
 *   npx tsx scripts/send-b11-ponuda-avg.ts            # DRY
 *   npx tsx scripts/send-b11-ponuda-avg.ts --preview  # DRY + HTML pregled
 *   npx tsx scripts/send-b11-ponuda-avg.ts --send
 */
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { suggestEmailFix } from "../src/lib/crm/email-typos";

// RESEND_API_KEY dolazi iz shell okruzenja (~/.zshrc). U .env.production je PRAZAN.
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
if (!RESEND_KEY || RESEND_KEY.length < 20) throw new Error("RESEND_API_KEY nije postavljen (proveri shell okruzenje)");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FROM = "Hartweger <info@hartweger.rs>";
const SUBJECT = "B1.1 grupa kreće sutra u 18h - ima još mesta";
const KURS_URL = "https://www.hartweger.rs/kursevi/grupni-kurs-nemackog-jezika-b1-1-2";
const KAMPANJA = "b11-ponuda-2026-08-17";
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
<span style="display:none;max-height:0;overflow:hidden;color:#f8f9fa">Mala grupa do 6 polaznika, prvi čas u utorak u 18h.</span>
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="text-align:center;padding:8px 0 20px"><img src="https://www.hartweger.rs/logo.jpg" alt="Hartweger" width="150" style="max-width:150px;height:auto"><div style="font-size:13px;color:#999;margin-top:6px">Škola nemačkog jezika</div></div>
<div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
<h1 style="font-size:22px;margin:0 0 16px;color:#1a1a2e">B1.1 kreće sutra - tvoj nivo je spreman</h1>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px">${pozdrav}</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">na našem besplatnom testiranju tvoj rezultat je bio <strong>B1.1</strong>. Taj termin sad otvaramo: <strong>prvi čas je sutra, u utorak 18.08. u 18:00</strong>, a kurs se završava 01.10.</p>
<div style="background:#fff8f3;border-left:3px solid #e8915a;border-radius:6px;padding:16px 18px;margin:0 0 18px"><div style="font-size:15px;line-height:1.8;color:#1a1a2e"><strong>Šta te čeka:</strong><br>• živa online nastava sa profesorkom Suzanom Marjanović, utorkom i četvrtkom 18:00-19:00<br>• mala grupa, najviše 6 polaznika - trenutno je 5 mesta slobodno<br>• 7 nedelja nastave, ukupno 14 časova<br>• video lekcije prof. Nataše Hartweger, vežbe i testovi na platformi, dostupni 24/7 godinu dana<br>• objašnjenja na našem jeziku, uz konverzaciju na svakom času<br>• sav materijal je uključen, udžbenike ne kupuješ<br>• sertifikat po položenom završnom ispitu</div></div>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">B1 je nivo na kom nemački prestaje da bude učenje napamet - počinješ da pričaš o poslu, planovima i iskustvu svojim rečima. B1.1 je prva polovina tog puta.</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">Cena celog kursa: <strong>19.600 din.</strong> (oko 168 €) - moguće i na rate karticama Banca Intesa. Mesto se zauzima kad uplata prođe.</p>
<div style="text-align:center;margin:26px 0"><a href="${KURS_URL}" style="display:inline-block;background:#4fb1d3;color:#fff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 34px;border-radius:8px">Rezerviši svoje mesto →</a></div>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 22px">Znam da je kratak rok. Ako ti se ne stiže do sutra ili ti termin od 18h ne odgovara, samo odgovori na ovaj mejl - ulazak je moguć i na drugom času, a stavljamo te i na listu za sledeći B1.1 termin.</p>
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

async function buildAudience(): Promise<{ primaoci: Primalac[]; sumnjivi: string[]; vecKontaktirani: number }> {
  const testovi = await fetchAll<{ email: string | null; recommended_level: string; created_at: string }>(
    "placement_test_results", "email, recommended_level, created_at");
  const porudzbine = await fetchAll<{ email: string; payment_status: string }>("orders", "email, payment_status");
  const kontakti = await fetchAll<{ id: string; email: string; name: string | null }>(
    "crm_contacts", "id, email, name");
  const optouts = await fetchAll<{ email: string }>("email_optouts", "email");
  const bounces = await fetchAll<{ email: string }>("email_bounces", "email");
  const odlazne = await fetchAll<{ contact_id: string; direction: string }>(
    "crm_interactions", "contact_id, direction");

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
    for (const u of data.users) if (u.email && saPristupom.has(u.id)) izbaci.add(u.email.toLowerCase());
    if (data.users.length < 1000) break;
  }

  // svako ko je ikad dobio odlaznu kampanju
  const kontaktiraniIds = new Set(odlazne.filter((i) => i.direction === "odlazna").map((i) => i.contact_id));
  const crmPoMejlu = new Map(kontakti.filter((c) => c.email).map((c) => [c.email.toLowerCase(), c]));

  const poslednji = new Map<string, string>();
  for (const t of testovi
    .filter((t) => t.email && validEmail(t.email))
    .sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    poslednji.set(t.email!.toLowerCase(), t.recommended_level);
  }

  const primaoci: Primalac[] = [];
  const sumnjivi: string[] = [];
  let vecKontaktirani = 0;
  for (const [email, nivo] of poslednji) {
    if (nivo !== "B1.1" || izbaci.has(email)) continue;
    const c = crmPoMejlu.get(email);
    if (c && kontaktiraniIds.has(c.id)) { vecKontaktirani++; continue; }
    const sumnja = suggestEmailFix(email);
    if (sumnja) { sumnjivi.push(`${email} (${sumnja.reason}${sumnja.suggestion ? ` → ${sumnja.suggestion}?` : ""})`); continue; }
    primaoci.push({ email, name: cistoIme(c?.name), crm_id: c?.id ?? null });
  }
  return { primaoci, sumnjivi, vecKontaktirani };
}

async function run() {
  const { primaoci, sumnjivi, vecKontaktirani } = await buildAudience();
  console.log(`Publika: ${primaoci.length} (poslednji test = B1.1, nikad kontaktirani) | Subject: ${SUBJECT}`);
  console.log(`Preskočeno: ${vecKontaktirani} već dobili neku kampanju, ${sumnjivi.length} sumnjiv domen`);
  sumnjivi.forEach((s) => console.log(`  ⚠ ${s}`));

  if (PREVIEW) {
    const f = path.resolve(__dirname, `_b11_avg_preview.html`);
    fs.writeFileSync(f, buildEmail("Ime"));
    console.log(`Pregled: ${f}`);
  }
  if (!SEND) {
    primaoci.forEach((p) => console.log(`  ${p.email}${p.name ? ` (${p.name})` : ""}`));
    console.log(`\n[DRY] --send da pošaljem.`);
    return;
  }

  fs.writeFileSync(path.resolve(__dirname, "_b11_avg_ponuda_2026-08-17.json"), JSON.stringify(primaoci, null, 2));

  let ok = 0, fail = 0;
  // cuvamo i Resend id da bi se posle mogla proveriti isporuka/otvaranje
  const poslato: Array<{ email: string; crm_id: string | null; resend_id: string | null }> = [];
  for (const p of primaoci) {
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
    if (res.ok) {
      const body = await res.json().catch(() => ({}));
      ok++; poslato.push({ email: p.email, crm_id: p.crm_id, resend_id: body?.id ?? null });
    } else { fail++; console.error(`  ✗ ${p.email}: ${res.status} ${await res.text()}`); }
    await sleep(600);
  }
  console.log(`\n✓ Poslato: ${ok}, neuspeha: ${fail} (od ${primaoci.length}).`);
  fs.writeFileSync(path.resolve(__dirname, "_b11_avg_ponuda_sent_2026-08-17.json"), JSON.stringify(poslato, null, 2));
  console.log(`Lista poslatih (sa Resend ID-jevima) u _b11_avg_ponuda_sent_2026-08-17.json - sledi CRM sinhronizacija.`);
}
run().catch((e) => { console.error(e); process.exit(1); });
