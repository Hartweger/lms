/**
 * Podsetnik za migrirane korisnike koji se NIKAD nisu ulogovali a imaju AKTIVAN pristup.
 * Publika: course_access source='wp-migration-2026-06' + expires_at u budućnosti + auth.last_sign_in_at == null.
 * Izbacuje: poznate bounce-ove + interne naloge (@hartweger.rs).
 *
 *   npx tsx scripts/send-aktivacija-reminder.ts                # DRY: ko bi dobio + broj
 *   npx tsx scripts/send-aktivacija-reminder.ts --send         # pošalji svima iz publike (Resend PRO, bez dnevnog limita)
 *   npx tsx scripts/send-aktivacija-reminder.ts --send --limit=50
 *
 * RESEND_API_KEY u env (ili .env.local).
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
const SUBJECT = "Tvoj kurs te čeka — uđi za 30 sekundi 🇩🇪";
const SEND = process.argv.includes("--send");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.split("=")[1], 10) : 100000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Mejlovi koje preskačemo (bounce iz prethodnog talasa + interni).
const SKIP = new Set([
  "nezirovicaida6@gmail.com", "petrovicanja731@gmail.com",
  "milicapajic21@gmail.com", "andjela.jovev01@gmail.com",
]);

function buildEmail(name: string | null): string {
  const pozdrav = name ? `Zdravo ${name},` : "Zdravo,";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f8f9fa;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e">
<span style="display:none;max-height:0;overflow:hidden;color:#f8f9fa">Tvoj kurs je već prebačen na novu platformu i čeka te — evo kako da uđeš.</span>
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="text-align:center;padding:8px 0 20px"><img src="https://www.hartweger.rs/logo.jpg" alt="Hartweger" width="150" style="max-width:150px;height:auto"><div style="font-size:13px;color:#999;margin-top:6px">Škola nemačkog jezika</div></div>
<div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
<h1 style="font-size:22px;margin:0 0 16px;color:#1a1a2e">Tvoj kurs te čeka 👋</h1>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px">${pozdrav}</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">Primetili smo da još nisi ušao/la na našu novu platformu. Tvoj nalog i svi kursevi su <strong>već prebačeni i čekaju te</strong> — ništa ne kupuješ ponovo, samo se prijaviš i nastaviš.</p>
<div style="background:#f8fcfd;border-left:3px solid #4fb1d3;border-radius:6px;padding:16px 18px;margin:0 0 22px"><div style="font-size:15px;line-height:1.7;color:#1a1a2e"><strong>Prijava traje 30 sekundi, bez lozinke:</strong><br>1. Idi na <a href="https://www.hartweger.rs/prijava" style="color:#4fb1d3">hartweger.rs/prijava</a><br>2. Ukucaj svoj mejl (ovaj na koji si dobio/la poruku)<br>3. Stigne ti link za prijavu — klikneš i unutra si 🎉</div></div>
<div style="text-align:center;margin:26px 0"><a href="https://www.hartweger.rs/prijava" style="display:inline-block;background:#4fb1d3;color:#fff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 34px;border-radius:8px">Uđi u svoj nalog →</a></div>
<p style="font-size:14px;line-height:1.6;color:#666;margin:0 0 0">Ako ti ne stigne link ili nešto zapinje, samo odgovori na ovaj mejl ili nam piši na <a href="mailto:info@hartweger.rs" style="color:#4fb1d3">info@hartweger.rs</a> — rešićemo odmah.</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:20px 0 0">Srdačno,<br><strong>Hartweger tim</strong></p>
</div>
<div style="text-align:center;font-size:12px;color:#999;padding:18px 0">Hartweger — Škola nemačkog jezika · <a href="https://www.hartweger.rs" style="color:#999">hartweger.rs</a><br>Dobijaš ovaj mejl jer imaš kurs kod nas.</div>
</div></body></html>`;
}

// migrirani user_id-evi sa AKTIVNIM pristupom
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

async function run() {
  const migActive = await migratedActiveUserIds();

  // auth korisnici → last_sign_in_at; zadrži samo NIKAD ulogovane iz migActive
  const neverIds: string[] = [];
  let page = 1;
  while (true) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    if (!data.users.length) break;
    for (const u of data.users) if (migActive.has(u.id) && !u.last_sign_in_at) neverIds.push(u.id);
    if (data.users.length < 1000) break; page++;
  }

  // emailovi/imena
  const audience: { email: string; name: string | null }[] = [];
  for (let i = 0; i < neverIds.length; i += 150) {
    const { data } = await sb.from("user_profiles").select("email, full_name").in("id", neverIds.slice(i, i + 150));
    (data || []).forEach((p) => {
      const e = (p.email || "").toLowerCase().trim();
      if (e && !SKIP.has(e) && !e.endsWith("@hartweger.rs")) audience.push({ email: e, name: p.full_name || null });
    });
  }

  console.log(`Migrirani+aktivni: ${migActive.size} | nikad ulogovani u toj grupi: ${neverIds.length} | publika posle filtera (bounce/interni): ${audience.length}`);

  if (!SEND) {
    audience.slice(0, 12).forEach((u) => console.log(`  ${u.email} ${u.name ? "(" + u.name + ")" : ""}`));
    console.log(`\n[DRY] --send da pošaljem (limit ${LIMIT === 100000 ? "svi" : LIMIT}).`);
    return;
  }

  const batch = audience.slice(0, LIMIT);
  let ok = 0, fail = 0;
  for (const u of batch) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [u.email], reply_to: "info@hartweger.rs", subject: SUBJECT, html: buildEmail(u.name?.split(" ")[0] || null) }),
    });
    if (res.ok) ok++; else { fail++; console.error(`  ✗ ${u.email}: ${res.status} ${await res.text()}`); }
    await sleep(600);
  }
  console.log(`\n✓ Poslato: ${ok}, neuspeha: ${fail} (od ${batch.length}).`);
}
run().catch((e) => { console.error(e); process.exit(1); });
