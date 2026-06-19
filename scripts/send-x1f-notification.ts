/**
 * Obaveštenje 4 ručno-migriranih (x1f.one) o novoj platformi.
 * Sadrži: prebačen pristup A1.1+A1.2 do 05.02.2027 + napomenu da se napredak NE prenosi.
 *   npx tsx scripts/send-x1f-notification.ts          # DRY
 *   RESEND_API_KEY=... npx tsx scripts/send-x1f-notification.ts --send
 */
import * as fs from "fs"; import * as path from "path";
const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [k, ...v] = line.split("="); if (k && v.length && !process.env[k.trim()]) process.env[k.trim()] = v.join("=").trim();
}
const RESEND_KEY = process.env.RESEND_API_KEY!;
const FROM = "Hartweger <info@hartweger.rs>";
const SUBJECT = "Tvoj nemački je prešao na novu platformu — evo kako da uđeš";
const SEND = process.argv.includes("--send");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const USERS = [
  // SVI VEĆ OBAVEŠTENI (2026-06-18). Lista prazna da ponovno pokretanje ne pošalje duplikate.
  // Poslato: katarina.milenkovic, marko.milosavljevic, zarko.bogicevic, aleksandar.stanojevic, marko.pejic.
];

function buildEmail(name: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f8f9fa;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e">
<span style="display:none;max-height:0;overflow:hidden;color:#f8f9fa">Tvoji kursevi A1.1 i A1.2 su prebačeni i čekaju te na novoj platformi.</span>
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="text-align:center;padding:8px 0 20px"><img src="https://www.hartweger.rs/logo.jpg" alt="Hartweger" width="150" style="max-width:150px;height:auto"><div style="font-size:13px;color:#999;margin-top:6px">Škola nemačkog jezika</div></div>
<div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
<h1 style="font-size:22px;margin:0 0 16px;color:#1a1a2e">Tvoj nemački je na novoj platformi 🎉</h1>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px">Zdravo ${name},</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">Preselili smo školu nemačkog na novu, bržu platformu na <strong>hartweger.rs</strong> — i usput je napravili znatno boljom. Tvoj nalog i kursevi su <strong>već prebačeni</strong>, ništa ne kupuješ ponovo.</p>
<div style="background:#f8fcfd;border-left:3px solid #4fb1d3;border-radius:6px;padding:16px 18px;margin:0 0 18px"><div style="font-size:15px;line-height:1.9;color:#1a1a2e"><strong>Tvoj pristup:</strong><br>✅ Nemački A1.1 i A1.2 — <strong>aktivni do 05.02.2027.</strong></div></div>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 8px">Šta je novo:</p>
<div style="background:#f8fcfd;border-left:3px solid #4fb1d3;border-radius:6px;padding:16px 18px;margin:0 0 18px"><div style="font-size:15px;line-height:1.9;color:#1a1a2e">✅ <strong>Mnogo više vežbanja</strong> uz svaku lekciju<br>✅ <strong>Bolja priprema za ispit</strong> — probni testovi i modeli<br>✅ <strong>Priručnik i e-book</strong> uz kurs<br>✅ <strong>Praćenje napretka</strong> i sertifikat po završetku</div></div>
<div style="background:#fff8f0;border-left:3px solid #e0a44f;border-radius:6px;padding:14px 18px;margin:0 0 22px"><div style="font-size:14px;line-height:1.7;color:#5a4a2e">ℹ️ <strong>Napomena:</strong> Označene/završene lekcije sa stare platforme ne prenose se automatski — lekcije kreću iz početka. To je dobra prilika da uz nove interaktivne zadatke ponoviš i učvrstiš gradivo.</div></div>
<div style="text-align:center;margin:26px 0"><a href="https://www.hartweger.rs/prijava" style="display:inline-block;background:#4fb1d3;color:#fff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 34px;border-radius:8px">Uđi u svoj nalog →</a></div>
<p style="font-size:14px;line-height:1.6;color:#666;margin:0 0 6px"><strong>Prijava je laka:</strong> na <a href="https://www.hartweger.rs/prijava" style="color:#4fb1d3">hartweger.rs/prijava</a> ukucaš ovaj svoj mejl i stigne ti link za prijavu — bez lozinke.</p>
<p style="font-size:14px;line-height:1.6;color:#666;margin:14px 0 0">Pitanja? Samo odgovori na ovaj mejl ili nam piši na <a href="mailto:info@hartweger.rs" style="color:#4fb1d3">info@hartweger.rs</a>.</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:20px 0 0">Srdačno,<br><strong>Hartweger tim</strong></p>
</div>
<div style="text-align:center;font-size:12px;color:#999;padding:18px 0">Hartweger — Škola nemačkog jezika · <a href="https://www.hartweger.rs" style="color:#999">hartweger.rs</a><br>Dobijaš ovaj mejl jer imaš kurs kod nas.</div>
</div></body></html>`;
}

async function run() {
  console.log(`${SEND ? "SLANJE" : "DRY"} — ${USERS.length} primalaca, naslov: "${SUBJECT}"`);
  if (!SEND) { USERS.forEach((u) => console.log(`  → ${u.email} (${u.first})`)); console.log("\n[DRY] --send za slanje."); return; }
  let ok = 0, fail = 0;
  for (const u of USERS) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [u.email], reply_to: "info@hartweger.rs", subject: SUBJECT, html: buildEmail(u.first) }),
    });
    if (r.ok) { const j = await r.json(); console.log(`  ✓ ${u.email} (${j.id})`); ok++; }
    else { console.error(`  ✗ ${u.email}: ${r.status} ${await r.text()}`); fail++; }
    await sleep(800);
  }
  console.log(`\nGotovo: ${ok} poslato, ${fail} neuspeha.`);
}
run().catch((e) => { console.error(e); process.exit(1); });
