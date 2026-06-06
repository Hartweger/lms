// Završni test za kurs nemacki-b2-1 (NE Goethe B2 — to je polozi-goethe-b2/build-b2-lesen-mt*).
// Format kakav je Nataša dala: samostalna a/b/c/d pitanja + 1 richtig/falsch sa kratkim tekstom.
// Pitanja numerisana 26–50 u izvoru = 25 pitanja. Dry-run default; --apply za upis.
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
const LESSON_TITLE = "Završni test B2.1";
const EX = "Završni test B2.1";

// [pitanje, [opcije...], tačanIndex]
const Q = [
  ["Neue Wege im Leben zu gehen, fällt vielen Menschen schwer, denn sie haben Angst ____ Misserfolgen. Beruflicher Druck ____ dabei sicher auch eine Rolle.",
    ["um … hat", "von … trägt", "vor … spielt", "zu … übernimmt"], 2],
  ["Ich würde mich gerne neu orientieren und meinen Job wechseln. Sollte ich ____ erklären?\n● Das musst du nicht, aber vielleicht kann er dich unterstützen, wenn du ____ sagst.",
    ["die Gründe meinem Chef … ihm sie", "die Gründe meinem Chef … sie ihm", "meinem Chef die Gründe … ihm sie", "meinem Chef die Gründe … sie ihm"], 3],
  ["Meine Eltern sind in den 1960-er Jahren nach Deutschland gekommen und als Einwanderer ____.",
    ["haben sie hart gearbeitet müssen", "haben sie hart arbeiten müssen", "haben sie hart müssen arbeiten", "arbeiten sie hart haben müssen"], 1],
  ["Hab’ ich dir schon von meiner Freundin Lara erzählt? Sie kommt ursprünglich aus Rumänien, hat lange in Deutschland gelebt und ist jetzt nach Schweden ausgewandert. ____ ihr Freund, der dort Arbeit gefunden hat.",
    ["Ein Grund für diese Entscheidung war", "Für diese Entscheidung ein Grund war", "War ein Grund für diese Entscheidung", "War für diese Entscheidung ein Grund"], 0],
  ["Mir gefällt es besonders am See, denn ich sitze gern unter einem der alten Bäume und schaue aufs Wasser. ____ werde ich ganz still und höre den Enten zu.",
    ["Mir gefällt es besonders, weil", "Interessant ist, dass", "Wenn ich da bin,", "Das erinnert mich daran, dass"], 2],
  ["… und dann hat sie gesagt: „____ Ihrer Erfahrung und der guten Ergebnisse Ihrer Arbeit möchten wir Ihnen eine feste Stelle bei uns im Betrieb anbieten …“ Toll, oder? Im ersten Moment habe ich ____ Aufregung gar nichts sagen können!",
    ["Vor … dank", "Aufgrund … vor", "Aus … aufgrund", "Aufgrund … dank"], 1],
  ["____, hätte ich vielleicht doch darüber nachgedacht, das Geschäft zu übernehmen.\n● ____ sie es noch nicht verkauft haben, könntest du doch noch einmal mit ihnen darüber sprechen.",
    ["Meine Eltern hätten mich nicht so unter Druck gesetzt … Sobald", "Hätten meine Eltern mich nicht so unter Druck gesetzt … Falls", "Wenn meine Eltern mich nicht so unter Druck gesetzt haben … Ob", "Wenn meine Eltern mich nicht so unter Druck setzen … Dass"], 1],
  ["Ich bin der ____, Kinder sollten nicht nur die ____ der Eltern erfüllen, sondern vor allem ihren eigenen Weg gehen.",
    ["Absicht … Vorbilder", "Vorsicht … Sorgen", "Aussicht … Voraussetzungen", "Ansicht … Erwartungen"], 3],
  ["Kannst du mir ein paar Tipps geben, wie ich mich selbst im Netz besser darstellen könnte?\n● Klar: also, was du ____ musst, ist, dass deine Profile zueinander passen: das private Image sollte dem beruflichen nicht widersprechen.",
    ["beständig ändern", "regelmäßig beauftragen", "unbedingt beachten", "seriös erfüllen"], 2],
  ["Ich habe Toni gestern von meinem neuen Projekt erzählt, da hat er ____ angeboten!\n● Sehr gut, er hat viel Erfahrung mit sozialen Netzwerken, er kann dir bestimmt viel zeigen!",
    ["sofort mir seine Hilfe", "sofort seine Hilfe mir", "mir sofort seine Hilfe", "seine Hilfe mir sofort"], 2],
  ["Die Mitarbeiter bei uns im Betrieb sind viel motivierter, seit die neue Chefin da ist. Jetzt dürfen sie ____ eigene Ideen einbringen ____ die Arbeit zum Großteil selbst organisieren!",
    ["je … desto", "sowohl … als auch", "weder … noch", "zwar … aber"], 1],
  ["Danke für Ihre Stellungnahme, Frau Lombardi, Sie meinen also, dass Sie als Vorgesetzte auch manchmal die ____ an Ihre Mitarbeiter abgeben müssen. Herr Kimoto, wie ____ Sie zu diesem Thema?",
    ["Anforderung … halten", "Kompetenz … treffen", "Hierarchie … stellen", "Verantwortung … stehen"], 3],
  ["Fallschirmspringen? Nein, ohne mich! Das Risiko würde ich nicht ____!\n● Ui, mir wäre das auch zu ____. Dabei kann so viel passieren…",
    ["eingehen … gefährlich", "überwinden … riskant", "unternehmen … ängstlich", "versuchen … aufgeregt"], 0],
  ["Du möchtest deine Kondition verbessern? ____ musst du nicht unbedingt ins Fitnessstudio gehen. ____ Stärkung von Herz und Kreislauf könntest du jeden Tag eine Stunde zu Fuß gehen.",
    ["Dafür … Zur", "Damit … Für", "Für … Dazu", "Zur … Dafür"], 0],
  ["Wir verwenden für unser Mittagsmenü keine Gerichte, die schon fertig ____. Unsere Lebensmittel sind ____ kurze Transportwege garantiert frisch.",
    ["zubereitet haben … durch", "zubereitet sind … von", "zubereitet werden … aus", "zubereitet sind … durch"], 3],
  ["Pia hat mir empfohlen, genau darauf zu achten, wie viele Kohlenhydrate ich am Tag esse. ____ hat sie recht, wenn sie sagt, dass man bewusst essen sollte, ____ bedeutet das nicht, dass man sein Essverhalten zu hundert Prozent kontrollieren sollte.",
    ["Obwohl … dennoch", "Zwar … jedoch", "Sowohl … als auch", "Weder … noch"], 1],
  ["Ein besonderes ____ unserer neuen Therapie ist die Verwendung einer Spezialbrille. Sie ____ sich dadurch aus, dass die blauen Anteile des Lichts herausgefiltert werden.",
    ["Merkmal … zeichnet", "Problem … zahlt", "Bewusstsein … drückt", "Interesse … tauscht"], 0],
  ["Also, mein Freund und ich sind einfach komplett verschieden: ____ er gern früh aufsteht, bleibe ich lieber noch etwas im Bett; er macht abends viel Sport, ich schaue ____ lieber einen Film oder lese ein Buch…",
    ["Damit … im Gegensatz zu", "Nachdem … während", "Während … hingegen", "Solange … während"], 2],
  ["Ich war zuerst viele Jahre in einem Büro angestellt, ____ ich mich selbstständig gemacht habe. Am Anfang lief es nicht so gut, aber ____ ich diese Schwierigkeiten akzeptiert hatte, habe ich gelernt, damit umzugehen.",
    ["davor … solange", "ehe … sobald", "nachdem … währenddessen", "vor … bis"], 1],
  ["In meinem Job handle ich oft ohne lange nachzudenken. Ich weiß schnell, welcher Weg der richtige ist. Es ist ____, dass ich schnell Entschlüsse fassen kann. ____, dass man mit einem Gefühl auch falsch liegen kann.",
    ["aus Interesse … Aber man kann vergessen", "von Vorteil … Trotzdem darf man nicht vergessen", "zum Glück … Denn man sollte nicht vergessen", "auf der einen Seite … Allerdings vergisst man besser"], 1],
  ["Wollen wir mal den Keller entrümpeln und nur das behalten, was wir wirklich brauchen, ____ alles Jahre lang ____ lagern?",
    ["anstatt … zu", "statt … –", "stattdessen … –", "stattdessen … zu"], 0],
  ["Ich glaube, ich könnte ____. Ich habe sie ____ nicht mehr benutzt.",
    ["meine Küchenmaschine vermissen … sowieso", "meine Küchenmaschine brauchen … sicherlich", "auf meine Küchenmaschine verzichten … ewig", "meine Küchenmaschine entrümpeln … gewiss"], 2],
  ["Herr Simon, bei diesem Lärm kann ich nicht schlafen!!!\n● Sie ____, ich habe am Freitag ein wichtiges Konzert.\n■ Könnten wir ____, dass sie in einer Stunde aufhören? Sie können doch morgen früh weiterüben.",
    ["können doch nachvollziehen … darin eins sein", "müssen doch verstehen … uns darauf einigen", "wollen doch begreifen … damit auskommen", "dürfen doch wissen … uns verstehen"], 1],
  ["Entschuldigung, wie kann ich mich bitte für die Veranstaltung anmelden?\n● Ganz einfach: Das Anmeldeformular ____ sich im Internet unter dieser Adresse ____. Nach dem Ausfüllen erhalten Sie eine Bestätigungsmail.",
    ["ist … aufgerufen", "kann … aufrufen", "lässt … aufrufen", "wird … aufrufen"], 2],
  ["**Ein Neubeginn (Jochen, 43)**\n\nNach meinem Studium habe ich einige Jahre in einer Werkstatt gearbeitet. Ich habe hart gearbeitet und meine Aufträge immer gut erfüllt. Meine eigenen Ideen konnte ich jedoch nicht einbringen. Das fehlte mir. Während dieser Zeit habe ich oft davon geträumt, mich selbstständig zu machen und ein eigenes Geschäft zu eröffnen. Allerdings habe ich diesen Schritt zunächst nicht gewagt. Vor drei Jahren verlor ich dann meine Stelle in der Werkstatt. Da habe ich allen Mut zusammengenommen und den Entschluss gefasst, meinen Traum endlich zu verwirklichen. Die Selbstständigkeit war am Anfang eine große Herausforderung, aber meine Familie und Freunde haben mich unterstützt. Heute läuft es gut, ich bin für ein kleines Team von drei Angestellten verantwortlich und im nächsten Jahr möchte ich meinen Betrieb sogar vergrößern.\n\n**Aussage:** Jochen traute sich erst nicht, eine eigene Firma zu gründen. Als er dann arbeitslos wurde, hatte er keine andere Wahl und musste sich selbstständig machen. Seine Freunde und Familie haben ihm geholfen.",
    ["richtig", "falsch"], 1],
];

const { data: course } = await sb.from("courses").select("id").eq("slug", COURSE_SLUG).single();
if (!course) { console.error(`Kurs ${COURSE_SLUG} ne postoji`); process.exit(1); }

let { data: lesson } = await sb.from("lessons").select("id,order_index").eq("course_id", course.id).eq("title", LESSON_TITLE).maybeSingle();
console.log(`Kurs ${COURSE_SLUG}: ${course.id} | pitanja: ${Q.length} | lekcija "${LESSON_TITLE}": ${lesson ? lesson.id : "(napraviće se)"}`);
if (!APPLY) { console.log("[DRY] Pokreni sa --apply za upis."); process.exit(0); }

if (!lesson) {
  const { data: maxRow } = await sb.from("lessons").select("order_index").eq("course_id", course.id).order("order_index", { ascending: false }).limit(1).single();
  const order = (maxRow?.order_index ?? -1) + 1;
  const { data: created, error } = await sb.from("lessons").insert({
    course_id: course.id, title: LESSON_TITLE, order_index: order, lesson_type: "text",
    sections: [
      { type: "badge", module: "Završni test B2.1" },
      { type: "text", style: "info", content: "Završni test za nivo B2.1. Izaberi tačan odgovor (a/b/c/d). Test proverava gramatiku i rečnik celog nivoa." },
    ],
  }).select("id").single();
  if (error) throw error;
  lesson = created;
  console.log(`+ kreirana lekcija ${lesson.id} (order ${order})`);
}

await sb.from("exercises").delete().eq("lesson_id", lesson.id).eq("title", EX);
const { data: ex, error: exErr } = await sb.from("exercises").insert({
  lesson_id: lesson.id, title: EX, exercise_type: "quiz", order_index: 0,
}).select("id").single();
if (exErr) throw exErr;

// QuizExercise renderuje kao HTML kad string sadrži "<" → markdown bold + prelomi u HTML
const fmt = (s) => s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");

let i = 0;
for (const [q, items, correct] of Q) {
  const { error } = await sb.from("exercise_questions").insert({
    exercise_id: ex.id,
    question: `<strong>Aufgabe ${i + 1}</strong><br><br>${fmt(q)}`,
    options: { type: "quiz", items },
    correct_answer: String(correct),
    question_type: "quiz",
    order_index: i++,
  });
  if (error) throw error;
}
console.log(`✓ Upisan test "${EX}" — ${Q.length} pitanja u lekciju ${lesson.id}`);
