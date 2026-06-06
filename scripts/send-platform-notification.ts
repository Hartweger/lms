/**
 * Staged obaveštavanje migriranih korisnika o novoj platformi (kurs.hartweger.rs).
 * Publika: korisnici sa AKTIVNIM course_access (port-later bez pristupa su automatski izostavljeni).
 * "Ne dupliraj": šalje samo WHERE migration_notified_at IS NULL i markira po slanju.
 *
 *   npx tsx scripts/send-platform-notification.ts                 # DRY: prikaže ko bi dobio
 *   npx tsx scripts/send-platform-notification.ts --backfill      # DRY: ko je već dobio (Resend log) → markira (uz --write)
 *   npx tsx scripts/send-platform-notification.ts --backfill --write
 *   npx tsx scripts/send-platform-notification.ts --send          # pošalji sledećih do 100 i markira
 *
 * Preduslov: migracija 036 (migration_notified_at). RESEND_API_KEY u env.
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
const FROM = "Hartweger <kurs@hartweger.rs>";
const BATCH = 100;
const BACKFILL = process.argv.includes("--backfill");
const SEND = process.argv.includes("--send");
const WRITE = process.argv.includes("--write");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Subject-i koji znače da je korisnik VEĆ dobio "selidba" mejl (za backfill dedup).
const MIGRATION_SUBJECTS = [/na novoj platformi/i, /kurs je postao bolji/i, /preselila/i];

function buildEmail(name: string | null): string {
  const pozdrav = name ? `Zdravo ${name},` : "Zdravo,";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f8f9fa;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e">
<span style="display:none;max-height:0;overflow:hidden;color:#f8f9fa">Više vežbanja, bolja priprema za ispit i priručnik — sve te čeka na novoj platformi.</span>
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="text-align:center;padding:8px 0 20px"><img src="https://kurs.hartweger.rs/logo.jpg" alt="Hartweger" width="150" style="max-width:150px;height:auto"><div style="font-size:13px;color:#999;margin-top:6px">Škola nemačkog jezika</div></div>
<div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
<h1 style="font-size:22px;margin:0 0 16px;color:#1a1a2e">Tvoj kurs je postao bolji 🎉</h1>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px">${pozdrav}</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">Preselili smo tvoju školu nemačkog na novu, bržu platformu — i usput je napravili <strong>znatno boljom</strong>. Tvoj nalog i svi kursevi su <strong>već prebačeni</strong>, ništa ne kupuješ ponovo.</p>
<div style="background:#f8fcfd;border-left:3px solid #4fb1d3;border-radius:6px;padding:16px 18px;margin:0 0 22px"><div style="font-size:15px;line-height:1.9;color:#1a1a2e">✅ <strong>Mnogo više vežbanja</strong> — interaktivni zadaci uz svaku lekciju<br>✅ <strong>Bolja priprema za ispit</strong> — probni testovi i modeli ispita<br>✅ <strong>Priručnik i e-book</strong> uz kurs<br>✅ <strong>Prati svoj napredak</strong> i osvajaj srca 💛<br>✅ <strong>Sertifikat</strong> po završetku</div></div>
<div style="text-align:center;margin:26px 0"><a href="https://kurs.hartweger.rs/prijava" style="display:inline-block;background:#4fb1d3;color:#fff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 34px;border-radius:8px">Uđi u svoj nalog →</a></div>
<p style="font-size:14px;line-height:1.6;color:#666;margin:0 0 6px"><strong>Prijava je laka:</strong> na <a href="https://kurs.hartweger.rs/prijava" style="color:#4fb1d3">kurs.hartweger.rs/prijava</a> ukucaš svoj mejl (ovaj na koji si dobio/la poruku) i stigne ti link za prijavu — bez lozinke.</p>
<p style="font-size:14px;line-height:1.6;color:#666;margin:14px 0 0">Pitanja? Samo odgovori na ovaj mejl ili nam piši na <a href="mailto:kurs@hartweger.rs" style="color:#4fb1d3">kurs@hartweger.rs</a>.</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:20px 0 0">Srdačno,<br><strong>Hartweger tim</strong></p>
</div>
<div style="text-align:center;font-size:12px;color:#999;padding:18px 0">Hartweger — Škola nemačkog jezika · <a href="https://kurs.hartweger.rs" style="color:#999">kurs.hartweger.rs</a><br>Dobijaš ovaj mejl jer imaš kurs kod nas.</div>
</div></body></html>`;
}

// Korisnici sa aktivnim pristupom koji nisu obavešteni.
async function audience(): Promise<{ id: string; email: string; name: string | null }[]> {
  const now = new Date().toISOString();
  const activeUsers = new Set<string>();
  let from = 0;
  while (true) {
    const { data } = await sb.from("course_access").select("user_id, expires_at").range(from, from + 999);
    if (!data || !data.length) break;
    data.forEach((r) => { if (!r.expires_at || r.expires_at > now) activeUsers.add(r.user_id); });
    if (data.length < 1000) break; from += 1000;
  }
  const out: { id: string; email: string; name: string | null }[] = [];
  const ids = [...activeUsers];
  for (let i = 0; i < ids.length; i += 1000) {
    const { data } = await sb.from("user_profiles")
      .select("id, email, full_name, migration_notified_at")
      .in("id", ids.slice(i, i + 1000));
    (data || []).forEach((p) => {
      if (p.email && !p.migration_notified_at) out.push({ id: p.id, email: p.email, name: p.full_name || null });
    });
  }
  return out;
}

// Povuci sve mejlove iz Resend istorije koji su "selidba" → set adresa.
async function alreadyEmailed(): Promise<Set<string>> {
  const set = new Set<string>();
  let url = "https://api.resend.com/emails?limit=100";
  for (let page = 0; page < 50; page++) {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${RESEND_KEY}` } });
    if (!r.ok) { console.error("Resend log", r.status); break; }
    const j = await r.json();
    const rows = j.data || [];
    for (const e of rows) {
      if (MIGRATION_SUBJECTS.some((re) => re.test(e.subject || ""))) {
        (e.to || []).forEach((t: string) => set.add(t.toLowerCase().trim()));
      }
    }
    if (!j.has_more || !rows.length) break;
    url = `https://api.resend.com/emails?limit=100&after=${rows[rows.length - 1].id}`;
    await sleep(400);
  }
  return set;
}

async function run() {
  if (BACKFILL) {
    const emailed = await alreadyEmailed();
    console.log(`Resend "selidba" recipijenata: ${emailed.size}`);
    if (!WRITE) { console.log("[DRY] --write da ih markiram kao obaveštene."); return; }
    let marked = 0;
    for (const email of emailed) {
      const { error } = await sb.from("user_profiles")
        .update({ migration_notified_at: new Date("2026-05-27").toISOString() }).eq("email", email);
      if (!error) marked++;
    }
    console.log(`✓ Markirano već-obaveštenih: ${marked}`);
    return;
  }

  const list = await audience();
  console.log(`Publika (aktivan pristup, NIJE obavešten): ${list.length}`);
  if (!SEND) {
    list.slice(0, 10).forEach((u) => console.log(`  ${u.email} ${u.name ? "(" + u.name + ")" : ""}`));
    console.log(`\n[DRY] --send da pošaljem sledećih ${Math.min(BATCH, list.length)} (od ${list.length}).`);
    return;
  }

  const batch = list.slice(0, BATCH);
  let sent = 0, failed = 0;
  for (const u of batch) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [u.email], subject: "Tvoj kurs nemačkog je postao bolji — uđi u svoj novi nalog", html: buildEmail(u.name?.split(" ")[0] || null) }),
    });
    if (res.ok) {
      await sb.from("user_profiles").update({ migration_notified_at: new Date().toISOString() }).eq("id", u.id);
      sent++;
    } else {
      failed++; console.error(`  ✗ ${u.email}: ${res.status} ${await res.text()}`);
    }
    await sleep(600);
  }
  console.log(`\n✓ Poslato: ${sent}, neuspeha: ${failed}. Preostalo: ${list.length - sent}. (Sutra opet --send za sledeću grupu.)`);
}
run().catch((e) => { console.error(e); process.exit(1); });
