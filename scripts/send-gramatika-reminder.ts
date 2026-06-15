/**
 * Blagi PODSETNIK Gramatika kupcima koji se JOŠ NISU ulogovali na www.hartweger.rs.
 * Originalni mejl poslat 2026-06-02. Ovo gađa samo one koji imaju nalog ali se nikad nisu ulogovali.
 *
 *   npx tsx scripts/send-gramatika-reminder.ts                              # dry-run (lista neulogovanih)
 *   RESEND_API_KEY=re_xxx npx tsx scripts/send-gramatika-reminder.ts --test # 1 test na info@hartweger.rs
 *   RESEND_API_KEY=re_xxx npx tsx scripts/send-gramatika-reminder.ts --send # svi neulogovani
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
const FROM = "Hartweger <info@hartweger.rs>";
const TEST_TO = "info@hartweger.rs";
const resend = TEST || SEND ? new Resend(process.env.RESEND_API_KEY!) : null;

function csvBuyers(): { email: string; name: string }[] {
  const csv = fs.readFileSync(path.resolve(__dirname, "../gramatika-kupci.csv"), "utf-8").trim().split("\n").slice(1);
  return csv.map((l) => {
    const m = l.match(/^("([^"]*)"|[^,]*),([^,]+),/);
    const name = m ? (m[2] ?? m[1]) : "";
    const email = m ? m[3].trim().toLowerCase() : "";
    return { email, name };
  }).filter((r) => r.email);
}

async function authMap(): Promise<Map<string, { last: string | null }>> {
  const map = new Map<string, { last: string | null }>();
  let page = 1;
  for (;;) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const u of data.users) if (u.email) map.set(u.email.toLowerCase(), { last: u.last_sign_in_at ?? null });
    if (data.users.length < 1000) break;
    page++;
  }
  return map;
}

function buildEmail(name: string): string {
  return `<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e;background:#f8f9fa;margin:0;padding:0;">
  <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
    <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="text-align:center;margin-bottom:24px;"><img src="https://www.hartweger.rs/logo.jpg" alt="Hartweger" style="width:120px;height:auto;"/></div>
      <h1 style="font-size:20px;margin:0 0 16px;">Zdravo, ${name || "draga koleginice/kolega"}!</h1>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px;">
        Pre par dana poslala sam ti mejl da se tvoj kurs <strong>Gramatika A2–B1</strong> preselio na novu platformu — <a href="https://www.hartweger.rs" style="color:#4fb1d3;text-decoration:none;font-weight:600;">www.hartweger.rs</a>. Vidim da se još nisi prijavio/la, pa te samo blago podsećam — tvoj pristup čeka, ništa nisi izgubio/la. 😊
      </p>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 8px;"><strong>Prijava traje minut:</strong></p>
      <ol style="font-size:14px;line-height:1.7;color:#444;margin:0 0 20px;padding-left:20px;">
        <li>Klikni na dugme ispod</li>
        <li>Unesi ovu email adresu (na koju čitaš mejl)</li>
        <li>Stiže ti link za prijavu na email — klikni i ušao/la si!</li>
      </ol>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://www.hartweger.rs/prijava" style="display:inline-block;background:#4fb1d3;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Prijavi se na novu platformu</a>
      </div>
      <div style="background:#f0faf0;border-left:3px solid #34d399;border-radius:6px;padding:14px 16px;margin:0 0 20px;">
        <div style="font-size:14px;font-weight:700;margin-bottom:6px;">Šta te čeka u kursu?</div>
        <ul style="font-size:13px;line-height:1.7;color:#444;margin:0;padding-left:18px;">
          <li><strong>Video lekcije</strong> — Masterclass, Deklinacija prideva, pesme za lakše pamćenje</li>
          <li><strong>E-book i liste glagola</strong> — za preuzimanje (nepravilni glagoli, glagoli sa predlozima)</li>
          <li><strong>GLAGOLI test</strong> — 73 pitanja za samoproveru</li>
        </ul>
      </div>
      <p style="font-size:14px;line-height:1.6;color:#444;margin:0 0 8px;">Ako nešto zapne kod prijave, samo odgovori na ovaj mejl — tu sam. Srećno učenje! 💪</p>
      <p style="font-size:14px;color:#444;margin:0;">— Nataša</p>
    </div>
    <div style="text-align:center;padding:20px;font-size:12px;color:#bbb;"><p style="margin:0;">Hartweger — Škola nemačkog jezika</p></div>
  </div>
</body></html>`;
}

async function run() {
  if (TEST) {
    await resend!.emails.send({
      from: FROM, to: TEST_TO,
      subject: "[TEST] Podsetnik: tvoj Gramatika kurs te čeka 🙂",
      html: buildEmail("Nataša (TEST)"),
    });
    console.log(`✓ Test mejl poslat na ${TEST_TO}`);
    return;
  }

  const buyers = csvBuyers();
  const auth = await authMap();
  // Cilj: imaju nalog ali se NIKAD nisu ulogovali
  const targets = buyers.filter((b) => { const a = auth.get(b.email); return a && a.last === null; });

  console.log(`Gramatika kupaca u CSV: ${buyers.length} | neulogovanih (cilj podsetnika): ${targets.length}`);
  if (!SEND) {
    console.log("[DRY-RUN] ništa nije poslato. --test za probu, --send za sve neulogovane.\n");
    targets.forEach((r) => console.log(`  ${r.email}  (${r.name})`));
    return;
  }
  let sent = 0, err = 0;
  for (const r of targets) {
    try {
      await resend!.emails.send({
        from: FROM, to: r.email,
        subject: "Podsetnik: tvoj Gramatika kurs te čeka 🙂",
        html: buildEmail(r.name),
      });
      sent++; console.log(`SENT ${r.email}`);
      if (sent % 10 === 0) await new Promise((x) => setTimeout(x, 1100));
    } catch (e) { err++; console.error(`ERR ${r.email}: ${(e as Error).message}`); }
  }
  console.log(`\nPoslato: ${sent}, grešaka: ${err}`);
}
run().catch((e) => { console.error(e); process.exit(1); });
