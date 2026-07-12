/**
 * RESUME za send-aktivacija-reminder-3.ts posle ECONNRESET pada (4.7.).
 * Original nema dedup — zato ovde: izgradi ISTU publiku, povuci iz Resend-a sve
 * koji su VEĆ dobili ovaj subject danas, i pošalji SAMO ostatku.
 *
 *   npx tsx scripts/send-aktivacija-reminder-3-resume.ts            # DRY (koliko ostaje)
 *   npx tsx scripts/send-aktivacija-reminder-3-resume.ts --send
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [k, ...v] = line.split("=");
  if (k && v.length && !process.env[k.trim()]) process.env[k.trim()] = v.join("=").trim();
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const RESEND_KEY = process.env.RESEND_API_KEY!;
const FROM = "Hartweger <info@hartweger.rs>";
const SUBJECT = "Stari sajt se gasi 7. jula — prijava je sad samo ovde";
const SEND = process.argv.includes("--send");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const SKIP = new Set([
  "nezirovicaida6@gmail.com", "petrovicanja731@gmail.com",
  "milicapajic21@gmail.com", "andjela.jovev01@gmail.com",
]);

function buildEmail(name: string | null): string {
  const pozdrav = name ? `Zdravo ${name},` : "Zdravo,";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f8f9fa;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e">
<span style="display:none;max-height:0;overflow:hidden;color:#f8f9fa">Stari sajt se gasi 7. jula — posle toga se kursu pristupa samo preko nove platforme. Napravi lozinku za 2 minuta.</span>
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="text-align:center;padding:8px 0 20px"><img src="https://www.hartweger.rs/logo.jpg" alt="Hartweger" width="150" style="max-width:150px;height:auto"><div style="font-size:13px;color:#999;margin-top:6px">Škola nemačkog jezika</div></div>
<div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
<h1 style="font-size:22px;margin:0 0 16px;color:#1a1a2e">Stari sajt se gasi 7. jula 📅</h1>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px">${pozdrav}</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">Kratko i važno: <strong>stara platforma se gasi 7. jula.</strong> Tvoj kurs zbog toga <strong>ne nestaje</strong> — već je prebačen na našu novu platformu i čeka te. Ali od 7. jula se ulazi <strong>samo preko nove platforme</strong>, pa je pravi trenutak da napraviš lozinku sad i budeš spreman/na.</p>
<div style="background:#fff8f3;border-left:3px solid #e8915a;border-radius:6px;padding:16px 18px;margin:0 0 18px"><div style="font-size:15px;line-height:1.7;color:#1a1a2e"><strong>Traje 2 minuta:</strong><br>1. Klikni na dugme ispod<br>2. Ukucaj svoj mejl (ovaj na koji si dobio/la poruku)<br>3. Stigne ti link — postaviš lozinku i unutra si 🎉<br><br><span style="font-size:13px;color:#666">Stara lozinka sa starog sajta ovde ne važi — zato praviš novu.</span></div></div>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 22px">Jedna iskrena napomena: nova platforma <strong>ne pamti tvoj napredak sa starog sajta</strong> — sve kreće „od nule". To je zapravo prilika 🙂 Možeš da obnoviš gradivo iz početka, ili jednostavno <strong>štikliraš lekcije koje si već prešao/la kao završene</strong> i za par klikova budeš tačno tamo gde si stao/la.</p>
<div style="text-align:center;margin:26px 0"><a href="https://www.hartweger.rs/reset-lozinke" style="display:inline-block;background:#4fb1d3;color:#fff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 34px;border-radius:8px">Napravi lozinku →</a></div>
<p style="font-size:14px;line-height:1.6;color:#666;margin:0 0 0">Ako ti ne stigne link ili nešto zapinje, samo odgovori na ovaj mejl ili nam piši na <a href="mailto:info@hartweger.rs" style="color:#4fb1d3">info@hartweger.rs</a> — uđemo zajedno.</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:20px 0 0">Srdačno,<br><strong>Hartweger tim</strong></p>
</div>
<div style="text-align:center;font-size:12px;color:#999;padding:18px 0">Hartweger — Škola nemačkog jezika · <a href="https://www.hartweger.rs" style="color:#999">hartweger.rs</a><br>Dobijaš ovaj mejl jer imaš kurs kod nas.</div>
</div></body></html>`;
}

async function migratedActiveUserIds(): Promise<Set<string>> {
  const now = new Date().toISOString();
  const ids = new Set<string>();
  let from = 0;
  while (true) {
    const { data } = await sb.from("course_access").select("user_id, expires_at, source").eq("source", "wp-migration-2026-06").range(from, from + 999);
    if (!data || !data.length) break;
    data.forEach((r) => { if (!r.expires_at || r.expires_at > now) ids.add(r.user_id); });
    if (data.length < 1000) break; from += 1000;
  }
  return ids;
}

async function buildAudience(): Promise<{ email: string; name: string | null }[]> {
  const migActive = await migratedActiveUserIds();
  const neverIds: string[] = [];
  let page = 1;
  while (true) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    if (!data.users.length) break;
    for (const u of data.users) if (migActive.has(u.id) && !u.last_sign_in_at) neverIds.push(u.id);
    if (data.users.length < 1000) break; page++;
  }
  const audience: { email: string; name: string | null }[] = [];
  for (let i = 0; i < neverIds.length; i += 150) {
    const { data } = await sb.from("user_profiles").select("email, full_name").in("id", neverIds.slice(i, i + 150));
    (data || []).forEach((p) => {
      const e = (p.email || "").toLowerCase().trim();
      if (e && !SKIP.has(e) && !e.endsWith("@hartweger.rs")) audience.push({ email: e, name: p.full_name || null });
    });
  }
  return audience;
}

/** Povuci iz Resend-a sve primaoce koji su danas VEĆ dobili ovaj subject. */
async function alreadySent(): Promise<Set<string>> {
  const sent = new Set<string>();
  const today = "2026-07-04";
  let after: string | undefined;
  let pages = 0;
  while (pages < 40) {
    const url = new URL("https://api.resend.com/emails");
    url.searchParams.set("limit", "100");
    if (after) url.searchParams.set("after", after);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${RESEND_KEY}` } });
    if (!res.ok) throw new Error(`Resend list ${res.status}: ${await res.text()}`);
    const json: any = await res.json();
    const rows: any[] = json.data || [];
    if (!rows.length) break;
    let sawOlderThanToday = false;
    for (const r of rows) {
      const created: string = r.created_at || "";
      if (created && created < today) { sawOlderThanToday = true; continue; }
      if (r.subject === SUBJECT) {
        const to = Array.isArray(r.to) ? r.to : [r.to];
        to.forEach((e: string) => e && sent.add(e.toLowerCase().trim()));
      }
    }
    // paginate forward to older emails
    after = rows[rows.length - 1].id;
    pages++;
    if (sawOlderThanToday) break; // prošli smo ceo današnji dan
    if (rows.length < 100) break;
    await sleep(200);
  }
  return sent;
}

async function run() {
  const [audience, sent] = await Promise.all([buildAudience(), alreadySent()]);
  const remainder = audience.filter((u) => !sent.has(u.email));
  console.log(`Publika: ${audience.length} | već poslato danas (Resend): ${sent.size} | OSTATAK za slanje: ${remainder.length}`);
  console.log(`Subject: ${SUBJECT}`);

  if (!SEND) {
    remainder.slice(0, 15).forEach((u) => console.log(`  ${u.email} ${u.name ? "(" + u.name + ")" : ""}`));
    console.log(`\n[DRY] --send da pošaljem ostatak (${remainder.length}).`);
    return;
  }

  let ok = 0, fail = 0;
  for (const u of remainder) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM, to: [u.email], reply_to: "info@hartweger.rs", subject: SUBJECT, html: buildEmail(u.name?.split(" ")[0] || null) }),
      });
      if (res.ok) ok++; else { fail++; console.error(`  ✗ ${u.email}: ${res.status} ${await res.text()}`); }
    } catch (e: any) {
      fail++; console.error(`  ✗ ${u.email}: ${e?.message || e}`);
    }
    await sleep(600);
  }
  console.log(`\n✓ Poslato (ostatak): ${ok}, neuspeha: ${fail} (od ${remainder.length}).`);
}
run().catch((e) => { console.error(e); process.exit(1); });
