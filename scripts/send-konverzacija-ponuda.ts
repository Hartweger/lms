/**
 * Ponuda za Konverzacijski kurs (B1+) - novi termin od 15.08.2026 (subotom 10-11h).
 * Publika (32): "interes" (Obavesti me na stranici kursa), "naki-smile" (pričali sa
 * NaKI/Smile o konverzaciji), "kampanja-jun" (primaoci junske kampanje - ista poruka za sve).
 * Tekst odobrila Nataša 30.07.2026.
 *
 *   npx tsx scripts/send-konverzacija-ponuda.ts            # DRY
 *   npx tsx scripts/send-konverzacija-ponuda.ts --send
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
const SUBJECT = "Otvoren je termin za Konverzacijski kurs (B1+) - od 15. avgusta";
const KURS_URL = "https://www.hartweger.rs/kursevi/grupni-konverzacijski-kurs-nemackog-b1";
const SEND = process.argv.includes("--send");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function buildEmail(firstName: string | null): string {
  const pozdrav = firstName ? `Ćao ${firstName},` : "Ćao,";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f8f9fa;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e">
<span style="display:none;max-height:0;overflow:hidden;color:#f8f9fa">Konverzacijski kurs (B1+) kreće 15. avgusta - subotom u 10h, samo 6 mesta.</span>
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="text-align:center;padding:8px 0 20px"><img src="https://www.hartweger.rs/logo.jpg" alt="Hartweger" width="150" style="max-width:150px;height:auto"><div style="font-size:13px;color:#999;margin-top:6px">Škola nemačkog jezika</div></div>
<div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
<h1 style="font-size:22px;margin:0 0 16px;color:#1a1a2e">Vreme je da propričaš nemački 🗣️</h1>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px">${pozdrav}</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">javljam se jer te je zanimala vežba konverzacije na nemačkom - imamo dobru vest: otvoren je novi termin <strong>Konverzacijskog kursa (B1+)</strong>.</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">Ovo je kurs za sve koji nemački razumeju, ali žele konačno i da propričaju - bez straha od greške, u maloj grupi gde svako dobija reč na svakom času.</p>
<div style="background:#fff8f3;border-left:3px solid #e8915a;border-radius:6px;padding:16px 18px;margin:0 0 18px"><div style="font-size:15px;line-height:1.8;color:#1a1a2e"><strong>Šta te čeka:</strong><br>• 9 časova uživo online, subotom od 10 do 11h<br>• početak: subota, 15. avgust<br>• mala grupa - samo 6 mesta, svako dobija reč<br>• vodi profesorka Katarina</div></div>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">Cena celog kursa: <strong>17.550 din.</strong></p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 6px">Mesta se popunjavaju redom prijava, pa ako znaš da želiš - rezerviši svoje na vreme:</p>
<div style="text-align:center;margin:26px 0"><a href="${KURS_URL}" style="display:inline-block;background:#4fb1d3;color:#fff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 34px;border-radius:8px">Rezerviši svoje mesto →</a></div>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 22px">Ako imaš bilo koje pitanje, samo odgovori na ovaj mejl.</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:20px 0 0">Srdačno,<br><strong>Hartweger tim</strong></p>
</div>
<div style="text-align:center;font-size:12px;color:#999;padding:18px 0">Hartweger - Škola nemačkog jezika · <a href="https://www.hartweger.rs" style="color:#999">hartweger.rs</a><br>Dobijaš ovaj mejl jer te je zanimalo vežbanje konverzacije na nemačkom.</div>
</div></body></html>`;
}

interface Primalac { email: string; name: string | null; grupa: string; }

async function run() {
  const input = JSON.parse(fs.readFileSync(path.resolve(__dirname, "_konverzacija_ponuda_2026-07-30.json"), "utf-8"));
  const primaoci: Primalac[] = input.primaoci;
  console.log(`Publika: ${primaoci.length} | Subject: ${SUBJECT}`);

  if (!SEND) {
    primaoci.forEach((p) => console.log(`  [${p.grupa}] ${p.email}${p.name ? ` (${p.name})` : ""}`));
    console.log(`\n[DRY] --send da pošaljem.`);
    return;
  }

  let ok = 0, fail = 0;
  const poslati: string[] = [];
  for (const p of primaoci) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `konverzacija-b1-2026-07-30/${p.email}`,
      },
      body: JSON.stringify({
        from: FROM, to: [p.email], reply_to: "info@hartweger.rs",
        subject: SUBJECT, html: buildEmail(p.name),
      }),
    });
    if (res.ok) {
      ok++;
      poslati.push(p.email);
    } else {
      fail++;
      console.error(`  ✗ ${p.email}: ${res.status} ${await res.text()}`);
    }
    await sleep(600);
  }
  console.log(`\n✓ Poslato: ${ok}, neuspeha: ${fail} (od ${primaoci.length}).`);
  fs.writeFileSync(path.resolve(__dirname, "_konverzacija_poslato_2026-07-30.json"), JSON.stringify(poslati, null, 2));
  console.log(`Lista poslatih u _konverzacija_poslato_2026-07-30.json (${poslati.length}).`);
}
run().catch((e) => { console.error(e); process.exit(1); });
