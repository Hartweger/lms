// Jednokratni uvoz početnog stanja isplata profesorkama (02.07.2026).
// Kontekst: isplate su do juna vođene u Natašinom "Isplata 2026" sheetu, van platforme -
// professor_payments je bio prazan pa je saldo na /admin/obaveze bio naduvan.
// Odluka: sve zaključno sa 31.05. je isplaćeno → po profesorki JEDNA stavka u iznosu
// zarađenog na platformi do 31.05. (časovi + sesije + odobrene aktivnosti), čime saldo
// od 1.6. živi samo od platforme. Milica ima pretplatu 2.575 (sheet, maj) - dodata na stavku.
// Direktan insert (service role) NE šalje mejlove - mejl ide samo kroz admin UI rutu.
// Idempotentno preko note markera.
import { client } from "./lib/exam-packer.mjs";
const sb = client();

const NOTE = "početno stanje - evidencija do 31.05. vođena van platforme (Isplata sheet)";
const PRETPLATA = { Milica: 2575, Suzana: 6328 }; // Milica: sheet maj "2575 - pretplata"; Suzana: maj uplaćeno 62.328 vs platformski obračun 56.000 (korigovano naknadno 02.07)
const DATUM = "2026-05-31";

const { data: profs, error: pErr } = await sb.from("user_profiles")
  .select("id, full_name, honorar_ind, honorar_grp").not("honorar_ind", "is", null);
if (pErr) throw pErr;

const f = (n) => n.toLocaleString("de-DE");
let upisano = 0;
for (const p of profs ?? []) {
  const { data: postojece } = await sb.from("professor_payments")
    .select("id").eq("professor_id", p.id).eq("note", NOTE).limit(1);
  if ((postojece ?? []).length > 0) { console.log(`= ${p.full_name}: već upisano, preskačem`); continue; }

  const [i, g, a] = await Promise.all([
    sb.from("individual_lessons").select("*", { count: "exact", head: true })
      .eq("professor_id", p.id).lte("lesson_date", DATUM),
    sb.from("group_sessions").select("*", { count: "exact", head: true })
      .eq("professor_id", p.id).eq("cancelled", false).lte("session_date", DATUM),
    sb.from("professor_activities").select("amount").eq("professor_id", p.id)
      .eq("status", "odobreno").lte("activity_date", DATUM),
  ]);
  if (i.error || g.error || a.error) throw (i.error ?? g.error ?? a.error);
  const akt = (a.data ?? []).reduce((s, r) => s + (r.amount || 0), 0);
  const zaradjeno = (i.count ?? 0) * (p.honorar_ind ?? 1400) + (g.count ?? 0) * (p.honorar_grp ?? 1600) + akt;
  const pretplata = PRETPLATA[Object.keys(PRETPLATA).find((k) => (p.full_name ?? "").includes(k)) ?? ""] ?? 0;
  const iznos = zaradjeno + pretplata;
  if (iznos <= 0) { console.log(`- ${p.full_name}: 0 zarađeno do 31.05, nema stavke`); continue; }

  const { error } = await sb.from("professor_payments").insert({
    professor_id: p.id, payment_date: DATUM, amount: iznos, note: NOTE,
  });
  if (error) throw new Error(`${p.full_name}: ${error.message}`);
  console.log(`✓ ${p.full_name}: upisano ${f(iznos)} din${pretplata ? ` (uklj. pretplata ${f(pretplata)})` : ""}`);
  upisano++;
}
console.log(`Gotovo: ${upisano} stavki.`);
