// Seed: Konverzacijski kurs nemačkog (B1+) - courses red + groups red.
// Dry-run podrazumevano; --apply za upis.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const APPLY = process.argv.includes("--apply");

const SLUG = "grupni-konverzacijski-kurs-nemackog-b1";
const LEVEL = "Konverzacija B1+";

const courseRow = {
  title: "Konverzacijski kurs nemačkog (B1+)",
  slug: SLUG,
  description:
    "Konverzacijski kurs nemačkog za nivo B1+. Praksa govora u maloj grupi, 9 termina online, teme iz svakodnevnog života na DACH području.",
  course_type: "group",
  category: "grupni",
  price: 17550,
  paypal_price_eur: 150,
  is_published: true,
  is_purchasable: true,
  marketing_description:
    "Živiš u Nemačkoj, Austriji ili Švajcarskoj, razumeš dosta - ali kad treba da progovoriš, negde zastaneš? Ovaj kurs je napravljen tačno za tebe. U maloj grupi ljudi koji se nose sa istim, naučićeš da koristiš nemački u stvarnim situacijama: na poslu, kod lekara, sa komšijama, u prodavnici.\n" +
    "Jednom nedeljno, petkom, srećemo se online. Svaki čas je posvećen jednoj temi iz tvog svakodnevnog života - od posla i porodice do putovanja i digitalizacije. Prvi čas je opušteni Icebreaker - pričamo slobodno i upoznajemo se. Pre svakog narednog časa dobijaš set reči na platformi (naše kartice za vežbanje) da ih naučiš u svom tempu, a na času ih odmah koristimo u razgovoru. Bez dosadnog ponavljanja, bez straha od greške.",
  features: [
    "9 termina, jednom nedeljno, petkom u 13h - online preko Google Meet",
    "Setovi reči na platformi - pre svakog časa dobijaš kartice da se pripremiš",
    "8 konverzacijskih tema iz stvarnog života na DACH području",
    "Mala grupa - maksimalno 6 polaznika, svi pričaju, niko ne čeka",
  ],
};

// ── 1) Katarina (profesor) ────────────────────────────────────────────────
const { data: profs, error: pErr } = await sb
  .from("user_profiles")
  .select("id, full_name, email, role")
  .ilike("full_name", "%katarina%");
if (pErr) { console.error("user_profiles greška:", pErr.message); process.exit(1); }
console.log("Kandidati za profesora (Katarina):");
(profs || []).forEach((p) => console.log(`  - ${p.full_name} <${p.email}> role=${p.role} id=${p.id}`));
const katarina = (profs || []).find((p) => /todosij/i.test(p.full_name)) || (profs || [])[0];
if (!katarina) { console.error("NEMA Katarine u user_profiles."); process.exit(1); }
console.log("→ Biram:", katarina.full_name, katarina.id);

// ── 2) Postojeći kurs? ────────────────────────────────────────────────────
const { data: existing } = await sb.from("courses").select("id, slug").eq("slug", SLUG).maybeSingle();
console.log("Postojeći kurs sa slug-om:", existing ? existing.id : "nema");

const groupRow = {
  level: LEVEL,
  type: "grupni",
  professor_id: katarina.id,
  content_course_id: null,
  status: "otvoren",
  start_date: "2026-07-03",
  duration_weeks: 9,
  days: [5],
  session_time: "13:00-14:00",
  min_seats: 3,
  max_seats: 6,
  source: "konverzacijski-2026-07",
};

console.log("\ncourseRow:", JSON.stringify(courseRow, null, 2));
console.log("groupRow:", JSON.stringify(groupRow, null, 2));

if (!APPLY) { console.log("\nDry-run - pokreni sa --apply za upis."); process.exit(0); }

// ── 3) Upis ───────────────────────────────────────────────────────────────
let courseId = existing?.id;
if (!courseId) {
  const { data, error } = await sb.from("courses").insert(courseRow).select("id").single();
  if (error) { console.error("courses insert greška:", error.message); process.exit(1); }
  courseId = data.id;
  console.log("✓ courses upisan:", courseId);
} else {
  console.log("courses već postoji, preskačem insert:", courseId);
}

// grupa: izbegni duplikat po level+start_date
const { data: gExist } = await sb
  .from("groups").select("id").eq("level", LEVEL).eq("start_date", "2026-07-03").maybeSingle();
if (gExist) {
  console.log("grupa već postoji:", gExist.id);
} else {
  const { data, error } = await sb.from("groups").insert(groupRow).select("id").single();
  if (error) { console.error("groups insert greška:", error.message); process.exit(1); }
  console.log("✓ groups upisan:", data.id);
}
console.log("Gotovo.");
