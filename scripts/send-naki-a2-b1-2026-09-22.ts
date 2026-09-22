/**
 * NaKI lidovi (crm source=naki, level A2 ili B1, stage nov/kontaktiran) koji NIKAD nisu dobili
 * odlazni mejl. A2 dobija oba A2 termina (A2.1 01.10 + A2.2 28.09), B1 dobija B1.1 28.09;
 * svi dobijaju link na besplatno testiranje jer NaKI ne razlikuje polunivoe.
 *
 * Iskljucenja: orders completed + course_access + individual_enrollments + email_optouts
 *   + email_bounces (hard / bilo koji osim punog inboksa) + suggestEmailFix + ijedna odlazna interakcija
 *   + rucna lista (rekli NaKI-ju da su B1 zavrsili)
 *
 *   npx tsx scripts/send-naki-a2-b1-2026-09-22.ts            # DRY
 *   npx tsx scripts/send-naki-a2-b1-2026-09-22.ts --preview  # DRY + HTML
 *   npx tsx scripts/send-naki-a2-b1-2026-09-22.ts --send
 */
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { suggestEmailFix } from "../src/lib/crm/email-typos";

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
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const FROM = "Hartweger <info@hartweger.rs>";
const KAMPANJA = "naki-a2-b1-ponuda-2026-09-22";
const SEND = process.argv.includes("--send");
const PREVIEW = process.argv.includes("--preview");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const A22_URL = "https://www.hartweger.rs/kursevi/grupni-kurs-nemackog-jezika-a2-2";
const B11_URL = "https://www.hartweger.rs/kursevi/grupni-kurs-nemackog-jezika-b1-1-2";
const A21_URL = "https://www.hartweger.rs/kursevi/grupni-kurs-nemackog-jezika-a2";
const TEST_URL = "https://www.hartweger.rs/besplatno-testiranje";

// Rekli NaKI-ju da su B1 zavrsili - B1.1 im nije nivo
const RUCNO_IZBACI = new Set(["radanemcok0922@gmail.com", "dajanajovicic996@gmail.com", "igor.dimitrijevic92@yahoo.com"]);

interface Primalac { email: string; ime: string | null; crm_id: string; level: "A2" | "B1"; stage: string; }

const SUBJECT: Record<"A2" | "B1", string> = {
  A2: "Dva A2 termina kreću - koji je tvoj?",
  B1: "B1.1 grupa kreće u ponedeljak 28.09.",
};

const A22_BOX = `<div style="background:#fff8f3;border-left:3px solid #e8915a;border-radius:6px;padding:16px 18px;margin:0 0 14px"><div style="font-size:15px;line-height:1.7;color:#1a1a2e"><strong>A2.2 - ako je A2.1 već iza tebe</strong><br>prvi čas <strong>ponedeljak 28.09. u 18:00</strong>, profesorka Milica Vučić<br>ponedeljkom i sredom 18:00-19:00, 7 nedelja i 14 časova, do 11.11.<br><a href="${A22_URL}" style="color:#4fb1d3;font-weight:700">Pogledaj A2.2 →</a></div></div>`;
const A21_BOX = `<div style="background:#f6f3fc;border-left:3px solid #8f7ad3;border-radius:6px;padding:16px 18px;margin:0 0 14px"><div style="font-size:15px;line-height:1.7;color:#1a1a2e"><strong>A2.1 - ako tek ulaziš u A2</strong><br>prvi čas <strong>četvrtak 01.10. u 19:00</strong>, profesorka Milica Vučić<br>utorkom i četvrtkom 19:00-20:00, 7 nedelja i 14 časova<br><a href="${A21_URL}" style="color:#4fb1d3;font-weight:700">Pogledaj A2.1 →</a></div></div>`;
const B11_BOX = `<div style="background:#f3f9fc;border-left:3px solid #4fb1d3;border-radius:6px;padding:16px 18px;margin:0 0 14px"><div style="font-size:15px;line-height:1.7;color:#1a1a2e"><strong>Grupni kurs B1.1</strong><br>prvi čas <strong>ponedeljak 28.09. u 17:00</strong>, profesorka Milica Vučić<br>ponedeljkom i četvrtkom 17:00-18:00, 7 nedelja i 14 časova, do 12.11.<br><a href="${B11_URL}" style="color:#4fb1d3;font-weight:700">Pogledaj B1.1 →</a></div></div>`;

const P = (t: string) => `<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px">${t}</p>`;

function buildEmail(p: Primalac): string {
  const pozdrav = p.ime ? `Ćao ${p.ime},` : "Ćao,";
  const a2 = p.level === "A2";
  const naslov = a2 ? "A2 kreće u dva termina" : "B1.1 kreće u ponedeljak";
  const preheader = a2 ? "A2.1 i A2.2 uživo, male grupe do 6 polaznika." : "B1.1 uživo, mala grupa do 6 polaznika, od 28.09.";
  const uvod = a2
    ? P(`iz razgovora sa NaKI, našim asistentom za nemački, videli smo da si negde na A2 nivou. Ako bi uz vežbanje sa NaKI dodao/la i živu nastavu sa profesorkom, ove nedelje kreću <strong>oba A2 termina</strong>, pa biraš onaj koji ti odgovara:`)
    : P(`iz razgovora sa NaKI, našim asistentom za nemački, videli smo da si negde na B1 nivou. Ako bi uz vežbanje sa NaKI dodao/la i živu nastavu sa profesorkom, u ponedeljak kreće <strong>B1.1 grupa</strong>:`);
  const boxes = a2 ? A21_BOX + A22_BOX : B11_BOX;
  const test = a2
    ? `Nisi siguran/na koji je tvoj polunivo? Uradi naše <a href="${TEST_URL}" style="color:#4fb1d3;font-weight:700">besplatno testiranje</a> - traje par minuta i odmah dobijaš preporuku.`
    : `Nisi siguran/na da li je B1.1 pravi ulaz? Uradi naše <a href="${TEST_URL}" style="color:#4fb1d3;font-weight:700">besplatno testiranje</a> - traje par minuta i odmah dobijaš preporuku. Ako ti test kaže B1.2 ili B2, javi nam se pa te stavimo na listu za sledeći termin.`;
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f8f9fa;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e">
<span style="display:none;max-height:0;overflow:hidden;color:#f8f9fa">${preheader}</span>
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="text-align:center;padding:8px 0 20px"><img src="https://www.hartweger.rs/logo.jpg" alt="Hartweger" width="150" style="max-width:150px;height:auto"><div style="font-size:13px;color:#999;margin-top:6px">Škola nemačkog jezika</div></div>
<div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
<h1 style="font-size:22px;margin:0 0 16px;color:#1a1a2e">${naslov}</h1>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px">${pozdrav}</p>
${uvod}
${boxes}
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px"><strong>Šta kurs nosi:</strong> živu online nastavu u maloj grupi do 6 polaznika, video lekcije prof. Nataše Hartweger uz vežbe i testove na platformi dostupne 24/7 godinu dana, objašnjenja na našem jeziku, sav materijal uključen bez kupovine udžbenika i sertifikat po položenom završnom ispitu.</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">Cena je <strong>19.600 din.</strong> (oko 168 €), moguće i na rate karticama Banca Intesa. Mesto se zauzima kad uplata prođe.</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 22px">${test} Ako ti termin ne odgovara ili imaš pitanje, samo odgovori na ovaj mejl.</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:20px 0 0">Pozdrav,<br><strong>Hartweger tim</strong></p>
</div>
<div style="text-align:center;font-size:12px;color:#999;padding:18px 0">Hartweger - Škola nemačkog jezika · <a href="https://www.hartweger.rs" style="color:#999">hartweger.rs</a><br>Dobijaš ovaj mejl jer si vežbao/la nemački sa NaKI na našem sajtu.</div>
</div></body></html>`;
}

const IME_OVERRIDE: Record<string, string> = { "nevenabartula88@hotmail.com": "Nevena", "pasicedina71@gmail.com": "Edina" };
function cistoIme(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const n = raw.trim();
  if (!n || n.includes("@")) return null;
  return n.split(/\s+/)[0];
}
const validEmail = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

async function fetchAll<T>(table: string, select: string, filter?: (q: any) => any): Promise<T[]> {
  const out: T[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    let q = supabase.from(table).select(select).range(from, from + page - 1);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...(data as T[]));
    if (!data || data.length < page) break;
  }
  return out;
}

async function buildAudience() {
  const kontakti = await fetchAll<{ id: string; email: string; name: string | null; level: string | null; source: string; stage: string }>(
    "crm_contacts", "id, email, name, level, source, stage", (q) => q.eq("source", "naki").in("level", ["A2", "B1"]).in("stage", ["nov", "kontaktiran"]));
  const ids = kontakti.map((c) => c.id);
  const odlazne = await fetchAll<{ contact_id: string }>("crm_interactions", "contact_id", (q) => q.eq("direction", "odlazna").in("contact_id", ids));
  const vecKontaktirani = new Set(odlazne.map((o) => o.contact_id));

  const izbaci = new Set<string>();
  const porudzbine = await fetchAll<{ email: string; payment_status: string }>("orders", "email, payment_status");
  for (const o of porudzbine) if (o.email && o.payment_status === "completed") izbaci.add(o.email.toLowerCase());
  for (const r of await fetchAll<{ email: string }>("email_optouts", "email")) if (r.email) izbaci.add(r.email.toLowerCase());
  // bounce: sve osim punog inboksa (iza njega je ziv covek)
  for (const r of await fetchAll<{ email: string; reason: string | null }>("email_bounces", "email, reason"))
    if (r.email && !/inbox was full|mailbox is no longer full/i.test(r.reason ?? "")) izbaci.add(r.email.toLowerCase());
  const pristupi = await fetchAll<{ user_id: string }>("course_access", "user_id");
  const individualni = await fetchAll<{ user_id: string }>("individual_enrollments", "user_id");
  const saPristupom = new Set([...pristupi, ...individualni].map((a) => a.user_id));
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`auth users: ${error.message}`);
    for (const u of data.users) if (u.email && saPristupom.has(u.id)) izbaci.add(u.email.toLowerCase());
    if (data.users.length < 1000) break;
  }

  const primaoci: Primalac[] = [];
  const sumnjivi: string[] = [];
  const uzeto = new Set<string>();
  for (const c of kontakti) {
    if (!c.email) continue;
    const email = c.email.toLowerCase();
    if (vecKontaktirani.has(c.id) || izbaci.has(email) || uzeto.has(email) || RUCNO_IZBACI.has(email) || !validEmail(email)) continue;
    if (suggestEmailFix(email)) { sumnjivi.push(email); continue; }
    primaoci.push({ email, ime: IME_OVERRIDE[email] ?? cistoIme(c.name), crm_id: c.id, level: c.level as "A2" | "B1", stage: c.stage });
    uzeto.add(email);
  }
  return { primaoci, sumnjivi };
}

async function logCrm(p: Primalac, resendId: string | null) {
  const { error: e1 } = await supabase.from("crm_interactions").insert({
    contact_id: p.crm_id, channel: "mejl", direction: "odlazna",
    summary: `Ponuda ${p.level === "A2" ? "A2.1 (01.10) + A2.2 (28.09)" : "B1.1 (28.09)"} - NaKI segment`,
    body: `Poslato preko Resend skripte send-naki-a2-b1-2026-09-22.ts. Resend id: ${resendId ?? "?"}`,
    occurred_at: new Date().toISOString(),
    meta: { kampanja: KAMPANJA, level: p.level, resend_id: resendId },
  });
  if (e1) throw new Error(`crm_interactions: ${e1.message}`);
  const patch: Record<string, unknown> = { last_interaction_at: new Date().toISOString() };
  if (p.stage === "nov") patch.stage = "kontaktiran";
  const { error: e2 } = await supabase.from("crm_contacts").update(patch).eq("id", p.crm_id);
  if (e2) throw new Error(`crm_contacts: ${e2.message}`);
}

async function run() {
  const { primaoci, sumnjivi } = await buildAudience();
  const a2 = primaoci.filter((p) => p.level === "A2").length;
  console.log(`Publika: ${primaoci.length} (A2 ${a2}, B1 ${primaoci.length - a2}) | kampanja ${KAMPANJA}`);
  sumnjivi.forEach((s) => console.log(`  ⚠ sumnjiv domen, preskočen: ${s}`));

  if (PREVIEW) {
    const dir = path.resolve(__dirname, "_naki_a2_b1_preview");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "A2.html"), buildEmail({ email: "x", ime: "Ime", crm_id: "", level: "A2", stage: "nov" }));
    fs.writeFileSync(path.join(dir, "B1.html"), buildEmail({ email: "x", ime: "Ime", crm_id: "", level: "B1", stage: "nov" }));
    console.log(`Pregled: ${dir}/`);
  }
  if (!SEND) {
    primaoci.forEach((p) => console.log(`  [${p.level}] ${p.email}${p.ime ? ` (${p.ime})` : ""}`));
    console.log(`\n[DRY] --send da pošaljem.`);
    return;
  }

  let ok = 0, fail = 0;
  const poslato: Array<{ email: string; level: string; resend_id: string | null; crm: boolean }> = [];
  for (const p of primaoci) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `${KAMPANJA}/${p.email}` },
      body: JSON.stringify({ from: FROM, to: [p.email], reply_to: "info@hartweger.rs", subject: SUBJECT[p.level], html: buildEmail(p) }),
    });
    if (!res.ok) { fail++; console.error(`  ✗ ${p.email}: ${res.status} ${await res.text()}`); await sleep(600); continue; }
    const body = await res.json().catch(() => ({}));
    const rid = body?.id ?? null;
    let crm = true;
    try { await logCrm(p, rid); } catch (e) { crm = false; console.error(`  ⚠ CRM ${p.email}: ${(e as Error).message}`); }
    ok++; poslato.push({ email: p.email, level: p.level, resend_id: rid, crm });
    console.log(`  ✓ [${p.level}] ${p.email}${crm ? "" : " (CRM NIJE upisan)"}`);
    await sleep(600);
  }
  console.log(`\n✓ Poslato: ${ok}, neuspeha: ${fail} (od ${primaoci.length}).`);
  fs.writeFileSync(path.resolve(__dirname, "_naki_a2_b1_sent_2026-09-22.json"), JSON.stringify(poslato, null, 2));
}
run().catch((e) => { console.error(e); process.exit(1); });
