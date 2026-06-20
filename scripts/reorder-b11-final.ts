/**
 * Finalni reorder B1.1 po modulima (uklj. 2 nove lekcije: Leseverstehen Glück → M1, Hörverstehen Gesund leben → M3).
 * Backup trenutnog redosleda → scripts/b11-order-backup.json
 * Dry-run podrazumevano; upis sa --apply.
 * Run: npx tsx scripts/reorder-b11-final.ts          (dry-run)
 *      npx tsx scripts/reorder-b11-final.ts --apply   (upis)
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [key, ...v] = line.split("=");
  if (key && v.length > 0) process.env[key.trim()] = v.join("=").trim();
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const B11 = "b8c765b7-c377-4941-a1f9-ebe39372fe4a";
const APPLY = process.argv.includes("--apply");

// Ciljani redosled (fragmenti naslova). Grupisano po modulima; „Reči" na kraju svakog modula.
const ORDER = [
  "Willkommen",
  // Modul 1
  "Rotkäppchen", "Als oder wenn", "Glück", "Erfolg und Lebensziele", "Was bringt Glück", "Modul 1 - Reč",
  // Modul 2
  "Relativne rečenice", "Filme und Serien", "Obwohl", "Modul 2 - Reč",
  // Modul 3
  "Profis gesucht", "Blutgruppen", "Pasiv prezenta", "Genitiv", "Pflegekrise", "E-Mail an einen Freund", "Gesund leben", "Bore-out", "Modul 3 - Reč",
  // Modul 4
  "Sprechblockaden", "Spielerisch Sprachen", "Lese und Hörverstehen", "Wortschatz B1", "Forumsbeitrag", "Modul 4 - Reč",
  // Modul 5
  "Jobsuche", "Infinitiv mit zu", "Berufswechsel", "Geschlechtergerechte", "Sprechen Prüfung B1", "Praktikum & Bewerbungs", "Modul 5 - Reč",
  // Modul 6
  "Temporale Präpositionen", "Finalsätze", "Fünf Radioansagen", "Modul 6 - Reč",
  // Modul 7
  "Konjunktiv II der Vergangenheit", "Umzug", "Zweiteilige Konnektoren", "Hotel Mama", "WG-Zimmer", "Entschuldigung an die Nachbarn", "Modul 7 - Reč",
];

const norm = (t: string) => t.toLowerCase().replace(/[—–-]/g, "-").replace(/\s+/g, " ").trim();

async function main() {
  const { data: all } = await supabase
    .from("lessons").select("id, title, order_index").eq("course_id", B11).order("order_index");
  if (!all) { console.error("Nema lekcija."); process.exit(1); }

  // Backup
  fs.writeFileSync(path.resolve(__dirname, "b11-order-backup.json"), JSON.stringify(all, null, 2));

  const used = new Set<string>();
  const final: typeof all = [];
  const missing: string[] = [];
  for (const frag of ORDER) {
    const nf = norm(frag);
    let l = all.find((x) => !used.has(x.id) && norm(x.title) === nf);
    if (!l) l = all.find((x) => !used.has(x.id) && norm(x.title).includes(nf));
    if (l) { used.add(l.id); final.push(l); } else missing.push(frag);
  }
  const leftover = all.filter((x) => !used.has(x.id));

  console.log("=== CILJANI REDOSLED B1.1 ===");
  final.forEach((l, i) => console.log(`${String(i).padStart(2)}  ${l.title}`));
  if (missing.length) console.log("\n⚠️ NEMAPIRANO iz plana:", missing.join(" | "));
  if (leftover.length) console.log("\n⚠️ LEKCIJE VAN PLANA (ostaju na kraju):", leftover.map((l) => l.title).join(" | "));
  console.log(`\nUkupno: ${all.length} | mapirano: ${final.length} | nemapirano plan: ${missing.length} | van plana: ${leftover.length}`);

  if (!APPLY) { console.log("\n(dry-run — pokreni sa --apply za upis)"); return; }
  if (missing.length) { console.error("\n❌ Ima nemapiranih iz plana — NE primenjujem. Proveri fragmente."); process.exit(1); }

  const seq = [...final, ...leftover];
  let ch = 0;
  for (let i = 0; i < seq.length; i++) {
    if (seq[i].order_index !== i) { await supabase.from("lessons").update({ order_index: i }).eq("id", seq[i].id); ch++; }
  }
  console.log(`\n✅ GOTOVO — ${ch} lekcija pomereno. Backup: scripts/b11-order-backup.json`);
}

main();
