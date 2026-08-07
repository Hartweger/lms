/**
 * Jednokratna popravka zastarelih group_sessions + end_date za B2.1 i B2.2 (07.08.2026).
 *
 * Uzrok: termini su pomereni (B2.1 12.08 -> 26.08, B2.2 04.08 -> 01.09) izmenom
 * start_date kroz admin formu. PATCH /api/admin/grupe/[id] menja start_date ali NE zove
 * syncGroupSessions - to radi samo "Osveži termin" (osvezi-termin route). Zato su sesije
 * i end_date ostali na starom rasporedu.
 *
 * Zašto ne prosto syncGroupSessions: ona briše samo BUDUĆE ne-otkazane 'auto' redove, pa
 * bi B2.2 zadržala fantomske 04.08 i 06.08 (već u prošlosti = ulaze u honorar!), a
 * ignoreDuplicates ne bi oživela otkazani 16. termin starog rasporeda koji je u novom
 * rasporedu regularan čas. Zato ovde brišemo SVE 'auto' redove pa upisujemo čist set.
 *
 * Bezbedno: obe grupe imaju 0 aktivnih upisa, 0 zahteva za zamenu i nijedan čas nije
 * održan. 'manual' redovi se NE diraju (nema ih, ali filter ostaje).
 *
 * NE dira gcal - kalendari profesorki se ne menjaju iz skripte (vidi memory pravilo).
 *
 *   npx tsx scripts/fix-b2-sesije.ts           # DRY - plan izmena
 *   npx tsx scripts/fix-b2-sesije.ts --apply
 */
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { computeSessionDates, computeEndDate } from "../src/lib/groups";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [k, ...v] = line.split("=");
  if (k && v.length && !process.env[k.trim()]) process.env[k.trim()] = v.join("=").trim();
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const APPLY = process.argv.includes("--apply");
const GROUPS = ["0aadb8ca-f425-4db5-8199-ca079f088c51", "00657d2a-b497-4cb9-9b0d-112a46d891f1"];
const danas = new Date().toISOString().slice(0, 10);

async function run() {
  for (const id of GROUPS) {
    const { data: g, error } = await supabase.from("groups")
      .select("id, level, start_date, days, duration_weeks, sessions_count, professor_id, end_date")
      .eq("id", id).single();
    if (error || !g) { console.error(`✗ grupa ${id}: ${error?.message ?? "ne postoji"}`); continue; }

    const tacni = computeSessionDates(g.start_date, g.days, g.duration_weeks, g.sessions_count);
    const tacanEnd = computeEndDate(g.start_date, g.days, g.duration_weeks, g.sessions_count);
    if (!tacni.length) { console.error(`✗ ${g.level}: ne mogu da izračunam termine (fale dani/trajanje)`); continue; }

    const { data: postojece } = await supabase.from("group_sessions")
      .select("id, session_date, source, cancelled").eq("group_id", id).order("session_date");
    const auto = (postojece ?? []).filter((s) => s.source === "auto");
    const manual = (postojece ?? []).filter((s) => s.source !== "auto");

    const setTacnih = new Set(tacni);
    const visak = auto.filter((s) => !setTacnih.has(s.session_date));
    const viskaUProslosti = visak.filter((s) => s.session_date < danas && !s.cancelled);
    const fale = tacni.filter((d) => !auto.some((s) => s.session_date === d && !s.cancelled));

    console.log(`\n=== ${g.level} (${g.start_date}, ${g.duration_weeks} ned, ${g.sessions_count} časova) ===`);
    console.log(`  zatečeno 'auto': ${auto.length} (${auto.filter((s) => s.cancelled).length} otkazanih), 'manual': ${manual.length}`);
    console.log(`  tačan raspored:  ${tacni.length} časova, ${tacni[0]} → ${tacni[tacni.length - 1]}`);
    console.log(`  višak (brišem):  ${visak.length}${visak.length ? " → " + visak.map((s) => s.session_date).join(", ") : ""}`);
    if (viskaUProslosti.length)
      console.log(`  ⚠ od toga u PROŠLOSTI (ulazilo u honorar): ${viskaUProslosti.map((s) => s.session_date).join(", ")}`);
    console.log(`  fali (dodajem):  ${fale.length}${fale.length ? " → " + fale.join(", ") : ""}`);
    console.log(`  end_date: ${g.end_date} → ${tacanEnd}`);

    if (!APPLY) continue;

    const { error: eDel } = await supabase.from("group_sessions")
      .delete().eq("group_id", id).eq("source", "auto");
    if (eDel) { console.error(`  ✗ brisanje: ${eDel.message}`); continue; }

    const rows = tacni.map((session_date) => ({
      group_id: id, professor_id: g.professor_id, session_date, source: "auto",
    }));
    const { error: eIns } = await supabase.from("group_sessions")
      .upsert(rows, { onConflict: "group_id,session_date", ignoreDuplicates: true });
    if (eIns) { console.error(`  ✗ upis: ${eIns.message}`); continue; }

    const { error: eUpd } = await supabase.from("groups")
      .update({ end_date: tacanEnd, updated_at: new Date().toISOString() }).eq("id", id);
    if (eUpd) { console.error(`  ✗ end_date: ${eUpd.message}`); continue; }

    console.log(`  ✓ ${g.level}: ${tacni.length} sesija upisano, end_date ${tacanEnd}`);
  }
  if (!APPLY) console.log(`\n[DRY] --apply da primenim.`);
  else console.log(`\nGOTOVO. Kalendar NIJE diran - gcal event i dalje kreće na starom datumu.`);
}
run().catch((e) => { console.error(e); process.exit(1); });
