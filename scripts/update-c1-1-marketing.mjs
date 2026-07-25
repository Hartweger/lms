// Prodajna strana grupnog C1.1: dodaje prateći materijal na platformi u features
// i marketing_description. NE pominje video lekcije (za C1 ih nema).
// ČEKA POTVRDU TEKSTA OD NATAŠE. Idempotentno. Bez --apply je dry-run.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const FEATURES = [
  "Živa nastava 2× nedeljno sa profesorkom (Google Meet, grupe 3-6)",
  "Ciljano vežbanje svih veština: Hören, Lesen, Schreiben, Sprechen",
  "Kompleksni tekstovi, prezentacije i pisanje eseja",
  "Priprema za Goethe C1 ispit",
  "Prateći materijal na platformi: objašnjenja gramatike sa tabelama za svih 12 lekcija",
  "Kartice za učenje reči - 796 reči nivoa C1.1 (DE↔SR)",
  "Mini vežbe i test posle svake lekcije + završni test nivoa",
  "Aplikacija za telefon - link dobijaš, instaliraš za sekund",
  "Sav materijal dobijaš od nas - bez kupovine udžbenika",
  "Beleške sa svakog časa",
  "Pristup platformi godinu dana",
  "Sertifikat HARTWEGER centra po završetku",
];

const MDESC = `Na C1.1 nivou ovladavaš poslovnim i akademskim nemačkim. Kompleksni tekstovi, prezentacije, pisanje eseja i priprema za Goethe C1 ispit.

Živa nastava 2× nedeljno, u maloj grupi od 3 do 6 polaznika. Uz časove dobijaš i prateći materijal na platformi: objašnjenja gramatike, kartice za učenje reči, vežbe i testove za svaku lekciju.`;

const { data: before, error } = await sb
  .from("courses").select("id,slug,features,marketing_description").eq("slug", "grupni-kurs-c1-1").single();
if (error) throw error;

console.log("STARO features:"); (before.features ?? []).forEach((f) => console.log("  - " + f));
console.log("\nNOVO features:"); FEATURES.forEach((f) => console.log("  - " + f));
console.log("\nNOVO marketing_description:\n" + MDESC);

if (APPLY) {
  const { error: uErr } = await sb.from("courses")
    .update({ features: FEATURES, marketing_description: MDESC }).eq("id", before.id);
  if (uErr) throw uErr;
  console.log("\nGOTOVO (apply). Prodajna strana je ažurirana.");
} else {
  console.log("\nGOTOVO (dry-run). Ništa nije promenjeno. Pokreni sa --apply posle potvrde teksta.");
}
