// B2.1 — Wortschatz MODUL 2: L4 Familie, L5 Soziale Medien, L6 Teamarbeit.
// Idempotentno dodaje vocabulary sekciju (ne dira ostali sadržaj). Dry-run default; --apply.
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

const MODUL2 = [
  ["Erwartungen in der Familie B2.1", [
    ["in die Fußstapfen treten", "ići stopama (nekoga)"],
    ["das Vorbild, -er", "uzor"],
    ["die Erwartung, -en an + Akk.", "očekivanje (od)"],
    ["jdn. unter Druck setzen", "vršiti pritisak na nekoga"],
    ["die Entscheidung, -en", "odluka"],
    ["entscheiden über + Akk.", "odlučivati (o)"],
    ["der Auslandsaufenthalt, -e", "boravak u inostranstvu"],
    ["die Geldnot, ̈-e", "novčana oskudica"],
    ["der Zeitmangel (nur Sg.)", "nedostatak vremena"],
    ["auf|wachsen", "odrastati"],
    ["die Aufregung, -en", "uzbuđenje, nervoza"],
    ["sich aus|wirken auf + Akk.", "uticati (na)"],
    ["reagieren auf + Akk.", "reagovati (na)"],
    ["das Wiedersehen, –", "ponovni susret"],
    ["die Konkurrenz (nur Sg.)", "konkurencija"],
    ["in Konkurrenz stehen", "biti u konkurenciji"],
    ["der Zusammenhalt (nur Sg.)", "sloga, povezanost"],
    ["der Stolz (nur Sg.)", "ponos"],
    ["es besser haben", "imati bolje, bolje živeti"],
    ["der Respekt (nur Sg.)", "poštovanje"],
    ["schulden", "dugovati"],
    ["die Fürsorge (nur Sg.)", "briga, staranje"],
    ["die Macht, ̈-e", "moć"],
    ["übertreiben", "preterivati"],
    ["die Vorschrift, -en", "propis"],
    ["der Kabarettist, -en / die Kabarettistin, -nen", "kabaretista / kabaretistkinja"],
    ["die Geborgenheit (nur Sg.)", "sigurnost, zaštićenost"],
    ["der Steuerberater, – / die Steuerberaterin, -nen", "poreski savetnik / savetnica"],
    ["der Abstand, ̈-e", "razmak, distanca"],
    ["die Abhängigkeit, -en", "zavisnost"],
    ["hin|gehören", "pripadati (negde)"],
    ["aus|üben", "obavljati (zanimanje)"],
  ]],
  ["Das eigene Profil schärfen", [
    ["beauftragen", "angažovati, dati nalog"],
    ["der Neukunde, -n / die Neukundin, -nen", "novi klijent / klijentkinja"],
    ["dynamisch", "dinamičan"],
    ["der Videokanal, ̈-e", "video kanal"],
    ["seriös", "ozbiljan, kredibilan"],
    ["Kontakt auf|nehmen", "stupiti u kontakt"],
    ["der Einstieg, -e", "uvod, početak"],
    ["bieder", "staromodan, malograđanski"],
    ["weg|klicken", "kliknuti dalje, zatvoriti"],
    ["unkonventionell", "nekonvencionalan"],
    ["das Intro, -s", "intro, uvod"],
    ["äußerst", "izuzetno"],
    ["rüber|kommen (ugs.)", "ostaviti utisak, „proći“"],
    ["beleuchtet", "osvetljen, obrađen"],
    ["die Eigeninitiative, -n", "sopstvena inicijativa"],
    ["die Miniaturansicht, -en", "sličica (thumbnail)"],
    ["sich vernetzen mit + Dat.", "umrežiti se (sa)"],
    ["profitieren von + Dat.", "imati korist (od)"],
    ["bedeutsam", "značajan"],
    ["wesentlich", "bitan, suštinski"],
    ["der Aspekt, -e", "aspekt"],
    ["gegenseitig", "uzajaman"],
    ["verlinken", "povezati linkom"],
    ["die Zufriedenheit (nur Sg.)", "zadovoljstvo"],
    ["posten", "objaviti (post)"],
    ["kommentieren", "komentarisati"],
    ["der Berufseinstieg, -e", "ulazak u profesiju"],
    ["empfehlenswert", "preporučljiv"],
    ["das Image, -s", "imidž"],
    ["die Präsenz (nur Sg.)", "(online) prisustvo"],
    ["der Abonnent, -en / die Abonnentin, -nen", "pretplatnik / pretplatnica"],
    ["das Design, -s", "dizajn"],
    ["professionell", "profesionalan"],
    ["der Beitrag, ̈-e", "objava, prilog"],
    ["die Zwischenüberschrift, -en", "međunaslov"],
    ["die Schriftart, -en", "font, vrsta pisma"],
    ["die Lesedauer (nur Sg.)", "vreme čitanja"],
    ["verspielt", "razigran (dizajn)"],
    ["ein|gehen auf + Akk.", "osvrnuti se (na)"],
    ["die Überzeugung, -en", "uverenje"],
    ["ausführlich", "detaljan, opširan"],
    ["gezielt", "ciljan"],
  ]],
  ["Berufliche Kompetenzen", [
    ["die Kompetenz, -en", "kompetencija"],
    ["der / die Vorgesetzte, -n", "nadređeni / nadređena"],
    ["der Führungsstil, -e", "stil rukovođenja"],
    ["autoritär", "autoritaran"],
    ["agil", "agilan"],
    ["die Hierarchie, -n", "hijerarhija"],
    ["flach (Hierarchie)", "ravna (hijerarhija)"],
    ["die Anforderung, -en", "zahtev"],
    ["sich an|passen an + Akk.", "prilagoditi se (čemu)"],
    ["die Flexibilität (nur Sg.)", "fleksibilnost"],
    ["der Einzelkämpfer, – / die Einzelkämpferin, -nen", "individualac, „vuk samotnjak“"],
    ["überraschend", "iznenađujući"],
    ["ab|geben", "predati, prepustiti"],
    ["programmieren", "programirati"],
    ["ein|bringen", "uneti, doprineti"],
    ["die Wertschätzung, -en", "uvažavanje, poštovanje"],
    ["entgegen|bringen", "ukazivati (poštovanje)"],
    ["zwanglos", "opušten, neformalan"],
    ["der Arbeitnehmer, – / die Arbeitnehmerin, -nen", "zaposleni / zaposlena"],
    ["der Auftrag, ̈-e", "nalog, zadatak"],
    ["die Verantwortung (nur Sg.)", "odgovornost"],
    ["das Stichwort, ̈-er", "ključna reč"],
    ["die Selbstverwirklichung (nur Sg.)", "samoostvarenje"],
    ["offen für + Akk.", "otvoren (za)"],
    ["die Teamarbeit (nur Sg.)", "timski rad"],
    ["das Argument, -e", "argument"],
    ["aus|reden", "izgovoriti do kraja"],
    ["hinzu|fügen", "dodati"],
    ["plädieren für + Akk.", "zalagati se (za)"],
    ["bestehen in + Dat.", "sastojati se (u)"],
    ["durchaus", "svakako, potpuno"],
    ["meines Erachtens", "po mom mišljenju"],
    ["das Fazit, -e", "zaključak, rezime"],
    ["ein Fazit ziehen", "izvući zaključak"],
    ["zusammenfassend", "sažeto, ukratko"],
    ["lauten", "glasiti"],
    ["die Ausrede, -n", "izgovor"],
  ]],
];

const { data: course } = await sb.from("courses").select("id").eq("slug", COURSE_SLUG).single();
if (!course) { console.error(`Kurs ${COURSE_SLUG} ne postoji`); process.exit(1); }

for (const [title, rows] of MODUL2) {
  const { data: lesson } = await sb.from("lessons").select("id,sections").eq("course_id", course.id).eq("title", title).maybeSingle();
  if (!lesson) { console.error(`✗ Lekcija "${title}" ne postoji — preskačem`); continue; }
  const existing = Array.isArray(lesson.sections) ? lesson.sections : [];
  const hadVocab = existing.some((s) => s.type === "vocabulary");
  console.log(`${hadVocab ? "~" : "+"} "${title}": ${rows.length} reči ${hadVocab ? "(zamena)" : "(dodavanje)"}`);
  if (!APPLY) continue;
  const next = existing.filter((s) => s.type !== "vocabulary");
  next.push({ type: "vocabulary", rows });
  const { error } = await sb.from("lessons").update({ sections: next }).eq("id", lesson.id);
  if (error) throw error;
}
console.log(APPLY ? "✓ Gotovo (Modul 2 Wortschatz)" : "[DRY] Pokreni sa --apply za upis.");
