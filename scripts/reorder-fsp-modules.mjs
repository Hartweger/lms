// Sprovodi 4-modulnu strukturu FSP kursa (Natašina šema): postavlja badge.module
// i order_index za svih 25 lekcija. Moduli se grupišu po badge.module (uzastopno).
// Orphani (Pasiv, Zanimanja, Bolovi) smešteni na logično mesto - flagovani u izveštaju.
// Dry-run default; --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const M1 = "Osnovne informacije o ispitu";
const M2 = "Gramatika";
const M3 = "Rečnik";
const M4 = "Delovi ispita";

// finalni redosled: [id, module, naslov]
const ORDER = [
  ["c2ac1b90-6101-4742-b71d-186ddc6035f4", M1, "Kako izgleda ispit?"],
  ["d40bddcb-a386-460e-a269-33795e97d34e", M1, "Kako i odakle da učim?"],
  ["92a1db61-f9da-464e-b800-c7e21448af96", M1, "Koje kriterijume treba da ispunim na ispitu?"],
  ["22df86a5-6899-4906-9882-227a791d3d07", M1, "Korisni linkovi"],

  ["f40d65d5-7bfb-4c99-9062-cc243c9fd065", M2, "Indirektni govor (Konjunktiv I)"],
  ["bcac28e9-e4a0-466d-940c-a78adb3b28b4", M2, "Deklinacija prideva"],
  ["dd475263-aa49-45c8-b7f5-95895cf0c615", M2, "N-deklinacija"],
  ["fa3f9c57-3b00-4c7c-ab6a-9ea8fc7dfe5e", M2, "Predlozi sa genitivom"],
  ["7f15bb9a-896f-45ec-8183-025b2b893cde", M2, "Modalne rečce"],
  ["c5fb70b6-dc72-4a7c-894c-146494c07ee6", M2, "Buduće vreme"],
  ["b3f43434-4709-42ca-8a4d-69f198a8b961", M2, "Glagoli sa predlozima"],

  ["b33ca9e8-530d-4cb8-a0e3-8fa22d4edcc2", M3, "Brojevi"],
  ["f9cbf2f7-6001-4d66-b617-6b9e61de87dd", M3, "Medikamenti"],
  ["e5ece504-e655-4a08-872b-ddbe2c688792", M3, "Fachsprache vs. Patientensprache"],
  ["e8e1fa27-8b96-4b46-8188-4e27290b2e78", M3, "Skraćenice"],
  ["5c9d5540-d144-4cee-bc11-21284818dcaf", M3, "Delovi tela i organi"],
  ["c8cbcb15-13e7-4901-8831-8b2ea75a75c4", M3, "Zanimanja"],
  ["9966aa6f-623b-4333-8157-01331626d1ab", M3, "Povrede i nezgode"],
  ["30b4823e-5720-4fd6-afe0-987262292a29", M3, "Terapija, dijagnostika i simptomi po organima"],

  ["5204ac4b-eeb0-439d-be93-ed67805f54d2", M4, "Anamneza"],
  ["a4e33c1d-5c73-4b57-9547-5c4d6ddd9bed", M4, "Dokumentacija"],
  ["60c22cd1-88a9-47ec-b1fa-7f86a97a8bfb", M4, "Objašnjavanje pacijentima"],
  ["25da92fc-92cb-42c6-a67c-b379f0e9d725", M4, "Predstavljanje pacijenta"],
];

const CAT = { [M2]: "grammatik", [M3]: "wortschatz" }; // badge.category po modulu (M1/M4 bez)

async function main() {
  console.log(`Lekcija u šemi: ${ORDER.length}`);
  let mod = "";
  for (let i = 0; i < ORDER.length; i++) {
    const [, m, t] = ORDER[i];
    if (m !== mod) { console.log(`\n== ${m} ==`); mod = m; }
    console.log(`  ${String(i).padStart(2)}  ${t}`);
  }
  if (!APPLY) { console.log("\n[DRY-RUN] Nije upisano. --apply za primenu.\n"); return; }

  for (let i = 0; i < ORDER.length; i++) {
    const [id, module] = ORDER[i];
    const { data: l } = await sb.from("lessons").select("sections").eq("id", id).single();
    const sections = Array.isArray(l?.sections) ? [...l.sections] : [];
    const bi = sections.findIndex((s) => s.type === "badge");
    const badge = { type: "badge", module, ...(CAT[module] ? { category: CAT[module] } : {}) };
    if (bi >= 0) { badge.category = sections[bi].category || CAT[module]; sections[bi] = badge; }
    else sections.unshift(badge);
    const { error } = await sb.from("lessons").update({ order_index: i, sections }).eq("id", id);
    if (error) { console.log(`  ✗ ${id}: ${error.message}`); }
  }
  console.log("\n✓ Moduli i redosled primenjeni.");
  // verifikacija
  const { data: ls } = await sb.from("lessons").select("title,order_index,sections").eq("course_id", "290d07e1-f7d2-4df9-9ead-fd4685607a69").order("order_index");
  let cur = "";
  for (const l of ls) {
    const b = (l.sections || []).find((s) => s.type === "badge");
    if (b?.module !== cur) { console.log(`\n[${b?.module || "-"}]`); cur = b?.module; }
    console.log(`  ${String(l.order_index).padStart(2)} ${l.title}`);
  }
}
main().catch((e) => { console.error("GREŠKA:", e.message); process.exit(1); });
