/**
 * Ponuda za A1.1 grupu koja kreće u ponedeljak 19.10.2026 u 20h (pon+sre 20-21, prof. Milica Vučić).
 * Grupa 28.09 je popunjena (6/6) i kreće danas - 19.10 je prvi sledeći termin za početnike.
 *
 * Dve publike:
 *  - "licni"  : 3 imenovane osobe koje su same tražile A1.1 termin (svaka sa svojim uvodom)
 *  - "masovno": poslednji test po mejlu = A1.1, test u poslednjih 50 dana
 *
 * Isključenja za masovnu publiku:
 *   orders.payment_status='completed' + course_access + individual_enrollments
 *   + email_optouts + email_bounces
 *   + primaoci kampanje a11-ponuda-2026-08-07 (ne šaljemo im drugu A1.1 ponudu)
 *   + ko je dobio automatski mejl iz test-levka u poslednjih 5 dana (test_funnel_emails)
 *   + ko ima otvoren pending/failed checkout u poslednjih 30 dana (njih pokriva recovery)
 *
 *   npx tsx scripts/send-a11-1910-2026-09-28.ts                    # DRY - lista i brojevi
 *   npx tsx scripts/send-a11-1910-2026-09-28.ts --preview          # DRY + HTML pregledi
 *   npx tsx scripts/send-a11-1910-2026-09-28.ts --licni   --send
 *   npx tsx scripts/send-a11-1910-2026-09-28.ts --masovno --send
 */
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [k, ...v] = line.split("=");
  const key = k?.trim();
  const val = v.join("=").trim();
  if (key && val && !process.env[key]) process.env[key] = val; // prazne vrednosti NE prepisuju shell
}
const RESEND_KEY = process.env.RESEND_API_KEY!;
if (!RESEND_KEY || !RESEND_KEY.startsWith("re_") || RESEND_KEY.length < 30) {
  throw new Error("RESEND_API_KEY nije validan - proveri shell okruženje (~/.zshrc).");
}
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FROM = "Hartweger <info@hartweger.rs>";
const KURS_URL = "https://www.hartweger.rs/kursevi/grupni-kurs-nemackog-jezika-a1-1";
const TEST_URL = "https://www.hartweger.rs/besplatno-testiranje";
const KAMPANJA = "a11-1910-2026-09-28";
const SEND = process.argv.includes("--send");
const PREVIEW = process.argv.includes("--preview");
const SAMO_LICNI = process.argv.includes("--licni");
const SAMO_MASOVNO = process.argv.includes("--masovno");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Primalac {
  email: string;
  name: string | null;
  crm_id: string | null;
  uvod?: string; // samo za licne
  subject?: string;
}

/** Tri osobe koje su same tražile A1.1 termin i nikad ga nisu dobile za ovaj ciklus. */
const LICNI: Primalac[] = [
  {
    email: "monnicaandric@yahoo.com",
    name: "Monika",
    crm_id: null,
    subject: "A1.1 grupa - novi termin od 19. oktobra",
    uvod:
      `krajem avgusta si nam ostavila mejl jer za A1.1 nije bilo otvorenog termina, pa smo ti 31.08. poslali ponudu za grupu od 28. septembra. ` +
      `Ta grupa je u međuvremenu popunjena i kreće danas, ali otvorili smo novi termin - <strong>ponedeljak 19.10. u 20:00</strong>.`,
  },
  {
    email: "nebojsa.android@gmail.com",
    name: "Nebojša",
    crm_id: null,
    subject: "A1.1 grupa - novi termin od 19. oktobra",
    uvod:
      `u julu si nam pisao da te zanima grupni A1.1 i kada kreće sledeća grupa. Tada smo ti odgovorili o individualnim časovima, ` +
      `a sada imamo baš ono što si tražio: <strong>grupni A1.1 kreće u ponedeljak 19.10. u 20:00</strong>.`,
  },
  {
    email: "markovicmilka002@gmail.com",
    name: "Milka",
    crm_id: null,
    subject: "Nemački od nule - grupni termin od 19. oktobra",
    uvod:
      `videli smo da si se raspitivala za individualni A1.1 kurs. Ako ti je individualni termin komplikovan da se uklopi, ` +
      `možda ti više odgovara grupa: <strong>A1.1 kreće u ponedeljak 19.10. u 20:00</strong>, ponedeljkom i sredom, ` +
      `i upola je jeftiniji od individualnog.`,
  },
];

const SUBJECT_MASOVNO = "Nemački od nule - nova A1.1 grupa od 19. oktobra";
const UVOD_MASOVNO =
  `na našem besplatnom testiranju tvoj rezultat je bio <strong>A1.1</strong> - to je početni nivo, za sve koji kreću od nule. ` +
  `Grupa koja je krenula danas je popunjena, pa smo otvorili novi termin: <strong>ponedeljak 19.10. u 20:00</strong>.`;

function cistoIme(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const n = raw.trim();
  if (!n || n.includes("@")) return null;
  return n.split(/\s+/)[0];
}

function buildEmail(firstName: string | null, uvod: string, licni: boolean): string {
  const pozdrav = firstName ? `Ćao ${firstName},` : "Ćao,";
  const zavrsni = licni
    ? `<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 22px">Ako ti termin od 20h ne odgovara ili imaš bilo koje pitanje, samo odgovori na ovaj mejl - tu smo.</p>`
    : `<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 22px">Ako nisi siguran/na gde stojiš sa jezikom, uradi naše <a href="${TEST_URL}" style="color:#4fb1d3">besplatno testiranje</a> pa ti predlažemo pravi nivo. A ako ti termin od 20h ne odgovara, samo odgovori na ovaj mejl - stavljamo te na listu za sledeći termin.</p>`;
  const footer = licni
    ? "Dobijaš ovaj mejl jer si nam se javio/la sa pitanjem o kursu nemačkog."
    : "Dobijaš ovaj mejl jer si uradio/la naše besplatno testiranje nemačkog.";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f8f9fa;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e">
<span style="display:none;max-height:0;overflow:hidden;color:#f8f9fa">Početni nivo od nule - mala grupa, prvi čas u ponedeljak 19.10. u 20h.</span>
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="text-align:center;padding:8px 0 20px"><img src="https://www.hartweger.rs/logo.jpg" alt="Hartweger" width="150" style="max-width:150px;height:auto"><div style="font-size:13px;color:#999;margin-top:6px">Škola nemačkog jezika</div></div>
<div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
<h1 style="font-size:22px;margin:0 0 16px;color:#1a1a2e">Nemački od nule - A1.1 grupa kreće 19. oktobra</h1>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px">${pozdrav}</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">${uvod}</p>
<div style="background:#fff8f3;border-left:3px solid #e8915a;border-radius:6px;padding:16px 18px;margin:0 0 18px"><div style="font-size:15px;line-height:1.8;color:#1a1a2e"><strong>Šta te čeka:</strong><br>• živa online nastava sa profesorkom Milicom Vučić, ponedeljkom i sredom 20:00-21:00<br>• mala grupa, najviše 6 polaznika<br>• 7 nedelja nastave (14 časova) + video lekcije prof. Nataše Hartweger, vežbe i testovi na platformi, dostupni 24/7<br>• objašnjenja na našem jeziku, pa je lako pratiti i bez ikakvog predznanja<br>• sav materijal je uključen, udžbenike ne kupuješ<br>• sertifikat po položenom završnom ispitu</div></div>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">Za tih 7 nedelja naučićeš da se predstaviš, postaviš pitanje i vodiš prve kratke razgovore na nemačkom.</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">Cena celog kursa: <strong>19.600 din.</strong> (oko 168 €) - moguće i na rate karticama Banca Intesa.</p>
<div style="text-align:center;margin:26px 0"><a href="${KURS_URL}" style="display:inline-block;background:#4fb1d3;color:#fff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 34px;border-radius:8px">Rezerviši svoje mesto →</a></div>
${zavrsni}
<p style="font-size:15px;line-height:1.6;color:#444;margin:20px 0 0">Pozdrav,<br><strong>Hartweger tim</strong></p>
</div>
<div style="text-align:center;font-size:12px;color:#999;padding:18px 0">Hartweger - Škola nemačkog jezika · <a href="https://www.hartweger.rs" style="color:#999">hartweger.rs</a><br>${footer}</div>
</div></body></html>`;
}

const validEmail = (e: string) =>
  /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) && !/\.(con|comcom)$/.test(e) && !/@gmai\.|@gmal\.|@gmeil\./.test(e);

async function fetchAll<T>(table: string, select: string): Promise<T[]> {
  const out: T[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await supabase.from(table).select(select).range(from, from + page - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < page) break;
  }
  return out;
}

async function buildMasovno(): Promise<Primalac[]> {
  const testovi = await fetchAll<{ email: string | null; recommended_level: string; created_at: string }>(
    "placement_test_results", "email, recommended_level, created_at");
  const porudzbine = await fetchAll<{ email: string; payment_status: string; created_at: string }>(
    "orders", "email, payment_status, created_at");
  const kontakti = await fetchAll<{ id: string; email: string; name: string | null }>(
    "crm_contacts", "id, email, name");
  const optouts = await fetchAll<{ email: string }>("email_optouts", "email");
  const bounces = await fetchAll<{ email: string }>("email_bounces", "email");
  const funnel = await fetchAll<{ email: string; sent_at: string }>("test_funnel_emails", "email, sent_at");

  const izbaci = new Set<string>();
  const sada = Date.now();
  const dana = (d: number) => sada - d * 24 * 3600 * 1000;

  for (const o of porudzbine) {
    if (!o.email) continue;
    const e = o.email.toLowerCase();
    if (o.payment_status === "completed") izbaci.add(e);
    // otvoren checkout u poslednjih 30 dana -> njih pokriva recovery, ne kampanja
    if (["pending", "failed"].includes(o.payment_status) && new Date(o.created_at).getTime() >= dana(30)) izbaci.add(e);
  }
  for (const r of optouts) if (r.email) izbaci.add(r.email.toLowerCase());
  for (const r of bounces) if (r.email) izbaci.add(r.email.toLowerCase());
  // automatski mejl iz test-levka u poslednjih 5 dana
  for (const f of funnel) {
    if (f.email && new Date(f.sent_at).getTime() >= dana(5)) izbaci.add(f.email.toLowerCase());
  }

  const pristupi = await fetchAll<{ user_id: string; expires_at: string | null }>("course_access", "user_id, expires_at");
  const individualni = await fetchAll<{ user_id: string }>("individual_enrollments", "user_id");
  const saPristupom = new Set<string>();
  for (const a of pristupi) if (!a.expires_at || new Date(a.expires_at).getTime() > sada) saPristupom.add(a.user_id);
  for (const a of individualni) saPristupom.add(a.user_id);
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`auth users: ${error.message}`);
    for (const u of data.users) if (u.email && saPristupom.has(u.id)) izbaci.add(u.email.toLowerCase());
    if (data.users.length < 1000) break;
  }

  // primaoci avgustovske A1.1 kampanje
  const { data: stare, error: e1 } = await supabase
    .from("crm_interactions")
    .select("contact_id, meta")
    .eq("meta->>kampanja", "a11-ponuda-2026-08-07");
  if (e1) throw new Error(`crm_interactions: ${e1.message}`);
  const crmPoId = new Map(kontakti.filter((c) => c.email).map((c) => [c.id, c.email.toLowerCase()]));
  for (const s of stare ?? []) {
    const em = crmPoId.get((s as { contact_id: string }).contact_id);
    if (em) izbaci.add(em);
  }

  // poslednji test po mejlu
  const poslednji = new Map<string, { nivo: string; kada: string }>();
  for (const t of testovi
    .filter((t) => t.email && validEmail(t.email))
    .sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    poslednji.set(t.email!.toLowerCase(), { nivo: t.recommended_level, kada: t.created_at });
  }

  const crmPoMejlu = new Map(kontakti.filter((c) => c.email).map((c) => [c.email.toLowerCase(), c]));
  const licniSet = new Set(LICNI.map((l) => l.email.toLowerCase()));
  const out: Primalac[] = [];
  for (const [email, { nivo, kada }] of poslednji) {
    if (nivo !== "A1.1") continue;
    if (new Date(kada).getTime() < dana(50)) continue;
    if (izbaci.has(email) || licniSet.has(email)) continue;
    const c = crmPoMejlu.get(email);
    out.push({ email, name: cistoIme(c?.name), crm_id: c?.id ?? null, subject: SUBJECT_MASOVNO });
  }
  return out;
}

async function posalji(lista: Primalac[], licni: boolean) {
  let ok = 0, fail = 0;
  const poslato: Array<{ email: string; crm_id: string | null }> = [];
  for (const p of lista) {
    const uvod = licni ? p.uvod! : UVOD_MASOVNO;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `${KAMPANJA}/${p.email}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: [p.email],
        reply_to: "info@hartweger.rs",
        subject: p.subject ?? SUBJECT_MASOVNO,
        html: buildEmail(p.name, uvod, licni),
      }),
    });
    if (res.ok) {
      const body = (await res.json()) as { id?: string };
      ok++;
      poslato.push({ email: p.email, crm_id: p.crm_id });
      console.log(`  ✓ ${p.email}${body.id ? ` (${body.id})` : ""}`);
    } else {
      fail++;
      console.error(`  ✗ ${p.email}: ${res.status} ${await res.text()}`);
    }
    await sleep(600);
  }
  const tag = licni ? "licni" : "masovno";
  fs.writeFileSync(
    path.resolve(__dirname, `_a11_1910_sent_${tag}.json`),
    JSON.stringify(poslato, null, 2)
  );
  console.log(`\n✓ Poslato (${tag}): ${ok}, neuspeha: ${fail} (od ${lista.length}).`);
  return poslato;
}

async function run() {
  const masovno = await buildMasovno();
  console.log(`Publika: ${LICNI.length} licnih + ${masovno.length} masovno.\n`);

  if (PREVIEW) {
    fs.writeFileSync(path.resolve(__dirname, "_a11_1910_preview_licni.html"), buildEmail(LICNI[0].name, LICNI[0].uvod!, true));
    fs.writeFileSync(path.resolve(__dirname, "_a11_1910_preview_masovno.html"), buildEmail("Ime", UVOD_MASOVNO, false));
    console.log("Pregledi snimljeni.\n");
  }

  // --dump: snimi gotove poruke kao JSON (bez slanja), za slanje drugim kanalom
  if (process.argv.includes("--dump")) {
    const paket = {
      licni: LICNI.map((p) => ({
        to: p.email, subject: p.subject!, html: buildEmail(p.name, p.uvod!, true), crm_id: p.crm_id,
      })),
      masovno: masovno.map((p) => ({
        to: p.email, subject: SUBJECT_MASOVNO, html: buildEmail(p.name, UVOD_MASOVNO, false), crm_id: p.crm_id,
      })),
    };
    const f = path.resolve(__dirname, "_a11_1910_paket.json");
    fs.writeFileSync(f, JSON.stringify(paket, null, 2));
    console.log(`Paket snimljen: ${f} (${paket.licni.length} licnih, ${paket.masovno.length} masovno)\n`);
  }

  if (!SEND) {
    console.log("LICNI:");
    LICNI.forEach((p) => console.log(`  ${p.email} (${p.name}) — „${p.subject}"`));
    console.log("\nMASOVNO:");
    masovno.forEach((p) => console.log(`  ${p.email}${p.name ? ` (${p.name})` : ""}`));
    console.log(`\n[DRY] --licni --send  ili  --masovno --send`);
    return;
  }

  if (SAMO_LICNI) await posalji(LICNI, true);
  else if (SAMO_MASOVNO) await posalji(masovno, false);
  else console.error("Odaberi --licni ili --masovno uz --send.");
}
run().catch((e) => { console.error(e); process.exit(1); });
