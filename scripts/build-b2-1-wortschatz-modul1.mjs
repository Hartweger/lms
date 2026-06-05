// B2.1 — Wortschatz (Lernwortschatz iz Vielfalt B2.1, Glossar) za MODUL 1: L1, L2, L3.
// Dodaje vocabulary sekciju u postojeće lekcije (idempotentno — uklanja staru vocabulary pa doda novu,
// ne dira video/tekst/audio/quizlet). Dry-run default; --apply za upis.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) {
  const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const COURSE_SLUG = "nemacki-b2-1";

// [naslov lekcije u bazi, rows: [nemački, srpski]]
const MODUL1 = [
  ["Das Leben neu gestalten – Vielfalt B2.1", [
    ["das Unternehmen, –", "preduzeće, firma"],
    ["großartig", "sjajan, izvanredan"],
    ["hervorragend", "izvrstan, vrhunski"],
    ["bedenklich", "zabrinjavajuć, sporan"],
    ["halten für + Akk.", "smatrati (nečim)"],
    ["die Veränderung, -en", "promena"],
    ["wagen + Akk.", "usuditi se, rizikovati"],
    ["gestalten", "oblikovati, urediti"],
    ["schwer|fallen", "biti teško (nekome)"],
    ["vertraut", "poznat, prisan"],
    ["eine neue Richtung ein|schlagen", "krenuti u novom pravcu"],
    ["der Grund, ̈-e für + Akk.", "razlog (za)"],
    ["vielfältig", "raznovrstan, mnogostruk"],
    ["die Angst vor + Dat.", "strah (od)"],
    ["der Misserfolg, -e", "neuspeh"],
    ["hinterfragen", "preispitivati"],
    ["der Mut (nur Sg.)", "hrabrost"],
    ["all seinen Mut zusammen|nehmen", "skupiti svu hrabrost"],
    ["der Lebensunterhalt (nur Sg.)", "sredstva za život, izdržavanje"],
    ["sich seinen Lebensunterhalt verdienen", "zarađivati za život"],
    ["der Unternehmensberater, – / die -beraterin, -nen", "poslovni savetnik / savetnica"],
    ["die Führungsposition, -en", "rukovodeća pozicija"],
    ["der Druck (nur Sg.)", "pritisak"],
    ["unter Druck stehen", "biti pod pritiskom"],
    ["überleben", "preživeti"],
    ["der Schock (nur Sg.)", "šok"],
    ["entscheidend", "presudan, odlučujući"],
    ["der Wendepunkt, -e", "prekretnica"],
    ["meditieren", "meditirati"],
    ["die Einstellung, -en zu + Dat.", "stav (prema)"],
    ["bewusst", "svestan"],
    ["sich um|stellen", "preorijentisati se, prilagoditi se"],
    ["die Großstadt, ̈-e", "velegrad"],
    ["sich sehnen nach + Dat.", "čeznuti (za)"],
    ["verwirklichen", "ostvariti"],
    ["die Begeisterung (nur Sg.) für + Akk.", "oduševljenje (za)"],
    ["die Anregung, -en", "podsticaj, predlog"],
    ["verbunden mit + Dat.", "povezan (sa)"],
    ["die Ausbildung, -en zu + Dat.", "obuka, školovanje (za)"],
    ["die Nähe (nur Sg.) zu + Dat.", "blizina"],
    ["an|kommen", "stići; ovde: biti prihvaćen"],
    ["zusammen|hängen mit + Dat.", "biti povezan (sa)"],
    ["etw. zu|geben", "priznati (nešto)"],
    ["jdn. / sich an|lügen", "lagati (nekoga / sebe)"],
    ["der Pädagoge, -n / die Pädagogin, -nen", "pedagog / pedagoškinja"],
  ]],
  ["Migration", [
    ["die Migration, -en", "migracija"],
    ["aus|wandern", "iseliti se, emigrirati"],
    ["ein|wandern", "useliti se, imigrirati"],
    ["emigrieren", "emigrirati"],
    ["der Flüchtling, -e", "izbeglica"],
    ["das Asyl (nur Sg.)", "azil"],
    ["der Schutz (nur Sg.)", "zaštita"],
    ["fliehen vor + Dat.", "bežati (od)"],
    ["zurück|kehren nach + Dat.", "vratiti se (u)"],
    ["die Heimat (nur Sg.)", "domovina, zavičaj"],
    ["die Staatsbürgerschaft, -en", "državljanstvo"],
    ["der Staatsbürger, – / die Staatsbürgerin, -nen", "državljanin / državljanka"],
    ["nach|weisen", "dokazati, potvrditi"],
    ["der Vorfahr, -en / die Vorfahrin, -nen", "predak / pretkinja"],
    ["der Nachfahre, -n / die Nachfahrin, -nen", "potomak / potomkinja"],
    ["der Urgroßvater, ̈-", "pradeda"],
    ["der Spätaussiedler, –", "kasni nemački doseljenik (iz ist. Evrope)"],
    ["der Gastarbeiter, – / die Gastarbeiterin, -nen", "gastarbajter / gastarbajterka"],
    ["der Migrationshintergrund (nur Sg.)", "migrantsko poreklo"],
    ["die Lebensbedingung, -en", "uslovi života"],
    ["das Fernweh (nur Sg.)", "čežnja za daljinama"],
    ["auf|brechen", "krenuti (na put)"],
    ["sich nieder|lassen", "nastaniti se"],
    ["sich heimisch / zu Hause fühlen", "osećati se kao kod kuće"],
    ["der / die Einheimische, -n", "meštanin, domorodac"],
    ["Kontakte knüpfen", "uspostavljati kontakte"],
    ["überwinden", "savladati, prevazići"],
    ["die Tradition, -en", "tradicija"],
    ["pflegen", "negovati"],
    ["hin- und hergerissen sein", "biti razapet (između)"],
    ["die Erfahrung, -en", "iskustvo"],
    ["der Beitrag, ̈-e", "prilog, članak"],
    ["erforschen", "istraživati"],
    ["wirtschaftlich", "privredni, ekonomski"],
    ["ehemalig", "bivši"],
    ["beherrschen", "vladati (jezikom), znati odlično"],
    ["jdm. etw. bei|bringen", "naučiti (nekoga nečemu)"],
    ["ab|brechen", "prekinuti (npr. studije)"],
    ["der Studienabschluss, ̈-e", "diploma, završetak studija"],
    ["zurück|lassen", "ostaviti (za sobom)"],
    ["in der Lage sein", "biti u stanju, moći"],
    ["heutzutage", "danas, u današnje vreme"],
    ["bei|tragen zu + Dat.", "doprineti"],
    ["die Altstadt, ̈-e", "stari grad"],
    ["der Dom, -e", "katedrala"],
    ["bummeln / schlendern", "šetati, tumarati"],
    ["die Gasse, -n", "uličica"],
    ["der Akzent, -e", "akcenat"],
    ["fehlerfrei", "bez greške"],
  ]],
  ["WIEN", [
    ["der Pianist, -en / die Pianistin, -nen", "pijanista / pijanistkinja"],
    ["der Stadtführer, – / die Stadtführerin, -nen", "gradski vodič / vodičkinja"],
    ["die Stadtführung, -en", "vođenje po gradu, tura"],
    ["begeistert von + Dat.", "oduševljen (nečim)"],
    ["die Perspektive, -n", "perspektiva, ugao gledanja"],
    ["die Denkpause, -n", "pauza za razmišljanje"],
    ["sich orientieren", "orijentisati se"],
    ["das Interesse an + Dat. / aus Interesse an", "interesovanje (za) / iz interesovanja"],
    ["eine Prüfung ab|legen", "polagati ispit"],
    ["fein", "fin, otmen"],
    ["der Studiengang, ̈-e", "studijski program"],
    ["das Studienfach, ̈-er", "studijski predmet, smer"],
    ["absolvieren", "završiti, odslušati"],
    ["ab|schließen", "završiti (studije)"],
    ["kombinieren", "kombinovati"],
    ["das Management, -s", "menadžment"],
    ["stundenlang", "satima"],
    ["dank + Gen./Dat.", "zahvaljujući"],
    ["der Instrumentenbauer, – / die -bauerin, -nen", "graditelj / graditeljka instrumenata"],
    ["der Nationalpark, -s", "nacionalni park"],
    ["vertraut sein mit + Dat.", "biti upoznat (sa)"],
    ["hetzen", "juriti, žuriti"],
    ["ein|schlafen", "zaspati"],
    ["das Geräusch, -e", "zvuk, šum"],
    ["die Müdigkeit (nur Sg.)", "umor"],
    ["das Stammlokal, -e", "omiljeni lokal/kafić"],
    ["der Irrtum, ̈-er", "zabluda, greška"],
    ["deutschsprachig", "nemačkog govornog područja"],
    ["aufgrund + Gen.", "na osnovu, zbog"],
    ["das Verständnis (nur Sg.) für + Akk.", "razumevanje (za)"],
    ["das Gespräch, -e mit + Dat.", "razgovor (sa)"],
    ["der Hintergrund, ̈-e", "pozadina"],
    ["die Sicht auf + Akk. / aus meiner Sicht", "pogled (na) / iz mog ugla"],
    ["die Architektur (nur Sg.)", "arhitektura"],
    ["die Säule, -n", "stub"],
    ["flanieren", "šetati, flanirati"],
    ["nachvollziehbar", "razumljiv, shvatljiv"],
    ["ehrlich", "iskren"],
    ["trödeln", "oklevati, gubiti vreme"],
    ["problematisch", "problematičan"],
  ]],
];

const { data: course } = await sb.from("courses").select("id").eq("slug", COURSE_SLUG).single();
if (!course) { console.error(`Kurs ${COURSE_SLUG} ne postoji`); process.exit(1); }

for (const [title, rows] of MODUL1) {
  const { data: lesson } = await sb.from("lessons").select("id,sections").eq("course_id", course.id).eq("title", title).maybeSingle();
  if (!lesson) { console.error(`✗ Lekcija "${title}" ne postoji — preskačem`); continue; }
  const existing = Array.isArray(lesson.sections) ? lesson.sections : [];
  const hadVocab = existing.some((s) => s.type === "vocabulary");
  console.log(`${hadVocab ? "~" : "+"} "${title}": ${rows.length} reči ${hadVocab ? "(zamena postojeće vocabulary)" : "(dodavanje)"}`);
  if (!APPLY) continue;
  const next = existing.filter((s) => s.type !== "vocabulary");
  next.push({ type: "vocabulary", rows });
  const { error } = await sb.from("lessons").update({ sections: next }).eq("id", lesson.id);
  if (error) throw error;
}
console.log(APPLY ? "✓ Gotovo (Modul 1 Wortschatz)" : "[DRY] Pokreni sa --apply za upis.");
