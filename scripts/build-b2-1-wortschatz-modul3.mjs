// B2.1 — Wortschatz MODUL 3: L7 Sport, L8 Ernährung, L9 Tagesrhythmus.
// L7 → postojeća "Extrem unter Kontrolle – Lena auf Expedition".
// L8/L9 → NEMA lekcije → kreira nove (badge + vocabulary) na kraju kursa.
// Idempotentno. Dry-run default; --apply.
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

// [naslov, rows, createIfMissing(badge modul)]
const MODUL3 = [
  ["Extrem unter Kontrolle – Lena auf Expedition", [
    ["binnen", "u roku od"],
    ["hinauf|laufen / hinunter|laufen", "trčati gore / dole"],
    ["hinauf|gehen / hinunter|gehen", "ići gore / dole"],
    ["die Rolltreppe, -n", "pokretne stepenice"],
    ["um|gestalten", "preurediti, preoblikovati"],
    ["zusammen|rechnen", "sabrati, izračunati"],
    ["der Sensor, -en", "senzor"],
    ["der Ton, ̈-e", "ton, zvuk"],
    ["riskieren", "rizikovati"],
    ["das Risiko, die Risiken", "rizik"],
    ["ein Risiko ein|gehen", "preuzeti rizik"],
    ["riskant", "rizičan"],
    ["der Versuch, -e", "pokušaj"],
    ["den Versuch unternehmen", "učiniti pokušaj"],
    ["aus|probieren", "isprobati"],
    ["die Grenze, -n", "granica"],
    ["an seine Grenzen stoßen", "doći do svojih granica"],
    ["stoßen an + Akk.", "udariti u, naići na"],
    ["durch|halten", "izdržati"],
    ["die Anstrengung, -en", "napor"],
    ["auf sich nehmen", "preuzeti (na sebe)"],
    ["überwinden", "savladati, prevazići"],
    ["der (innere) Schweinehund", "unutrašnja lenjost (slabost volje)"],
    ["die Aufmerksamkeit (nur Sg.)", "pažnja"],
    ["neugierig auf + Akk.", "radoznao (na)"],
    ["jdn. / sich trösten mit + Dat.", "tešiti (nekoga / sebe)"],
    ["balancieren", "balansirati"],
    ["die Achterbahn, -en", "rolerkoster"],
    ["das Freiklettern (nur Sg.)", "slobodno penjanje"],
    ["das Tiefseetauchen (nur Sg.)", "duboko ronjenje"],
    ["das Eisbaden (nur Sg.)", "kupanje u ledenoj vodi"],
    ["das Fallschirmspringen (nur Sg.)", "skakanje padobranom"],
    ["reizen", "privlačiti, mamiti"],
    ["sorgenfrei", "bezbrižan"],
    ["der Umgang (nur Sg.) mit + Dat.", "ophođenje (sa)"],
    ["prinzipiell", "principijelno, načelno"],
    ["sich aus|kennen mit + Dat.", "razumeti se (u)"],
    ["in der Tat", "zaista, doista"],
    ["sich vor|nehmen", "naumiti, odlučiti"],
    ["der Laufschuh, -e", "patika za trčanje"],
    ["die Kondition, -en", "kondicija"],
    ["die Ausdauer (nur Sg.)", "izdržljivost"],
    ["der Kreislauf (nur Sg.)", "krvotok"],
    ["der Fettabbau (nur Sg.)", "razgradnja masti"],
    ["stärken", "jačati"],
    ["los|legen (ugs.)", "krenuti, dati se na posao"],
  ], null],
  ["Alles unter Kontrolle? – Ernährung", [
    ["naiv", "naivan"],
    ["die Selbstoptimierung (nur Sg.)", "samooptimizacija"],
    ["optimal", "optimalan"],
    ["die Leistung, -en", "učinak, postignuće"],
    ["Leistung bringen", "postizati učinak"],
    ["leistungsfähig", "sposoban, produktivan"],
    ["die Hauptsache, -n", "glavna stvar"],
    ["körperlich", "telesni"],
    ["etw. / jdn. unter Kontrolle haben", "imati pod kontrolom"],
    ["etw. im Griff haben", "vladati nečim, imati pod kontrolom"],
    ["der Griff, -e", "hvat"],
    ["verständnislos", "bez razumevanja"],
    ["das Sprichwort, ̈-er", "poslovica"],
    ["sachlich", "objektivan, stvaran"],
    ["widmen", "posvetiti"],
    ["hin und wieder", "s vremena na vreme"],
    ["die Auskunft, ̈-e über + Akk.", "informacija (o)"],
    ["die Nahrung (nur Sg.)", "hrana"],
    ["die Nahrungsaufnahme (nur Sg.)", "unos hrane"],
    ["die Kalorie, -n", "kalorija"],
    ["kalorienarm", "niskokaloričan"],
    ["der Nährstoff, -e", "hranljiva materija"],
    ["der Nährwert, -e", "hranljiva vrednost"],
    ["der Blutzucker (nur Sg.)", "šećer u krvi"],
    ["senken", "smanjiti, sniziti"],
    ["fettarm / fettreich", "nemastan / mastan"],
    ["vitaminreich", "bogat vitaminima"],
    ["koffeinfrei", "bez kofeina"],
    ["das Calcium (nur Sg.)", "kalcijum"],
    ["der Lachs, -e", "losos"],
    ["das Essverhalten (nur Sg.)", "navike u ishrani"],
    ["das Bauchgefühl, -e", "intuicija, osećaj"],
    ["ausgleichend", "uravnotežujući"],
    ["das Hoch, -s / das Tief, -s", "uspon / pad (najviša/najniža tačka)"],
    ["kurz und gut", "ukratko, jednom rečju"],
    ["schlicht und einfach", "sasvim jednostavno"],
    ["fix und fertig", "potpuno iscrpljen"],
    ["grinsen", "ceriti se"],
    ["gewiss", "izvestan, siguran"],
    ["die Kolumne, -n", "kolumna"],
    ["das Hörbuch, ̈-er", "audio-knjiga"],
    ["sich an|hören", "preslušati"],
    ["die Sauna, -s / die Saunen", "sauna"],
  ], "Modul 3 — Was können Sie gut?"],
  ["So tickt unsere innere Uhr! – Tagesrhythmus", [
    ["der Rhythmus, die Rhythmen", "ritam"],
    ["der Tagesrhythmus, die Tagesrhythmen", "dnevni ritam"],
    ["die innere Uhr", "unutrašnji (biološki) sat"],
    ["der Frühaufsteher, – / die Frühaufsteherin, -nen", "ranoranilac / ranoranilka"],
    ["der Langschläfer, – / die Langschläferin, -nen", "spavalica (ko dugo spava)"],
    ["der Normaltyp, -en", "uobičajeni (normalni) tip"],
    ["bestimmen", "određivati"],
    ["genetisch", "genetski"],
    ["das Gen, -e", "gen"],
    ["das Gehirn, -e", "mozak"],
    ["das Tageslicht (nur Sg.)", "dnevno svetlo"],
    ["die Zeitverschiebung, -en", "vremenska razlika (jet lag)"],
    ["das Timing, -s", "tajming, vremensko usklađivanje"],
    ["geistig", "mentalni, umni"],
    ["anspruchsvoll", "zahtevan"],
    ["das Sachbuch, ̈-er", "stručna knjiga"],
    ["das Referat, -e", "referat"],
    ["der Vortrag, ̈-e", "predavanje, izlaganje"],
    ["der Ausdauersport (nur Sg.)", "sport izdržljivosti"],
    ["erholsam", "okrepljujući"],
    ["das Flugpersonal (nur Sg.)", "avio-osoblje"],
    ["versetzt", "pomeren"],
    ["auf|nehmen", "primati, upijati"],
    ["gesellig", "društven"],
    ["signalisieren", "signalizirati, davati znak"],
    ["langfristig", "dugoročan"],
    ["rein|hören", "preslušati (uzgred)"],
    ["weiter|schlafen", "nastaviti da spava"],
    ["rötlich", "crvenkast"],
    ["pharmazeutisch", "farmaceutski"],
    ["erstaunlich", "zapanjujući"],
    ["unglaubwürdig", "neuverljiv"],
    ["ab|weichen von + Dat.", "odstupati (od)"],
    ["das Merkmal, -e", "obeležje, karakteristika"],
    ["sich aus|zeichnen durch + Akk.", "odlikovati se (čime)"],
    ["angeblich", "navodno"],
    ["unbestritten", "neosporan"],
    ["einmalig", "jedinstven"],
    ["der Nobelpreis, -e", "Nobelova nagrada"],
  ], "Modul 3 — Was können Sie gut?"],
];

const { data: course } = await sb.from("courses").select("id").eq("slug", COURSE_SLUG).single();
if (!course) { console.error(`Kurs ${COURSE_SLUG} ne postoji`); process.exit(1); }

async function maxOrder() {
  const { data } = await sb.from("lessons").select("order_index").eq("course_id", course.id).order("order_index", { ascending: false }).limit(1).single();
  return (data?.order_index ?? -1);
}

for (const [title, rows, createBadge] of MODUL3) {
  let { data: lesson } = await sb.from("lessons").select("id,sections").eq("course_id", course.id).eq("title", title).maybeSingle();
  if (!lesson && !createBadge) { console.error(`✗ "${title}" ne postoji i nije za kreiranje — preskačem`); continue; }
  if (!lesson) {
    console.log(`+ NOVA lekcija "${title}" (${rows.length} reči)`);
    if (APPLY) {
      const order = (await maxOrder()) + 1;
      const { data: created, error } = await sb.from("lessons").insert({
        course_id: course.id, title, order_index: order, lesson_type: "text",
        sections: [{ type: "badge", module: createBadge }, { type: "vocabulary", rows }],
      }).select("id,sections").single();
      if (error) throw error;
      lesson = created;
    }
    continue;
  }
  const existing = Array.isArray(lesson.sections) ? lesson.sections : [];
  const hadVocab = existing.some((s) => s.type === "vocabulary");
  console.log(`${hadVocab ? "~" : "+"} "${title}": ${rows.length} reči ${hadVocab ? "(zamena)" : "(dodavanje)"}`);
  if (!APPLY) continue;
  const next = existing.filter((s) => s.type !== "vocabulary");
  next.push({ type: "vocabulary", rows });
  const { error } = await sb.from("lessons").update({ sections: next }).eq("id", lesson.id);
  if (error) throw error;
}
console.log(APPLY ? "✓ Gotovo (Modul 3 Wortschatz)" : "[DRY] Pokreni sa --apply za upis.");
