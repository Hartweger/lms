// Mejlovi kupcima Položi GOETHE B1 (magic-link prijava). --test (info@) / --send (svi aktivni).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const TEST = process.argv.includes("--test"), SEND = process.argv.includes("--send");
const atArg = process.argv.find((a) => a.startsWith("--at="));
const SCHEDULED = atArg ? atArg.split("=")[1] : null; // ISO npr. 2026-06-03T08:00:00+02:00
const FROM = "Hartweger <info@hartweger.rs>", TEST_TO = "info@hartweger.rs", SLUG = "polozi-goethe-b1";
const resend = (TEST || SEND) ? new Resend(process.env.RESEND_API_KEY) : null;

function buildEmail(name, expiresAt) {
  const expiry = new Date(expiresAt).toLocaleDateString("sr-Latn-RS", { day: "numeric", month: "long", year: "numeric" });
  return `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;background:#f8f9fa;margin:0;padding:0;">
  <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
    <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="text-align:center;margin-bottom:24px;"><img src="https://www.hartweger.rs/logo.jpg" alt="Hartweger" style="width:120px;height:auto;"/></div>
      <h1 style="font-size:20px;margin:0 0 16px;">Zdravo, ${name || "draga koleginice/kolega"}!</h1>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px;">
        Tvoj kurs <strong>Položi GOETHE B1</strong> se sada nalazi na <strong>novoj platformi</strong> — <a href="https://www.hartweger.rs" style="color:#4fb1d3;text-decoration:none;font-weight:600;">www.hartweger.rs</a>. Radi u svakom browseru, na telefonu i računaru.
      </p>
      <div style="background:#f8fcfd;border-left:3px solid #4fb1d3;border-radius:6px;padding:14px 16px;margin:0 0 20px;">
        <div style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Tvoj kurs</div>
        <div style="font-size:15px;font-weight:700;">Položi GOETHE B1</div>
        <div style="font-size:12px;color:#999;margin-top:8px;">Pristup do: ${expiry}</div>
      </div>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 8px;"><strong>Kako da se prijaviš:</strong></p>
      <ol style="font-size:14px;line-height:1.7;color:#444;margin:0 0 20px;padding-left:20px;">
        <li>Klikni na dugme ispod</li>
        <li>Unesi svoju email adresu (ovu na koju čitaš mejl)</li>
        <li>Dobićeš link za prijavu na email — klikni na njega i gotovo!</li>
      </ol>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://www.hartweger.rs/prijava" style="display:inline-block;background:#4fb1d3;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Prijavi se na novu platformu</a>
      </div>
      <div style="background:#f0faf0;border-left:3px solid #34d399;border-radius:6px;padding:14px 16px;margin:0 0 20px;">
        <div style="font-size:14px;font-weight:700;margin-bottom:6px;">Šta te čeka u kursu?</div>
        <ul style="font-size:13px;line-height:1.7;color:#444;margin:0;padding-left:18px;">
          <li><strong>Masterclass</strong> — video + prezentacija + lista reči</li>
          <li><strong>Schreiben</strong> — zadaci za pisanje (slanje na pregled)</li>
          <li><strong>Leseverstehen i Hörverstehen</strong> — kompletni Modelltestovi sa audiom i proverom</li>
          <li><strong>Sve o ispitu</strong> — video i materijali</li>
        </ul>
      </div>
      <p style="font-size:14px;line-height:1.6;color:#444;margin:0 0 8px;">Ako imaš pitanja, samo odgovori na ovaj mejl. Srećno učenje! 💪</p>
      <p style="font-size:14px;color:#444;margin:0;">— Nataša</p>
    </div>
    <div style="text-align:center;padding:20px;font-size:12px;color:#bbb;"><p style="margin:0;">Hartweger — Škola nemačkog jezika</p></div>
  </div>
</body></html>`;
}

async function recipients() {
  const { data: c } = await sb.from("courses").select("id").eq("slug", SLUG).single();
  const { data: acc } = await sb.from("course_access").select("user_id,expires_at").eq("course_id", c.id).gt("expires_at", new Date().toISOString());
  const out = [];
  for (const a of acc || []) {
    const { data: p } = await sb.from("user_profiles").select("email,full_name").eq("id", a.user_id).single();
    if (!p?.email) continue;
    const email = p.email.toLowerCase();
    if (email.includes("hartweger.rs") || email.includes("test@")) continue;
    out.push({ email, name: p.full_name || "", expires: a.expires_at });
  }
  return out;
}

if (TEST) {
  await resend.emails.send({ from: FROM, to: TEST_TO, subject: "[TEST] Tvoj kurs Položi GOETHE B1 je na novoj platformi! 🎉", html: buildEmail("Nataša (TEST)", new Date(Date.now() + 300 * 86400000).toISOString()) });
  console.log(`✓ Test mejl poslat na ${TEST_TO}`);
} else {
  const list = await recipients();
  console.log(`Aktivnih B1 korisnika za mejl: ${list.length}`);
  if (!SEND) { console.log("[DRY] --test / --send"); list.slice(0, 5).forEach((r) => console.log(`  ${r.email} (${r.name})`)); }
  else {
    let sent = 0, err = 0;
    for (const r of list) {
      try { const payload = { from: FROM, to: r.email, subject: "Tvoj kurs Položi GOETHE B1 je na novoj platformi! 🎉", html: buildEmail(r.name, r.expires) }; if (SCHEDULED) payload.scheduledAt = SCHEDULED; await resend.emails.send(payload); sent++; console.log(`${SCHEDULED ? "ZAKAZAN" : "SENT"} ${r.email}`); if (sent % 10 === 0) await new Promise((x) => setTimeout(x, 1100)); }
      catch (e) { err++; console.error(`ERR ${r.email}: ${e.message}`); }
    }
    console.log(`\nPoslato: ${sent}, grešaka: ${err}`);
  }
}
