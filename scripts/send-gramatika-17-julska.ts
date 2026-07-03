/**
 * Mejl za 17 kupaca "Osnove gramatike" migriranih 02.07.2026 (nalozi + pristup već upisani
 * kroz migrate-gramatika-17-julska.ts). Ugao: stari sajt se gasi 7.7, kurs te čeka na novoj
 * platformi, pristup ti važi do <lični datum isteka>.
 *
 *   npx tsx scripts/send-gramatika-17-julska.ts            # DRY
 *   npx tsx scripts/send-gramatika-17-julska.ts --send
 */
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [k, ...v] = line.split("=");
  if (k && v.length && !process.env[k.trim()]) process.env[k.trim()] = v.join("=").trim();
}
const RESEND_KEY = process.env.RESEND_API_KEY!;
const FROM = "Hartweger <info@hartweger.rs>";
const SUBJECT = "Tvoj kurs Osnove gramatike je na novoj platformi (stari sajt se gasi 7. jula)";
const SEND = process.argv.includes("--send");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const MESECI = ["januara", "februara", "marta", "aprila", "maja", "juna", "jula", "avgusta", "septembra", "oktobra", "novembra", "decembra"];
function srDatum(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}. ${MESECI[d.getMonth()]} ${d.getFullYear()}.`;
}

function buildEmail(firstName: string | null, expires: string): string {
  const pozdrav = firstName ? `Zdravo ${firstName},` : "Zdravo,";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f8f9fa;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e">
<span style="display:none;max-height:0;overflow:hidden;color:#f8f9fa">Prešli smo na novu platformu - tvoj video kurs te čeka tamo. Napravi lozinku za 2 minuta.</span>
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="text-align:center;padding:8px 0 20px"><img src="https://www.hartweger.rs/logo.jpg" alt="Hartweger" width="150" style="max-width:150px;height:auto"><div style="font-size:13px;color:#999;margin-top:6px">Škola nemačkog jezika</div></div>
<div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
<h1 style="font-size:22px;margin:0 0 16px;color:#1a1a2e">Tvoj kurs te čeka na novoj platformi 🎬</h1>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px">${pozdrav}</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">Kupio/la si kod nas video kurs <strong>„Osnove nemačke gramatike"</strong> (video + priručnik). U međuvremenu smo prešli na novu, moderniju platformu - i tvoj kurs je već tamo, <strong>prebačen i spreman</strong>. Stari sajt se <strong>gasi 7. jula</strong>, pa ti od tada kurs gledaš isključivo na novoj platformi.</p>
<div style="background:#fff8f3;border-left:3px solid #e8915a;border-radius:6px;padding:16px 18px;margin:0 0 18px"><div style="font-size:15px;line-height:1.7;color:#1a1a2e"><strong>Traje 2 minuta:</strong><br>1. Klikni na dugme ispod<br>2. Ukucaj svoj mejl (ovaj na koji si dobio/la poruku)<br>3. Stigne ti link - postaviš lozinku i kurs je unutra 🎉<br><br><span style="font-size:13px;color:#666">Ako ti link ne stigne za minut-dva, proveri spam/promotions folder - ponekad zaluta tamo.</span></div></div>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 22px">Tvoj pristup kursu važi <strong>do ${expires}</strong> (godinu dana od kupovine) - iskoristi ga dok traje.</p>
<div style="text-align:center;margin:26px 0"><a href="https://www.hartweger.rs/reset-lozinke" style="display:inline-block;background:#4fb1d3;color:#fff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 34px;border-radius:8px">Napravi lozinku →</a></div>
<p style="font-size:14px;line-height:1.6;color:#666;margin:0 0 0">Ako ti ne stigne link ili nešto zapinje, samo odgovori na ovaj mejl ili nam piši na <a href="mailto:info@hartweger.rs" style="color:#4fb1d3">info@hartweger.rs</a> - uđemo zajedno.</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:20px 0 0">Srdačno,<br><strong>Hartweger tim</strong></p>
</div>
<div style="text-align:center;font-size:12px;color:#999;padding:18px 0">Hartweger - Škola nemačkog jezika · <a href="https://www.hartweger.rs" style="color:#999">hartweger.rs</a><br>Dobijaš ovaj mejl jer imaš kurs kod nas.</div>
</div></body></html>`;
}

interface Buyer { email: string; date_paid: string; full_name: string; }

async function run() {
  const input = JSON.parse(fs.readFileSync(path.resolve(__dirname, "_gramatika_valid_no_account_2026-07-02.json"), "utf-8"));
  const buyers: Buyer[] = input.buyers;
  console.log(`Publika: ${buyers.length} | Subject: ${SUBJECT}`);

  if (!SEND) {
    buyers.forEach((b) => {
      const expires = new Date(new Date(b.date_paid).getTime() + 365 * 86400000).toISOString();
      console.log(`  ${b.email} (${b.full_name.split(" ")[0]}) - pristup do ${srDatum(expires)}`);
    });
    console.log(`\n[DRY] --send da pošaljem.`);
    return;
  }

  let ok = 0, fail = 0;
  for (const b of buyers) {
    const expires = new Date(new Date(b.date_paid).getTime() + 365 * 86400000).toISOString();
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM, to: [b.email], reply_to: "info@hartweger.rs", bcc: ["info@hartweger.rs"],
        subject: SUBJECT, html: buildEmail(b.full_name.split(" ")[0] || null, srDatum(expires)),
      }),
    });
    if (res.ok) ok++; else { fail++; console.error(`  ✗ ${b.email}: ${res.status} ${await res.text()}`); }
    await sleep(600);
  }
  console.log(`\n✓ Poslato: ${ok}, neuspeha: ${fail} (od ${buyers.length}).`);
}
run().catch((e) => { console.error(e); process.exit(1); });
