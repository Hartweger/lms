/**
 * Backfill `groups.calendar_id` = mejl profesorke u čijem je kalendaru Google serija.
 *
 * Zašto: GAS pravi event u kalendaru profesorke (`prof.email`), ali baza to nigde nije pamtila.
 * Kad se profesorka promeni, `osvezi-termin` je zvao `moveTerm` nad NOVIM kalendarom i dobijao
 * "Not Found" (B1.1, 29.08.2026). Sada `calendar_id` čuva stvarni kalendar, pa ruta ume da
 * preseli termin. Postojeće grupe nemaju tu vrednost - ovde je upisujemo.
 *
 * Bezbedno: nijednoj postojećoj grupi profesorka nije menjana posle otvaranja termina (jedini
 * takav slučaj, B1.1 16.09, sređen je ručno), pa je event u kalendaru TRENUTNE profesorke.
 * Diramo samo grupe koje imaju `gcal_event_id` a nemaju `calendar_id`.
 *
 * Pokretanje:  npx tsx scripts/backfill-calendar-id.ts           (suvo, samo ispis)
 *              npx tsx scripts/backfill-calendar-id.ts --apply   (upisuje)
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const envPath = path.join(process.cwd(), ".env.local");
const env = Object.fromEntries(
  fs.readFileSync(envPath, "utf8").split("\n").filter((l) => l.includes("=")).map((l) => {
    const i = l.indexOf("=");
    return [l.slice(0, i).trim(), l.slice(i + 1).replace(/^["']|["']$/g, "")];
  }),
);

const apply = process.argv.includes("--apply");
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await db
    .from("groups")
    .select("id, level, start_date, gcal_event_id, calendar_id, professor:professor_id(full_name, email)")
    .not("gcal_event_id", "is", null)
    .is("calendar_id", null)
    .order("start_date");
  if (error) throw error;

  const kandidati = data ?? [];
  console.log(`Grupa sa terminom bez calendar_id: ${kandidati.length}${apply ? "" : "  (suvo - ništa se ne upisuje)"}\n`);

  let upisano = 0;
  const bezMejla: string[] = [];
  for (const g of kandidati) {
    const p = Array.isArray(g.professor) ? g.professor[0] : g.professor;
    const mejl = (p?.email || "").toLowerCase();
    const opis = `${g.level} · ${g.start_date} · ${p?.full_name || "(bez profesorke)"}`;
    if (!mejl) {
      bezMejla.push(opis);
      console.log(`  PRESKOČENO  ${opis} - profesorka nema mejl`);
      continue;
    }
    console.log(`  ${apply ? "upisujem  " : "upisao bih"}  ${opis}  →  ${mejl}`);
    if (apply) {
      const { error: e } = await db.from("groups").update({ calendar_id: mejl }).eq("id", g.id);
      if (e) { console.error(`    GREŠKA: ${e.message}`); continue; }
      upisano++;
    }
  }

  console.log(`\n${apply ? `Upisano: ${upisano}` : "Suvo pokretanje - pokreni sa --apply da upiše."}`);
  if (bezMejla.length) console.log(`Bez mejla profesorke (ostaju prazne): ${bezMejla.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
