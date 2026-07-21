/**
 * Test render podsetnika profesorki (sendProfNextGroupReminder) sa PRAVIM podacima
 * B1.1 grupe koja se završava 06.08. Šalje SAMO na info@hartweger.rs, radi pregleda.
 *
 *   npx tsx scripts/test-prof-podsetnik-mejl.ts
 */
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [k, ...v] = line.split("=");
  if (k && v.length && !process.env[k.trim()]) process.env[k.trim()] = v.join("=").trim();
}

const SLEDECA = {
  nivo: "B1.2",
  startDate: "2026-08-13",
  dani: "Utorak, Četvrtak",
  vreme: "18:00-19:00",
  profIme: "Milica Vučić",
  slobodno: 2,
};

async function main() {
  const { sendProfNextGroupReminder, sendNextLevelOffer } = await import("../src/lib/email");

  // Ponuda polaznicima - nova varijanta sa konkretnom grupom.
  await sendNextLevelOffer("info@hartweger.rs", "Maja Kocec", {
    currentNivo: "B1.1",
    nextNivo: "B1.2",
    courseUrl: "https://www.hartweger.rs/kursevi/grupni-kurs-nemackog-b1-2",
    sledeca: SLEDECA,
  });
  console.log("Ponuda polazniku poslata na info@hartweger.rs");

  await sendProfNextGroupReminder("info@hartweger.rs", {
    profIme: "Milica Vučić",
    nivo: "B1.1",
    endDate: "2026-08-06",
    polaznici: [
      { email: "bilja_j91@hotmail.com", ime: "Biljana J." },
      { email: "biljanajankovic2@gmail.com", ime: "Biljana Janković" },
      { email: "haris.a1@icloud.com", ime: "Haris A." },
      { email: "maja_kocec@hotmail.com", ime: "Maja Kocec" },
      { email: "mirna.fejzic@gmail.com", ime: "Mirna Fejzić" },
      { email: "pierretheboss1987@gmail.com", ime: "" },
    ],
    sledeca: SLEDECA,
    nextNivo: "B1.2",
    rasporedUrl: "https://www.hartweger.rs/raspored",
  });
  console.log("Podsetnik profesorki poslat na info@hartweger.rs");
}
main().catch((e) => { console.error(e); process.exit(1); });
