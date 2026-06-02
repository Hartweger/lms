/**
 * Mejlovi Gramatika kupcima — obaveštenje o prelasku na kurs.hartweger.rs.
 * Magic-link prijava (kao A1 migracija): mejl vodi na /prijava, korisnik unese mejl i dobije link.
 *
 *   npx tsx scripts/send-gramatika-emails.ts                 # dry-run (samo lista)
 *   RESEND_API_KEY=re_xxx npx tsx scripts/send-gramatika-emails.ts --test   # 1 test na info@hartweger.rs
 *   RESEND_API_KEY=re_xxx npx tsx scripts/send-gramatika-emails.ts --send   # svih 79
 */
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [k, ...v] = line.split("="); if (k && v.length && !process.env[k.trim()]) process.env[k.trim()] = v.join("=").trim();
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const TEST = process.argv.includes("--test");
const SEND = process.argv.includes("--send");
const FROM = "Hartweger <kurs@hartweger.rs>";
const TEST_TO = "info@hartweger.rs";
const COURSE_SLUG = "gramatika-a2-b1";
const resend = TEST || SEND ? new Resend(process.env.RESEND_API_KEY!) : null;

function buildEmail(name: string, expiresAt: string): string {
  const expiry = new Date(expiresAt).toLocaleDateString("sr-Latn-RS", { day: "numeric", month: "long", year: "numeric" });
  return `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;background:#f8f9fa;margin:0;padding:0;">
  <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
    <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="text-align:center;margin-bottom:24px;"><img src="https://kurs.hartweger.rs/logo.jpg" alt="Hartweger" style="width:120px;height:auto;"/></div>
      <h1 style="font-size:20px;margin:0 0 16px;">Zdravo, ${name || "draga koleginice/kolega"}!</h1>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px;">
        Tvoj kurs <strong>Gramatika A2–B1</strong> se sada nalazi na <strong>novoj platformi</strong> — <a href="https://kurs.hartweger.rs" style="color:#4fb1d3;text-decoration:none;font-weight:600;">kurs.hartweger.rs</a>. Radi u svakom browseru, na telefonu i računaru — brža je i preglednija.
      </p>
      <div style="background:#f8fcfd;border-left:3px solid #4fb1d3;border-radius:6px;padding:14px 16px;margin:0 0 20px;">
        <div style="font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Tvoj kurs</div>
        <div style="font-size:15px;font-weight:700;">Gramatika A2–B1</div>
        <div style="font-size:12px;color:#999;margin-top:8px;">Pristup do: ${expiry}</div>
      </div>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 8px;"><strong>Kako da se prijaviš:</strong></p>
      <ol style="font-size:14px;line-height:1.7;color:#444;margin:0 0 20px;padding-left:20px;">
        <li>Klikni na dugme ispod</li>
        <li>Unesi svoju email adresu (ovu na koju čitaš mejl)</li>
        <li>Dobićeš link za prijavu na email — klikni na njega i gotovo!</li>
      </ol>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://kurs.hartweger.rs/prijava" style="display:inline-block;background:#4fb1d3;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Prijavi se na novu platformu</a>
      </div>
      <div style="background:#f0faf0;border-left:3px solid #34d399;border-radius:6px;padding:14px 16px;margin:0 0 20px;">
        <div style="font-size:14px;font-weight:700;margin-bottom:6px;">Šta te čeka u kursu?</div>
        <ul style="font-size:13px;line-height:1.7;color:#444;margin:0;padding-left:18px;">
          <li><strong>Video lekcije</strong> — Masterclass, Deklinacija prideva, pesme za lakše pamćenje</li>
          <li><strong>E-book i liste glagola</strong> — za preuzimanje (nepravilni glagoli, glagoli sa predlozima)</li>
          <li><strong>GLAGOLI test</strong> — 73 pitanja za samoproveru</li>
          <li><strong>NaKI</strong> — AI asistent za nemački</li>
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
  const { data: course } = await sb.from("courses").select("id").eq("slug", COURSE_SLUG).single();
  const { data: acc } = await sb.from("course_access").select("user_id,expires_at").eq("course_id", course!.id).gt("expires_at", new Date().toISOString());
  const out: { email: string; name: string; expires: string }[] = [];
  for (const a of acc || []) {
    const { data: p } = await sb.from("user_profiles").select("email,full_name").eq("id", a.user_id).single();
    if (!p?.email) continue;
    const email = p.email.toLowerCase();
    if (email.includes("hartweger.rs") || email.includes("test@")) continue;
    out.push({ email, name: p.full_name || "", expires: a.expires_at });
  }
  return out;
}

async function run() {
  if (TEST) {
    await resend!.emails.send({
      from: FROM, to: TEST_TO,
      subject: "[TEST] Tvoj Gramatika kurs je na novoj platformi! 🎉",
      html: buildEmail("Nataša (TEST)", new Date(Date.now() + 300 * 86400000).toISOString()),
    });
    console.log(`✓ Test mejl poslat na ${TEST_TO}`);
    return;
  }
  const list = await recipients();
  console.log(`Aktivnih Gramatika korisnika za mejl: ${list.length}`);
  if (!SEND) {
    console.log("[DRY-RUN] ništa nije poslato. --test za probu, --send za svih.");
    list.slice(0, 5).forEach((r) => console.log(`  ${r.email} (${r.name}) → ${r.expires.slice(0, 10)}`));
    return;
  }
  let sent = 0, err = 0;
  for (const r of list) {
    try {
      await resend!.emails.send({
        from: FROM, to: r.email,
        subject: "Tvoj Gramatika kurs je na novoj platformi! 🎉",
        html: buildEmail(r.name, r.expires),
      });
      sent++; console.log(`SENT ${r.email}`);
      if (sent % 10 === 0) await new Promise((x) => setTimeout(x, 1100));
    } catch (e) { err++; console.error(`ERR ${r.email}: ${(e as Error).message}`); }
  }
  console.log(`\nPoslato: ${sent}, grešaka: ${err}`);
}
run().catch((e) => { console.error(e); process.exit(1); });
