/**
 * Import B1.1 translation exercises
 * Run: npx tsx scripts/import-b11-translations.ts
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const [key, ...valueParts] = line.split("=");
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join("=").trim();
  }
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SENTENCES: Record<string, { sr: string; de: string }[]> = {
  "Rotkäppchen und das Präteritum": [
    { sr: "Bilo jednom jedno devojče.", de: "Es war einmal ein Mädchen." },
    { sr: "Ona je živela sa svojom majkom.", de: "Sie lebte mit ihrer Mutter." },
    { sr: "Vuk je stajao ispred kuće.", de: "Der Wolf stand vor dem Haus." },
    { sr: "Devojčica je donela kolač baki.", de: "Das Mädchen brachte der Großmutter einen Kuchen." },
  ],
  "Als oder wenn": [
    { sr: "Kada sam bio mali, živeo sam u selu.", de: "Als ich klein war, habe ich auf dem Dorf gelebt." },
    { sr: "Svaki put kada pada kiša, ostajem kod kuće.", de: "Immer wenn es regnet, bleibe ich zu Hause." },
    { sr: "Kada sam prvi put došao u Nemačku, nisam govorio nemački.", de: "Als ich zum ersten Mal nach Deutschland gekommen bin, habe ich kein Deutsch gesprochen." },
    { sr: "Kada imam vremena, čitam knjige.", de: "Wenn ich Zeit habe, lese ich Bücher." },
  ],
  "Glück": [
    { sr: "Šta te čini srećnim?", de: "Was macht dich glücklich?" },
    { sr: "Novac ne čini ljude srećnim.", de: "Geld macht die Menschen nicht glücklich." },
  ],
  "Schreiben B1 — E-Mail an einen Freund": [
    { sr: "Dragi Markuse, dugo se nismo čuli.", de: "Lieber Markus, wir haben uns lange nicht gehört." },
    { sr: "Kako si? Šta ima novo?", de: "Wie geht es dir? Was gibt es Neues?" },
    { sr: "Rado bih te posetio sledeći mesec.", de: "Ich würde dich gern nächsten Monat besuchen." },
    { sr: "Javi mi kada ti odgovara.", de: "Sag mir, wann es dir passt." },
  ],
  "Relativne rečenice": [
    { sr: "To je čovek koji radi u bolnici.", de: "Das ist der Mann, der im Krankenhaus arbeitet." },
    { sr: "Ovo je knjiga koju sam ti preporučio.", de: "Das ist das Buch, das ich dir empfohlen habe." },
    { sr: "Poznajem ženu koja govori pet jezika.", de: "Ich kenne eine Frau, die fünf Sprachen spricht." },
    { sr: "Grad u kom živim je veoma lep.", de: "Die Stadt, in der ich wohne, ist sehr schön." },
  ],
  "Obwohl vs. weil": [
    { sr: "Idem na posao iako sam bolestan.", de: "Ich gehe zur Arbeit, obwohl ich krank bin." },
    { sr: "Ostajem kod kuće jer pada kiša.", de: "Ich bleibe zu Hause, weil es regnet." },
    { sr: "Iako je umoran, ide na trening.", de: "Obwohl er müde ist, geht er zum Training." },
    { sr: "Uči nemački jer želi da radi u Nemačkoj.", de: "Er lernt Deutsch, weil er in Deutschland arbeiten möchte." },
  ],
  "Filme und Serien": [
    { sr: "Koji je tvoj omiljeni film?", de: "Was ist dein Lieblingsfilm?" },
    { sr: "Više volim komedije nego trilere.", de: "Ich mag Komödien lieber als Thriller." },
    { sr: "Sinoć smo gledali jednu nemačku seriju.", de: "Gestern Abend haben wir eine deutsche Serie geschaut." },
    { sr: "Film je trajao dva sata.", de: "Der Film hat zwei Stunden gedauert." },
  ],
  "Genitiv": [
    { sr: "To je auto mog oca.", de: "Das ist das Auto meines Vaters." },
    { sr: "Boja ove kuće je lepa.", de: "Die Farbe dieses Hauses ist schön." },
    { sr: "Rad naših kolega je odličan.", de: "Die Arbeit unserer Kollegen ist ausgezeichnet." },
    { sr: "Na kraju dana sam uvek umoran.", de: "Am Ende des Tages bin ich immer müde." },
  ],
  "Pasiv prezenta sa modalnim glagolima": [
    { sr: "Pacijent mora da bude pregledan.", de: "Der Patient muss untersucht werden." },
    { sr: "Ova forma mora da bude popunjena.", de: "Dieses Formular muss ausgefüllt werden." },
    { sr: "Auto mora da bude popravljeno.", de: "Das Auto muss repariert werden." },
    { sr: "Problem može da bude rešen.", de: "Das Problem kann gelöst werden." },
  ],
  "Profis gesucht: Krankenpfleger": [
    { sr: "U Nemačkoj nedostaju medicinske sestre.", de: "In Deutschland fehlen Krankenpfleger." },
    { sr: "Posao u bolnici je veoma naporan.", de: "Die Arbeit im Krankenhaus ist sehr anstrengend." },
    { sr: "On radi u noćnoj smeni.", de: "Er arbeitet in der Nachtschicht." },
    { sr: "Za ovaj posao treba mnogo strpljenja.", de: "Für diesen Beruf braucht man viel Geduld." },
  ],
  "Blutgruppen — wichtige Entdeckung": [
    { sr: "Postoje četiri krvne grupe.", de: "Es gibt vier Blutgruppen." },
    { sr: "Ovo otkriće je spasilo mnogo života.", de: "Diese Entdeckung hat viele Leben gerettet." },
    { sr: "Naučnik je dobio Nobelovu nagradu.", de: "Der Wissenschaftler hat den Nobelpreis bekommen." },
  ],
  "Konjunktiv II — Irreale Wünsche": [
    { sr: "Da imam više novca, kupio bih kuću.", de: "Wenn ich mehr Geld hätte, würde ich ein Haus kaufen." },
    { sr: "Da sam na tvom mestu, prihvatio bih posao.", de: "Wenn ich an deiner Stelle wäre, würde ich den Job annehmen." },
    { sr: "Voleo bih da mogu da letim.", de: "Ich wünschte, ich könnte fliegen." },
    { sr: "Da govorim bolji nemački, našao bih posao.", de: "Wenn ich besser Deutsch sprechen würde, würde ich einen Job finden." },
  ],
  "Sprechblockaden? Nur Mut!": [
    { sr: "Ne treba da se plašiš grešaka.", de: "Du musst keine Angst vor Fehlern haben." },
    { sr: "Greške su deo učenja.", de: "Fehler gehören zum Lernen dazu." },
    { sr: "Što više vežbaš, to bolje govoriš.", de: "Je mehr du übst, desto besser sprichst du." },
    { sr: "Samo hrabro, ti to možeš!", de: "Nur Mut, du schaffst das!" },
  ],
  "Wortschatz B1 — Prüfungsvorbereitung": [
    { sr: "Moram da proširim vokabular.", de: "Ich muss meinen Wortschatz erweitern." },
    { sr: "Učim svaki dan deset novih reči.", de: "Ich lerne jeden Tag zehn neue Wörter." },
    { sr: "Kartice za učenje mi mnogo pomažu.", de: "Lernkarten helfen mir sehr." },
    { sr: "Na ispitu moram da razumem tekst.", de: "In der Prüfung muss ich den Text verstehen." },
  ],
  "Infinitiv mit zu": [
    { sr: "Planiram da učim nemački svaki dan.", de: "Ich plane, jeden Tag Deutsch zu lernen." },
    { sr: "Teško je naći stan u Berlinu.", de: "Es ist schwer, eine Wohnung in Berlin zu finden." },
    { sr: "Imam nameru da se prijavim za posao.", de: "Ich habe vor, mich für den Job zu bewerben." },
    { sr: "Važno je redovno vežbati.", de: "Es ist wichtig, regelmäßig zu üben." },
  ],
  "Jobsuche": [
    { sr: "Tražim posao kao inženjer.", de: "Ich suche eine Stelle als Ingenieur." },
    { sr: "Poslao sam dvadeset prijava.", de: "Ich habe zwanzig Bewerbungen geschickt." },
    { sr: "Sutra imam razgovor za posao.", de: "Morgen habe ich ein Vorstellungsgespräch." },
    { sr: "Koje su vaše jake strane?", de: "Was sind Ihre Stärken?" },
  ],
  "Geschlechtergerechte Sprache": [
    { sr: "U nemačkom se sve više koristi rodno neutralan jezik.", de: "Im Deutschen wird immer mehr geschlechtergerechte Sprache verwendet." },
    { sr: "Jezik se stalno menja.", de: "Die Sprache verändert sich ständig." },
  ],
  "Sprechen Prüfung B1 — Ein Thema präsentieren": [
    { sr: "Najpre ću govoriti o prednostima.", de: "Zuerst werde ich über die Vorteile sprechen." },
    { sr: "Po mom mišljenju, jezici otvaraju vrata.", de: "Meiner Meinung nach öffnen Sprachen Türen." },
    { sr: "Da li imate pitanja?", de: "Haben Sie Fragen?" },
  ],
  "Finalsätze (um+zu vs. damit)": [
    { sr: "Učim nemački da bih našao posao.", de: "Ich lerne Deutsch, um einen Job zu finden." },
    { sr: "Dala mu je novac da kupi hleb.", de: "Sie hat ihm Geld gegeben, damit er Brot kauft." },
    { sr: "Ustao sam rano da ne bih zakasnio.", de: "Ich bin früh aufgestanden, um nicht zu spät zu kommen." },
    { sr: "Govori glasnije da te svi čuju.", de: "Sprich lauter, damit dich alle hören." },
  ],
  "Temporale Präpositionen + es gibt / es ist": [
    { sr: "Pre tri godine sam se preselio u Nemačku.", de: "Vor drei Jahren bin ich nach Deutschland umgezogen." },
    { sr: "Tokom leta je toplo.", de: "Während des Sommers ist es warm." },
    { sr: "Posle ručka idem u šetnju.", de: "Nach dem Mittagessen gehe ich spazieren." },
    { sr: "U našem gradu ima mnogo parkova.", de: "In unserer Stadt gibt es viele Parks." },
  ],
  "Zweiteilige Konnektoren": [
    { sr: "Ne samo da govori nemački, već i francuski.", de: "Er spricht nicht nur Deutsch, sondern auch Französisch." },
    { sr: "Ili idemo u bioskop ili ostajemo kod kuće.", de: "Entweder gehen wir ins Kino oder wir bleiben zu Hause." },
    { sr: "Niti imam vremena, niti imam novca.", de: "Ich habe weder Zeit noch Geld." },
    { sr: "Kako deca tako i odrasli uče jezike.", de: "Sowohl Kinder als auch Erwachsene lernen Sprachen." },
  ],
  "Konjunktiv II der Vergangenheit": [
    { sr: "Da sam znao, došao bih ranije.", de: "Wenn ich es gewusst hätte, wäre ich früher gekommen." },
    { sr: "Da sam više učio, položio bih ispit.", de: "Wenn ich mehr gelernt hätte, hätte ich die Prüfung bestanden." },
  ],
  "Schreiben B1 — Hotel Mama": [
    { sr: "Mnogi mladi žive kod roditelja do tridesete.", de: "Viele junge Leute leben bis dreißig bei ihren Eltern." },
    { sr: "Život sa roditeljima ima prednosti i mane.", de: "Das Leben bei den Eltern hat Vor- und Nachteile." },
    { sr: "Po mom mišljenju, važno je biti samostalan.", de: "Meiner Meinung nach ist es wichtig, selbstständig zu sein." },
    { sr: "Kirija u velikim gradovima je veoma skupa.", de: "Die Miete in großen Städten ist sehr teuer." },
  ],
};

async function main() {
  const { data: course } = await sb.from("courses").select("id").eq("slug", "nemacki-b1-1").single();
  if (!course) { console.error("B1.1 not found"); process.exit(1); }

  const { data: lessons } = await sb.from("lessons")
    .select("id, title, order_index")
    .eq("course_id", course.id)
    .order("order_index");

  let totalExercises = 0;
  let totalQuestions = 0;

  for (const lesson of lessons || []) {
    const sents = SENTENCES[lesson.title];
    if (!sents) continue;

    const { data: existing } = await sb.from("exercises")
      .select("id").eq("lesson_id", lesson.id).eq("title", "Prevedi rečenice");
    if (existing && existing.length > 0) {
      for (const ex of existing) {
        await sb.from("exercise_questions").delete().eq("exercise_id", ex.id);
        await sb.from("exercise_attempts").delete().eq("exercise_id", ex.id);
      }
      await sb.from("exercises").delete().eq("lesson_id", lesson.id).eq("title", "Prevedi rečenice");
    }

    const { data: maxEx } = await sb.from("exercises")
      .select("order_index").eq("lesson_id", lesson.id)
      .order("order_index", { ascending: false }).limit(1);
    const nextOrder = (maxEx && maxEx.length > 0) ? maxEx[0].order_index + 1 : 0;

    const { data: exercise } = await sb.from("exercises").insert({
      lesson_id: lesson.id, title: "Prevedi rečenice", exercise_type: "quiz", order_index: nextOrder,
    }).select("id").single();
    if (!exercise) { console.error("Failed:", lesson.title); continue; }

    const questions = sents.map((s, i) => ({
      exercise_id: exercise.id, question: s.sr, options: { type: "typing" },
      correct_answer: s.de, explanation: s.de, order_index: i,
    }));
    await sb.from("exercise_questions").insert(questions);
    totalExercises++;
    totalQuestions += questions.length;
    console.log(`${lesson.title}: ${questions.length}`);
  }

  console.log(`\nUkupno: ${totalExercises} vežbi, ${totalQuestions} rečenica`);
}

main().catch(console.error);
