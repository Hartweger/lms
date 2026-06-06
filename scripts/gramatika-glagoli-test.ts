/**
 * GLAGOLI – test za kurs Gramatika A2-B1.
 * Kreira (ili osvežava) lekciju "GLAGOLI – test" sa jednim mešanim testom.
 * Tipovi po pitanju: quiz (a/b/c i nastavci), typing (slobodan unos), fill_blank (više praznina).
 * Idempotentno: briše postojeću vežbu istog naslova pre upisa.
 * Run: npx tsx scripts/gramatika-glagoli-test.ts
 */
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = path.resolve(__dirname, "../.env.local");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [k, ...v] = line.split("="); if (k && v.length) process.env[k.trim()] = v.join("=").trim();
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const COURSE_SLUG = "gramatika-a2-b1";
const LESSON_TITLE = "GLAGOLI – test";
const EX_TITLE = "Test: Glagoli i gramatika";

type Q = { question: string; options: unknown; correct_answer: string; question_type: string; explanation?: string };
const quiz = (q: string, items: string[], idx: number): Q =>
  ({ question: q, options: { type: "quiz", items }, correct_answer: String(idx), question_type: "quiz" });
const typing = (q: string, ans: string): Q =>
  ({ question: q, options: { type: "typing" }, correct_answer: ans, question_type: "typing" });
const fill = (q: string, answers: string[]): Q =>
  ({ question: q, options: { type: "fill_blank", items: answers }, correct_answer: answers.join(", "), question_type: "fill_blank" });

// 5-opcijski bank za N-/genitiv nastavke
const END = ["–", "s", "es", "n", "en"]; // index: –=0, s=1, es=2, n=3, en=4
const end = (q: string, idx: number): Q => quiz(q, END, idx);

const QUESTIONS: Q[] = [
  quiz("Welcher Satz ist richtig?", ["Wann ist dein Opa gestorben?", "Wann hat dein Opa gestorben?", "Wann ist dein Opa gesterbt?"], 0),
  quiz("Welcher Satz ist richtig?", ["Ich bin gestern zur Party gegangen.", "Ich war gestern zur Party gegangen.", "Ich bin gestern zur Party gehen."], 0),
  typing("Dopuni Partizip II od glagola aufstehen:\n\nWann bist du heute ______?", "aufgestanden"),
  typing("Dopuni Partizip II od glagola besuchen:\n\nIch habe gestern meine Oma ______.", "besucht"),
  typing("Dopuni Partizip II od glagola studieren:\n\nMein Bruder hat in Berlin ______.", "studiert"),
  typing("„Da li si ti morao kao dete da radiš domaći sam?“ — koji glagol nedostaje?\n\n______ du als Kind deine Aufgabe alleine machen?", "Musstest"),
  typing("Kako bi na nemačkom rekli u imperativu: „Smestite se!“ / „Sedite!“\n\n______, bitte.", "Setzen Sie sich"),
  quiz("U rečenici „Das muss ich ___ überlegen“, šta nedostaje?", ["mir", "dir", "dich"], 0),
  typing("Šta nedostaje?\n\nIch bin zur Arbeit gegangen, nachdem ich gegessen ______.", "hatte"),
  typing("Bajka „Crvenkapa“ — dopuni glagol nositi u preteritu:\n\nDas Mädchen ______ ein rotes Käppchen.", "trug"),
  typing("Kako bismo pitali: „Da li si ti juče bio u gradu?“\n\n______ du gestern in der Stadt?", "Warst"),
  fill("„Ja sam želeo juče da posetim baku.“\n\nIch ______ gestern meine Oma ______.", ["wollte", "besuchen"]),
  typing("Dopuni glagolom werden u odgovarajućem obliku:\n\nWann ______ wir uns wiedersehen?", "werden"),
  typing("Kako bismo rekli da je neko pocrneo:\n\nEr ist braun ______.", "geworden"),
  fill("Šta se sve radi u kuhinji? Dopuni pasivnim oblicima:\n\nZuerst ______ die Kartoffeln ______. Dann ______ die Kartoffeln ______.", ["werden", "geschält", "werden", "gebacken"]),
  typing("Kako bi rekla: „Ja bih rado bila na moru.“\n\nIch ______ gerne am Meer.", "wäre"),
  typing("Kako bi rekla: „Ja bih jednu kafu.“\n\nIch ______ gerne einen Kaffee.", "hätte"),
  quiz("Koja je rečenica ispravna?", ["Ich wäre gerne ans Meer fahren.", "Ich hätte gerne ein Haus kaufen.", "Ich würde gerne eine Pause machen."], 2),
  typing("Kako bismo rekli: „Da li biste mi mogli pomoći?“\n\n______ Sie mir helfen?", "Könnten"),
  typing("„Da sam imala vremena, učila bih više.“ (ista reč ide u obe praznine)\n\nWenn ich Zeit gehabt ______, ______ ich mehr gelernt.", "hätte"),
  typing("„Ostavljam auto na popravku.“\n\nIch ______ das Auto reparieren.", "lasse"),
  fill("Koji glagoli idu sa kojim predlogom? Dopuni predlozima.\n\nIch erinnere mich ______. Ich träume ______. Ich warte ______. Ich ärgere mich ______.", ["an", "von", "auf", "über"]),
  typing("Kako bismo rekli: „Ja sanjam o putovanju oko sveta.“\n\nIch träume ______ einer Weltreise.", "von"),
  typing("Kako bismo rekli: „Šta ti čekaš?“\n\n______ wartest du?", "Worauf"),
  typing("Kako bismo rekli: „Na koga ti misliš?“\n\n______ denkst du?", "An wen"),
  typing("Kako bismo rekli: „Radujem se tome.“\n\nIch freue mich ______.", "darauf"),
  fill("Dopuni sa zu ili sa – ako ne ide zu:\n\nIch versuche, Deutsch ______ lernen. Ich muss Deutsch ______ lernen.", ["zu", "–"]),
  typing("„Učim nemački jer želim da radim u Nemačkoj.“\n\nIch lerne Deutsch, ______ ich in Deutschland arbeiten möchte.", "weil"),
  fill("„Znam da ti dolaziš sutra.“\n\nIch weiß, ______ du ______.", ["dass", "morgen kommst"]),
  fill("„Ako pada kiša, ostajem kod kuće.“\n\nWenn es ______, ______ ich zu Hause.", ["regnet", "bleibe"]),
  typing("„Umoran je, iako je dugo spavao.“\n\nEr ist müde, ______ er lange geschlafen hat.", "obwohl"),
  typing("Kako bismo rekli „da bi“?\n\nIch arbeite viel, ______ ich mehr Geld verdiene.", "damit"),
  fill("Dopuni: wenn ili als.\n\na) ______ ich Zeit habe, lese ich ein Buch.\nb) ______ ich Kind war, habe ich in Wien gewohnt.", ["Wenn", "Als"]),
  typing("Dopuni indirektno pitanje — „Ona pita da li ja sutra dolazim“:\n\nSie fragt, ______ ich morgen komme.", "ob"),
  typing("Dopuni indirektno pitanje — „Ona želi da zna kada polazi voz“:\n\nSie möchte wissen, ______ der Zug abfährt.", "wann"),
  quiz("Was ist richtig?", ["Ich lerne Deutsch, um ich in Deutschland zu arbeiten.", "Ich lerne Deutsch, um in Deutschland zu arbeiten.", "Ich lerne Deutsch, damit in Deutschland arbeiten kann."], 1),
  typing("Dopuni relativnu zamenicu:\n\nDas ist der Mann, ______ hier lebt.", "der"),
  typing("Das ist der Mann, ______ ich lange nicht gesehen habe.", "den"),
  typing("Das ist der Mann, ______ dieses Auto gehört.", "dem"),
  typing("Das ist der Mann, ______ Kind sehr brav ist.", "dessen"),
  typing("Das ist der Mann, ______ ich lange gewartet habe.", "auf den"),
  typing("Das ist der Mann, ______ ich oft denke.", "an den"),
  typing("Das ist der Mann, ______ ich mich interessiere.", "für den"),
  typing("Kako glasi komparativ od alt?", "älter"),
  quiz("Was ist richtig?", ["Er ist so alt wie du.", "Er ist älter wie du.", "Er ist alt als dich."], 0),
  typing("Was passt?\n\nEntweder kommst du heute, ______ du bleibst zu Hause.", "oder"),
  typing("Was passt?\n\nSowohl Maria ______ Peter sprechen Deutsch.", "als auch"),
  typing("Was passt?\n\nSie spricht weder Deutsch ______ Italienisch.", "noch"),
  typing("Was passt?\n\n______ mehr du übst, desto besser sprichst du.", "Je"),
  typing("Was passt?\n\nNicht nur Anna, ______ Lukas hat die Prüfung bestanden.", "sondern auch"),
  typing("Was passt?\n\nSowohl im Sommer ______ im Winter fahren wir nach Österreich.", "als auch"),
  typing("Was passt?\n\n______ länger ich in Deutschland lebe, desto besser verstehe ich die Sprache.", "Je"),
  // 57–69: N-/genitiv nastavci (bank: –, s, es, n, en)
  end("Dopuni nastavak:\n\nWir haben einen neuen Präsident____ gewählt.", 4),
  end("Dopuni nastavak:\n\nDie Studenten hören dem Professor____ aufmerksam zu.", 0),
  end("Dopuni nastavak:\n\nDer Zoowärter gibt dem Affe____ eine Banane.", 3),
  end("Dopuni nastavak:\n\nAnton hat von seiner Lehrerin____ ein Lob bekommen.", 0),
  end("Dopuni nastavak:\n\nIch kenne den Nachbar____ schon seit vielen Jahren.", 3),
  end("Dopuni nastavak:\n\nSie hilft dem Kolleg____ bei der Arbeit.", 4),
  end("Dopuni nastavak:\n\nIch sehe den Arzt____ jeden Tag in der Klinik.", 0),
  end("Dopuni nastavak:\n\nWir danken dem Mensch____ für seine Hilfe.", 4),
  end("Dopuni nastavak:\n\nIch telefoniere oft mit dem Student____.", 4),
  end("Dopuni nastavak:\n\nDer Hund läuft hinter dem Tourist____ her.", 4),
  end("Dopuni nastavak:\n\nDas ist das Auto meines Vater____.", 1),
  end("Dopuni nastavak:\n\nIch erinnere mich an den Geburtstag meines Freund____.", 2),
  end("Dopuni nastavak:\n\nDie Tasche der Studentin____ ist sehr schön.", 0),
  // 70–77: predlozi
  typing("Dopuni predlog:\n\nIch bin heute ______ Maria gegangen.", "zu"),
  typing("Dopuni predlog:\n\nWir sind letzte Woche ______ Berlin gefahren.", "nach"),
  typing("Dopuni predlog:\n\nIch war gestern ______ dem Arzt.", "bei"),
  typing("Dopuni predlog:\n\nIch bin gestern ______ das Theater gegangen.", "in"),
  typing("Dopuni predlog:\n\nGestern war ich den ganzen Tag ______ dem Büro.", "in"),
  typing("Dopuni predlog:\n\nEr ist gestern früh ______ Hause gegangen.", "nach"),
  typing("Dopuni predlog:\n\nIch komme gerade ______ der Arbeit.", "von"),
  typing("Dopuni predlog:\n\nWir treffen uns morgen ______ der Stadt.", "in"),
];

async function run() {
  const { data: course } = await sb.from("courses").select("id").eq("slug", COURSE_SLUG).single();
  if (!course) throw new Error("kurs gramatika-a2-b1 ne postoji");

  // lekcija (po naslovu); ako fali, kreiraj na kraj
  const { data: les } = await sb.from("lessons").select("id,title,order_index").eq("course_id", course.id);
  let lesson = les!.find((l) => l.title === LESSON_TITLE);
  if (!lesson) {
    const maxOrder = Math.max(0, ...les!.map((l) => l.order_index));
    const { data: created, error } = await sb.from("lessons").insert({
      course_id: course.id, title: LESSON_TITLE, order_index: maxOrder + 1, lesson_type: "text",
      sections: [{ type: "badge", module: "Test" }, { type: "text", style: "info", content: "Proveri svoje znanje glagola i gramatike A2–B1. Test ima " + QUESTIONS.length + " pitanja." }],
    }).select("id,title,order_index").single();
    if (error) throw error;
    lesson = created!;
    console.log(`+ kreirana lekcija "${LESSON_TITLE}" (order ${lesson.order_index})`);
  } else {
    console.log(`• lekcija "${LESSON_TITLE}" već postoji`);
  }

  // idempotentno: obriši postojeću vežbu istog naslova
  await sb.from("exercises").delete().eq("lesson_id", lesson.id).eq("title", EX_TITLE);
  const { data: ex, error: exErr } = await sb.from("exercises").insert({
    lesson_id: lesson.id, title: EX_TITLE, exercise_type: "quiz", order_index: 0,
  }).select("id").single();
  if (exErr) throw exErr;

  let i = 0;
  for (const q of QUESTIONS) {
    const { error } = await sb.from("exercise_questions").insert({
      exercise_id: ex!.id, question: q.question, options: q.options,
      correct_answer: q.correct_answer, explanation: q.explanation || null,
      question_type: q.question_type, order_index: i++,
    });
    if (error) throw error;
  }
  const byType = QUESTIONS.reduce((a, q) => { a[q.question_type] = (a[q.question_type] || 0) + 1; return a; }, {} as Record<string, number>);
  console.log(`✓ Test "${EX_TITLE}": ${QUESTIONS.length} pitanja (${JSON.stringify(byType)})`);
}
run().catch((e) => { console.error(e); process.exit(1); });
