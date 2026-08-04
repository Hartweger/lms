/**
 * Ponuda za A2.1 grupu (start sreda 05.08.2026 u 18h, pon+sre 18-19h) - tri publike:
 *  - "test": rezultat A2.1 na besplatnom testiranju (poslednji test po mejlu, bez kupovine)
 *  - "naki": NaKI lidovi level=A2, stage nov/kontaktiran (nivo iz caskanja - poziv na testiranje)
 *  - "prag": rezultat A1.2 sa 7/10 na A1.2 bloku (jedno pitanje od praga za A2.1)
 * Publika se racuna zivo iz baze; snapshot se snima u _a21_ponuda_2026-08-04.json.
 *
 *   npx tsx scripts/send-a21-ponuda.ts            # DRY - lista i brojevi
 *   npx tsx scripts/send-a21-ponuda.ts --preview  # DRY + snimi HTML pregled sve 3 varijante
 *   npx tsx scripts/send-a21-ponuda.ts --send
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
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FROM = "Hartweger <info@hartweger.rs>";
const SUBJECT = "A2.1 grupa kreće sutra u 18h - još 3 mesta";
const KURS_URL = "https://www.hartweger.rs/kursevi/grupni-kurs-nemackog-jezika-a2";
const TEST_URL = "https://www.hartweger.rs/besplatno-testiranje";
const KAMPANJA = "a21-ponuda-2026-08-04";
const SEND = process.argv.includes("--send");
const PREVIEW = process.argv.includes("--preview");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Variant = "test" | "naki" | "prag";
interface Primalac { email: string; name: string | null; crm_id: string | null; }

function cistoIme(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const n = raw.trim();
  if (!n || n.includes("@")) return null;
  return n.split(/\s+/)[0];
}

function buildEmail(firstName: string | null, variant: Variant): string {
  const pozdrav = firstName ? `Ćao ${firstName},` : "Ćao,";
  const uvod =
    variant === "test"
      ? `rezultat tvog besplatnog testiranja pokazao je da je <strong>A2.1 tvoj sledeći korak</strong> - i baš takva grupa kreće <strong>sutra, u sredu 05.08. u 18:00</strong>. Mala grupa, opuštena atmosfera i profesorka koja svakom polazniku daje reč na svakom času.`
      : variant === "naki"
      ? `javljao/la si nam se sa pitanjima o učenju nemačkog, a po našem razgovoru A2 nivo ti najviše odgovara. Baš takva grupa - <strong>A2.1</strong> - kreće <strong>sutra, u sredu 05.08. u 18:00</strong>. Mala grupa, opuštena atmosfera i profesorka koja svakom polazniku daje reč na svakom času.`
      : `na našem besplatnom testiranju bio/la si na <strong>samo jedno pitanje od praga za A2.1</strong>. Ako si u međuvremenu makar malo obnavljao/la, ovo je pravi trenutak za sledeći korak: <strong>A2.1 grupa kreće sutra, u sredu 05.08. u 18:00</strong> - a profesorka će ti kroz malu grupu pomoći da brzo popuniš i ono što je ostalo iz A1.`;
  const zavrsni =
    variant === "test"
      ? `<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 22px">Ako imaš bilo koje pitanje pre prijave, samo odgovori na ovaj mejl.</p>`
      : variant === "naki"
      ? `<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 22px">Ako nisi siguran/na da li je A2.1 pravi nivo za tebe, uradi naše <a href="${TEST_URL}" style="color:#4fb1d3">besplatno testiranje</a> (traje 15 minuta) ili samo odgovori na ovaj mejl pa ćemo te posavetovati.</p>`
      : `<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 22px">Ako nisi siguran/na da li si spreman/na, <a href="${TEST_URL}" style="color:#4fb1d3">ponovi testiranje</a> (traje 15 minuta) ili samo odgovori na ovaj mejl pa ćemo te posavetovati - bez ikakve obaveze.</p>`;
  const footer =
    variant === "naki"
      ? "Dobijaš ovaj mejl jer si nam se javio/la sa pitanjem o kursevima nemačkog."
      : "Dobijaš ovaj mejl jer si uradio/la naše besplatno testiranje nemačkog.";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f8f9fa;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e">
<span style="display:none;max-height:0;overflow:hidden;color:#f8f9fa">A2.1 grupa kreće sutra u 18h - mala grupa, još 3 slobodna mesta.</span>
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="text-align:center;padding:8px 0 20px"><img src="https://www.hartweger.rs/logo.jpg" alt="Hartweger" width="150" style="max-width:150px;height:auto"><div style="font-size:13px;color:#999;margin-top:6px">Škola nemačkog jezika</div></div>
<div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
<h1 style="font-size:22px;margin:0 0 16px;color:#1a1a2e">A2.1 grupa kreće sutra u 18:00 - još 3 mesta</h1>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px">${pozdrav}</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">${uvod}</p>
<div style="background:#fff8f3;border-left:3px solid #e8915a;border-radius:6px;padding:16px 18px;margin:0 0 18px"><div style="font-size:15px;line-height:1.8;color:#1a1a2e"><strong>Šta te čeka:</strong><br>• živa online nastava sa profesorkom, ponedeljkom i sredom 18:00-19:00<br>• mala grupa, najviše 6 polaznika - upisano je već troje, ostala su 3 mesta<br>• 7 nedelja nastave + video lekcije, vežbe i testovi na platformi, dostupni 24/7<br>• sertifikat po položenom završnom ispitu</div></div>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">Cena celog kursa: <strong>19.600 din.</strong></p>
<div style="text-align:center;margin:26px 0"><a href="${KURS_URL}" style="display:inline-block;background:#4fb1d3;color:#fff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 34px;border-radius:8px">Rezerviši svoje mesto →</a></div>
${zavrsni}
<p style="font-size:15px;line-height:1.6;color:#444;margin:0">Vidimo se sutra u 18h?</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:20px 0 0">Pozdrav,<br><strong>Hartweger tim</strong></p>
</div>
<div style="text-align:center;font-size:12px;color:#999;padding:18px 0">Hartweger - Škola nemačkog jezika · <a href="https://www.hartweger.rs" style="color:#999">hartweger.rs</a><br>${footer}</div>
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

async function buildAudience() {
  const testovi = await fetchAll<{ email: string | null; recommended_level: string; scores: Record<string, number> | null; created_at: string }>(
    "placement_test_results", "email, recommended_level, scores, created_at");
  const porudzbine = await fetchAll<{ email: string; payment_status: string }>("orders", "email, payment_status");
  const kontakti = await fetchAll<{ id: string; email: string; name: string | null; level: string | null; source: string; stage: string }>(
    "crm_contacts", "id, email, name, level, source, stage");

  const kupci = new Set(porudzbine.filter((o) => o.email && o.payment_status === "completed").map((o) => o.email.toLowerCase()));

  // i svi sa bilo kakvim pristupom kursu (WP migracija, rucni upisi) - kao u julskoj kampanji
  const pristupi = await fetchAll<{ user_id: string }>("course_access", "user_id");
  const saPristupom = new Set(pristupi.map((a) => a.user_id));
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`auth users: ${error.message}`);
    for (const u of data.users) {
      if (u.email && saPristupom.has(u.id)) kupci.add(u.email.toLowerCase());
    }
    if (data.users.length < 1000) break;
  }
  const saMejlom = kontakti.filter((c) => c.email);
  const crmPoMejlu = new Map(saMejlom.map((c) => [c.email.toLowerCase(), c]));

  // poslednji test po mejlu
  const poslednji = new Map<string, { recommended_level: string; scores: Record<string, number> | null }>();
  for (const t of testovi
    .filter((t) => t.email && validEmail(t.email))
    .sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    poslednji.set(t.email!.toLowerCase(), { recommended_level: t.recommended_level, scores: t.scores });
  }

  const uzeto = new Set<string>();
  const mk = (email: string): Primalac => {
    const c = crmPoMejlu.get(email);
    return { email, name: cistoIme(c?.name), crm_id: c?.id ?? null };
  };

  const test: Primalac[] = [];
  for (const [email, t] of poslednji) {
    if (t.recommended_level === "A2.1" && !kupci.has(email)) { test.push(mk(email)); uzeto.add(email); }
  }
  const naki: Primalac[] = [];
  for (const c of saMejlom) {
    const email = c.email.toLowerCase();
    if (c.source === "naki" && c.level === "A2" && ["nov", "kontaktiran"].includes(c.stage) &&
        validEmail(email) && !kupci.has(email) && !uzeto.has(email)) {
      naki.push({ email, name: cistoIme(c.name), crm_id: c.id }); uzeto.add(email);
    }
  }
  const prag: Primalac[] = [];
  for (const [email, t] of poslednji) {
    if (t.recommended_level === "A1.2" && t.scores?.["A1.2"] === 7 && !kupci.has(email) && !uzeto.has(email)) {
      prag.push(mk(email)); uzeto.add(email);
    }
  }
  return { test, naki, prag };
}

async function run() {
  const publika = await buildAudience();
  const { test, naki, prag } = publika;
  const ukupno = test.length + naki.length + prag.length;
  console.log(`Publika: ${test.length} test + ${naki.length} naki + ${prag.length} prag = ${ukupno} | Subject: ${SUBJECT}`);

  if (PREVIEW) {
    for (const v of ["test", "naki", "prag"] as Variant[]) {
      const f = path.resolve(__dirname, `_a21_preview_${v}.html`);
      fs.writeFileSync(f, buildEmail("Ime", v));
      console.log(`Pregled: ${f}`);
    }
  }
  if (!SEND) {
    (["test", "naki", "prag"] as Variant[]).forEach((v) =>
      publika[v].forEach((p) => console.log(`  [${v}] ${p.email}${p.name ? ` (${p.name})` : ""}`)));
    console.log(`\n[DRY] --send da pošaljem.`);
    return;
  }

  fs.writeFileSync(path.resolve(__dirname, "_a21_ponuda_2026-08-04.json"), JSON.stringify(publika, null, 2));

  let ok = 0, fail = 0;
  const poslato: Array<{ email: string; crm_id: string | null; variant: Variant }> = [];
  const red: Array<{ p: Primalac; variant: Variant }> = [
    ...test.map((p) => ({ p, variant: "test" as const })),
    ...naki.map((p) => ({ p, variant: "naki" as const })),
    ...prag.map((p) => ({ p, variant: "prag" as const })),
  ];
  for (const { p, variant } of red) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `${KAMPANJA}/${p.email}`,
      },
      body: JSON.stringify({
        from: FROM, to: [p.email], reply_to: "info@hartweger.rs",
        subject: SUBJECT, html: buildEmail(p.name, variant),
      }),
    });
    if (res.ok) { ok++; poslato.push({ email: p.email, crm_id: p.crm_id, variant }); }
    else { fail++; console.error(`  ✗ ${p.email}: ${res.status} ${await res.text()}`); }
    await sleep(600);
  }
  console.log(`\n✓ Poslato: ${ok}, neuspeha: ${fail} (od ${red.length}).`);
  fs.writeFileSync(path.resolve(__dirname, "_a21_ponuda_sent_2026-08-04.json"), JSON.stringify(poslato, null, 2));
  console.log(`Lista poslatih u _a21_ponuda_sent_2026-08-04.json - sledi CRM sinhronizacija.`);
}
run().catch((e) => { console.error(e); process.exit(1); });
