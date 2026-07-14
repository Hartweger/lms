/**
 * Ponuda za B1.1 grupu (start 20.07.2026, pon+sre 20-21h) - dve publike:
 *  - "test": 37 ljudi sa rezultatom B1.1 na besplatnom testiranju (bez kupovine)
 *  - "naki": 7 NaKI lidova (stage=nov, level=B1) - varijanta sa pozivom na testiranje
 * Ugao: B1 kao traženi nivo + večernji termin. Tekst odobrila Nataša 14.07.2026.
 *
 *   npx tsx scripts/send-b11-ponuda.ts            # DRY
 *   npx tsx scripts/send-b11-ponuda.ts --send
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
const SUBJECT = "B1 - nivo koji svi traže. Nova grupa kreće u ponedeljak, 20.7.";
const KURS_URL = "https://www.hartweger.rs/kursevi/grupni-kurs-nemackog-jezika-b1-1-2";
const TEST_URL = "https://www.hartweger.rs/besplatno-testiranje";
const SEND = process.argv.includes("--send");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function buildEmail(firstName: string | null, variant: "test" | "naki"): string {
  const pozdrav = firstName ? `Ćao ${firstName},` : "Ćao,";
  const zavrsni =
    variant === "test"
      ? `<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 22px">Ako imaš bilo koje pitanje pre prijave, samo odgovori na ovaj mejl.</p>`
      : `<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 22px">Ako nisi siguran/na da li je B1.1 pravi nivo za tebe, uradi naše <a href="${TEST_URL}" style="color:#4fb1d3">besplatno testiranje</a> (traje 15 minuta) ili samo odgovori na ovaj mejl pa ćemo te posavetovati.</p>`;
  const footer =
    variant === "test"
      ? "Dobijaš ovaj mejl jer si uradio/la naše besplatno testiranje nemačkog."
      : "Dobijaš ovaj mejl jer si nam se javio/la sa pitanjem o kursevima nemačkog.";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f8f9fa;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e">
<span style="display:none;max-height:0;overflow:hidden;color:#f8f9fa">B1.1 grupa kreće u ponedeljak 20.7. - večernji termin, mala grupa.</span>
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="text-align:center;padding:8px 0 20px"><img src="https://www.hartweger.rs/logo.jpg" alt="Hartweger" width="150" style="max-width:150px;height:auto"><div style="font-size:13px;color:#999;margin-top:6px">Škola nemačkog jezika</div></div>
<div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
<h1 style="font-size:22px;margin:0 0 16px;color:#1a1a2e">Nova B1.1 grupa kreće u ponedeljak, 20.7. 🎯</h1>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px">${pozdrav}</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">B1 je nivo koji se najčešće traži - za posao, za priznavanje diplome, za sertifikat. Ako ti je A2 iza tebe, sledeći korak je B1.1 - i baš <strong>u ponedeljak, 20. jula, otvaramo novu grupu</strong>.</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">Termin je namerno večernji: <strong>ponedeljkom i sredom od 20:00 do 21:00</strong> - kad se posao završi i dan smiri. Do 2. septembra prelaziš ceo B1.1 i u jesen ulaziš spreman/na za B1.2 i pripremu ispita, dok drugi tek kreću.</p>
<div style="background:#fff8f3;border-left:3px solid #e8915a;border-radius:6px;padding:16px 18px;margin:0 0 18px"><div style="font-size:15px;line-height:1.8;color:#1a1a2e"><strong>Šta te čeka:</strong><br>• živa online nastava sa profesorkom, ponedeljkom i sredom 20:00-21:00<br>• mala grupa, najviše 6 polaznika - svako dobija reč na svakom času<br>• 7 nedelja nastave (do 02.09) + video lekcije, vežbe i testovi na platformi, dostupni 24/7<br>• sertifikat po položenom završnom ispitu</div></div>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">Cena celog kursa: <strong>19.600 din.</strong></p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 8px">Prvi polaznik je već upisan - mesto rezervišeš ovde:</p>
<div style="text-align:center;margin:22px 0"><a href="${KURS_URL}" style="display:inline-block;background:#4fb1d3;color:#fff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 34px;border-radius:8px">Rezerviši svoje mesto →</a></div>
${zavrsni}
<p style="font-size:15px;line-height:1.6;color:#444;margin:0">Vidimo se u ponedeljak?</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:20px 0 0">Pozdrav,<br><strong>Hartweger tim</strong></p>
</div>
<div style="text-align:center;font-size:12px;color:#999;padding:18px 0">Hartweger - Škola nemačkog jezika · <a href="https://www.hartweger.rs" style="color:#999">hartweger.rs</a><br>${footer}</div>
</div></body></html>`;
}

interface Primalac { email: string; name: string | null; crm_id?: string; }

async function run() {
  const input = JSON.parse(fs.readFileSync(path.resolve(__dirname, "_b11_ponuda_2026-07-14.json"), "utf-8"));
  const test: Primalac[] = input.test;
  const naki: Primalac[] = input.naki;
  console.log(`Publika: ${test.length} test + ${naki.length} naki = ${test.length + naki.length} | Subject: ${SUBJECT}`);

  if (!SEND) {
    test.forEach((p) => console.log(`  [test] ${p.email}${p.name ? ` (${p.name})` : ""}`));
    naki.forEach((p) => console.log(`  [naki] ${p.email}${p.name ? ` (${p.name})` : ""}`));
    console.log(`\n[DRY] --send da pošaljem.`);
    return;
  }

  let ok = 0, fail = 0;
  const sentCrmIds: string[] = [];
  const sviRed: Array<{ p: Primalac; variant: "test" | "naki" }> = [
    ...test.map((p) => ({ p, variant: "test" as const })),
    ...naki.map((p) => ({ p, variant: "naki" as const })),
  ];
  for (const { p, variant } of sviRed) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `b11-ponuda-2026-07-14/${p.email}`,
      },
      body: JSON.stringify({
        from: FROM, to: [p.email], reply_to: "info@hartweger.rs",
        subject: SUBJECT, html: buildEmail(p.name, variant),
      }),
    });
    if (res.ok) {
      ok++;
      if (p.crm_id) sentCrmIds.push(p.crm_id);
    } else {
      fail++;
      console.error(`  ✗ ${p.email}: ${res.status}`);
    }
    await sleep(600);
  }
  console.log(`\n✓ Poslato: ${ok}, neuspeha: ${fail} (od ${sviRed.length}).`);
  if (sentCrmIds.length) {
    fs.writeFileSync(path.resolve(__dirname, "_b11_sent_crm_ids.json"), JSON.stringify(sentCrmIds, null, 2));
    console.log(`CRM id-jevi poslatih NaKI lidova u _b11_sent_crm_ids.json (${sentCrmIds.length}).`);
  }
}
run().catch((e) => { console.error(e); process.exit(1); });
