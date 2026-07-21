/**
 * Podsetnik pred start B1.1 grupe (start danas 20.07.2026 u 20h, pon+sre 20-21h).
 * Publika: 43 primaoca kampanje od 14.07 koji se NISU upisali
 * (od 44 se upisala samo Anđelina V. - 15.07, ordera + group_enrollments provereno).
 * Poruka: krećemo večeras u 20h, ali može i da se uskoči u sredu u 20h. Ostala 2 mesta.
 *
 *   npx tsx scripts/send-b11-podsetnik.ts            # DRY
 *   npx tsx scripts/send-b11-podsetnik.ts --preview  # snimi HTML pregled
 *   npx tsx scripts/send-b11-podsetnik.ts --send
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
const SUBJECT = "B1.1 kreće večeras u 20h - a možeš i u sredu";
const KURS_URL = "https://www.hartweger.rs/kursevi/grupni-kurs-nemackog-jezika-b1-1-2";
const TEST_URL = "https://www.hartweger.rs/besplatno-testiranje";
const SEND = process.argv.includes("--send");
const PREVIEW = process.argv.includes("--preview");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Upisani iz kampanje - NE šalji (dodatna zaštita ako se lista menja). */
const UPISANI = new Set(["vucetic.andjelinaaa@gmail.com"]);

function buildEmail(firstName: string | null, variant: "test" | "naki"): string {
  const pozdrav = firstName ? `Ćao ${firstName},` : "Ćao,";
  const zavrsni =
    variant === "test"
      ? `<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 22px">Ako imaš pitanje pre prijave, odgovori na ovaj mejl - stižemo da odgovorimo i večeras.</p>`
      : `<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 22px">Ako nisi siguran/na da li je B1.1 pravi nivo za tebe, uradi naše <a href="${TEST_URL}" style="color:#4fb1d3">besplatno testiranje</a> (traje 15 minuta) ili samo odgovori na ovaj mejl pa ćemo te posavetovati.</p>`;
  const footer =
    variant === "test"
      ? "Dobijaš ovaj mejl jer si uradio/la naše besplatno testiranje nemačkog."
      : "Dobijaš ovaj mejl jer si nam se javio/la sa pitanjem o kursevima nemačkog.";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f8f9fa;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1a2e">
<span style="display:none;max-height:0;overflow:hidden;color:#f8f9fa">Prvi čas je večeras u 20h - ako ne stižeš, uskoči u sredu.</span>
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="text-align:center;padding:8px 0 20px"><img src="https://www.hartweger.rs/logo.jpg" alt="Hartweger" width="150" style="max-width:150px;height:auto"><div style="font-size:13px;color:#999;margin-top:6px">Škola nemačkog jezika</div></div>
<div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
<h1 style="font-size:22px;margin:0 0 16px;color:#1a1a2e">B1.1 kreće večeras u 20h ⏰</h1>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 16px">${pozdrav}</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">Pisali smo ti prošle nedelje o novoj B1.1 grupi - <strong>prvi čas je večeras u 20:00</strong>. Javljamo se još jednom jer su ostala samo <strong>2 slobodna mesta</strong>, a grupa je namerno mala (najviše 6 polaznika).</p>
<div style="background:#fff8f3;border-left:3px solid #e8915a;border-radius:6px;padding:16px 18px;margin:0 0 18px"><div style="font-size:15px;line-height:1.8;color:#1a1a2e"><strong>Ne stižeš večeras? Nije problem.</strong><br>Možeš da se priključiš i na drugom času, <strong>u sredu u 20:00</strong> - profesorka će ti reći šta je bilo na prvom času, a sve lekcije i vežbe za tu nedelju te čekaju na platformi.</div></div>
<p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px">Termin ostaje isti do kraja: <strong>ponedeljkom i sredom 20:00-21:00</strong>, 7 nedelja, do 2. septembra. Cena celog kursa je <strong>19.600 din.</strong></p>
<div style="text-align:center;margin:22px 0"><a href="${KURS_URL}" style="display:inline-block;background:#4fb1d3;color:#fff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 34px;border-radius:8px">Uzmi jedno od 2 mesta →</a></div>
${zavrsni}
<p style="font-size:15px;line-height:1.6;color:#444;margin:0">Vidimo se večeras ili u sredu?</p>
<p style="font-size:15px;line-height:1.6;color:#444;margin:20px 0 0">Pozdrav,<br><strong>Hartweger tim</strong></p>
</div>
<div style="text-align:center;font-size:12px;color:#999;padding:18px 0">Hartweger - Škola nemačkog jezika · <a href="https://www.hartweger.rs" style="color:#999">hartweger.rs</a><br>${footer}</div>
</div></body></html>`;
}

interface Primalac { email: string; name: string | null; crm_id?: string; }

async function run() {
  const input = JSON.parse(fs.readFileSync(path.resolve(__dirname, "_b11_ponuda_2026-07-14.json"), "utf-8"));
  const test: Primalac[] = input.test.filter((p: Primalac) => !UPISANI.has(p.email.toLowerCase()));
  const naki: Primalac[] = input.naki.filter((p: Primalac) => !UPISANI.has(p.email.toLowerCase()));
  console.log(`Publika: ${test.length} test + ${naki.length} naki = ${test.length + naki.length} | Subject: ${SUBJECT}`);

  if (PREVIEW) {
    const out = path.resolve(__dirname, "_b11_podsetnik_pregled.html");
    fs.writeFileSync(out, buildEmail("Marija", "test"));
    console.log(`Pregled: ${out}`);
    return;
  }

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
        "Idempotency-Key": `b11-podsetnik-2026-07-20/${p.email}`,
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
    fs.writeFileSync(path.resolve(__dirname, "_b11_podsetnik_sent_crm_ids.json"), JSON.stringify(sentCrmIds, null, 2));
    console.log(`CRM id-jevi poslatih NaKI lidova (${sentCrmIds.length}).`);
  }
}
run().catch((e) => { console.error(e); process.exit(1); });
