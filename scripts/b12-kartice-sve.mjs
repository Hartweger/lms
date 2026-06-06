// B1.2 — Kartice/vokabular SVI moduli: množina (kratki oblik -n/-en/-e/¨e/¨er/-) + predlog/padež.
// Mapira TAČAN trenutni nemački termin → obogaćeni. Hvata i dugi oblik iz Modula 1 i originale.
// Menja samo nemačku stranu (row[0]); prevod ostaje. Idempotentno. Dry-run; --apply.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const MAP = {
  // ── Modul 1 dugi oblik → kratki ──
  "der Auftrag, Aufträge": "der Auftrag, ¨e",
  "der Einfluss, Einflüsse": "der Einfluss, ¨e",
  "der Arbeitsplatz, Arbeitsplätze": "der Arbeitsplatz, ¨e",
  "die Konsequenz, Konsequenzen": "die Konsequenz, -en",
  "das Tabuthema, Tabuthemen": "das Tabuthema, -themen",
  "die Beschwerde, Beschwerden": "die Beschwerde, -n",
  "das Problem, Probleme": "das Problem, -e",
  "die Frist, Fristen": "die Frist, -en",
  "die Mahnung, Mahnungen": "die Mahnung, -en",
  "der Fehler, Fehler": "der Fehler, -",
  "das Missverständnis, Missverständnisse": "das Missverständnis, -se",
  "die Lösung, Lösungen": "die Lösung, -en",
  "der Termin, Termine": "der Termin, -e",
  "der Vorgesetzte, Vorgesetzten": "der Vorgesetzte, -n",
  "die Verspätung, Verspätungen": "die Verspätung, -en",

  // ── Originalni oblici (svi ostali moduli) ──
  // #8
  "die Tablette": "die Tablette, -n",
  "das Rezept": "das Rezept, -e",
  "der Ratschlag": "der Ratschlag, ¨e",
  // #9
  "die Reklamation": "die Reklamation, -en",
  "die Beschwerde": "die Beschwerde, -n",
  "die Lieferung": "die Lieferung, -en",
  "der Defekt": "der Defekt, -e",
  "die Rückerstattung": "die Rückerstattung, -en",
  "der Umtausch": "der Umtausch (nur Sg.)",
  "die Garantie": "die Garantie, -n",
  "der Kundenservice": "der Kundenservice (nur Sg.)",
  "die Bestellnummer": "die Bestellnummer, -n",
  "sich beschweren": "sich beschweren (über + Akk)",
  // #10 / #32
  "die Distanz": "die Distanz, -en",
  "die Entwicklung": "die Entwicklung, -en",
  "die Überstunden": "die Überstunden (Pl.)",
  // #11 / #13
  "die Umstellung": "die Umstellung, -en",
  "sich gewöhnen an": "sich gewöhnen an + Akk",
  "das Herkunftsland": "das Herkunftsland, ¨er",
  // #16
  "die eigene Stimme": "die eigene Stimme, -n",
  // #19
  "die Bewerbung": "die Bewerbung, -en",
  "der Vertrag": "der Vertrag, ¨e",
  "der Vertragspartner": "der Vertragspartner, -",
  "die Zusammenarbeit": "die Zusammenarbeit (nur Sg.)",
  "der Auftrag": "der Auftrag, ¨e",
  "die Frist": "die Frist, -en",
  "die Besprechung": "die Besprechung, -en",
  "der Fortschritt": "der Fortschritt, -e",
  "die Erfahrung": "die Erfahrung, -en",
  "die Teilnahme": "die Teilnahme (an + Dat)",
  "die Rechnung": "die Rechnung, -en",
  "die Überweisung": "die Überweisung, -en",
  "die Bestellung": "die Bestellung, -en",
  "die Rückerstattung ": "die Rückerstattung, -en",
  "die Versicherung": "die Versicherung, -en",
  "der Kunde": "der Kunde, -n",
  "die Meinung": "die Meinung, -en",
  "der Vorteil": "der Vorteil, -e",
  "der Nachteil": "der Nachteil, -e",
  "die Möglichkeit": "die Möglichkeit, -en",
  "die Ursache": "die Ursache, -n",
  "der Grund": "der Grund, ¨e",
  "die Lösung": "die Lösung, -en",
  "die Absicht": "die Absicht, -en",
  "der Hinweis": "der Hinweis, -e",
  "die Empfehlung": "die Empfehlung, -en",
  "das Ereignis": "das Ereignis, -se",
  "die Verbindung": "die Verbindung, -en",
  "das Vertrauen": "das Vertrauen (nur Sg.)",
  "die Gewohnheit": "die Gewohnheit, -en",
  "die Entscheidung": "die Entscheidung, -en",
  "die Verantwortung": "die Verantwortung, -en",
  "die Unterstützung": "die Unterstützung (nur Sg.)",
  "der Eindruck": "der Eindruck, ¨e",
  "die Stimmung": "die Stimmung, -en",
  "die Prüfung": "die Prüfung, -en",
  "die Aufgabe": "die Aufgabe, -n",
  "die Strategie": "die Strategie, -n",
  "das Schlüsselwort": "das Schlüsselwort, ¨er",
  "die Aussage": "die Aussage, -n",
  "der Textabschnitt": "der Textabschnitt, -e",
  "die Zusammenfassung": "die Zusammenfassung, -en",
  "der Zusammenhang": "der Zusammenhang, ¨e",
  "das Beispiel": "das Beispiel, -e",
  "der Vergleich": "der Vergleich, -e",
  // #20
  "sich kümmern (um)": "sich kümmern (um + Akk)",
  "erinnern (an)": "erinnern (an + Akk)",
  "sich erinnern (an)": "sich erinnern (an + Akk)",
  // #25
  "die Wohngemeinschaft (WG)": "die Wohngemeinschaft (WG), -en",
  "die Kindererziehung": "die Kindererziehung (nur Sg.)",
  "die Hausarbeit": "die Hausarbeit, -en",
  "die Lebensform": "die Lebensform, -en",
  "die Generation": "die Generation, -en",
  // #26
  "das Glück": "das Glück (nur Sg.)",
  "der Erfolg": "der Erfolg, -e",
  "das Lebensziel": "das Lebensziel, -e",
  "träumen von": "träumen von + Dat",
  "abhängen von": "abhängen von + Dat",
  // #27
  "das Ehrenamt": "das Ehrenamt, ¨er",
  "sich engagieren für": "sich engagieren für + Akk",
  "der Umweltschutz": "der Umweltschutz (nur Sg.)",
  "die Gesellschaft": "die Gesellschaft, -en",
  "teilnehmen an": "teilnehmen an + Dat",
  "die Spende": "die Spende, -n",
  // #28
  "das Recht": "das Recht, -e",
  "die Pflicht": "die Pflicht, -en",
  "die Wahlen": "die Wahlen (Pl.)",
  "der Bürger": "der Bürger, -",
  "das Gesetz": "das Gesetz, -e",
  "die Regierung": "die Regierung, -en",
  // #29
  "der Leitpunkt": "der Leitpunkt, -e",
  "die Note": "die Note, -n",
  // #30
  "die Sprachbausteine": "die Sprachbausteine (Pl.)",
  "der Ausdruck": "der Ausdruck, ¨e",
  "die Kontaktaufnahme": "die Kontaktaufnahme (nur Sg.)",
  "die Lücke": "die Lücke, -n",
  // #31
  "das Ladegerät": "das Ladegerät, -e",
  "der Anschluss": "der Anschluss, ¨e",
  // #32
  "die Höflichkeit": "die Höflichkeit (nur Sg.)",
  "die Vertrautheit": "die Vertrautheit (nur Sg.)",
  "die Anrede": "die Anrede, -n",
  "der Ton": "der Ton, ¨e",
  // #33
  "der Refrain": "der Refrain, -s",
  "die Melodie": "die Melodie, -n",
  "der Text / der Liedtext": "der Text / der Liedtext, -e",
  "der Rhythmus": "der Rhythmus, Rhythmen",
  "die Strophe": "die Strophe, -n",
};

const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-2").single();
const { data: lessons } = await sb.from("lessons").select("id, order_index, title, sections").eq("course_id", course.id).order("order_index");

let grand = 0;
for (const l of lessons) {
  const sections = JSON.parse(JSON.stringify(l.sections || []));
  let n = 0;
  for (const s of sections) {
    if (s.type === "vocabulary" && Array.isArray(s.rows)) {
      for (const row of s.rows) {
        if (MAP[row[0]]) { row[0] = MAP[row[0]]; n++; }
      }
    }
  }
  if (!n) continue;
  grand += n;
  console.log(`#${l.order_index} ${l.title}: ${n}`);
  if (APPLY) {
    const { error } = await sb.from("lessons").update({ sections }).eq("id", l.id);
    if (error) console.log("   ✗ " + error.message);
  }
}
console.log(`\nUkupno izmena: ${grand}`);
if (!APPLY) console.log("Dry-run — pokreni sa --apply za upis.");
