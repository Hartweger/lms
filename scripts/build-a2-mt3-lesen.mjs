// Kreira lekciju "Modelltest 3 — Lesen" (A2.2) + Lesen vežbu (Teil 1–4, 20 pitanja).
// Čist tekst (context panel) → samo PODACI, bez deploya. Izvor: Modelltest3_Lesen_A2_LOESUNGEN.pdf.
// Dry-run default; --apply. Idempotentno.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = {};
for (const raw of readFileSync(".env.local", "utf8").split("\n")) { const m = raw.replace(/\r$/, "").match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, ""); }
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const COURSE = "0b4a095e-2841-4fe8-b6b0-ed0973a30e31";

const CTX1 = { type: "text", title: "Lesen Teil 1 — Zeitungstext", content:
"**Heute vorgestellt: die Schauspielerin Jasmin Tabatabai**\n\nDie deutsch-iranische Schauspielerin und Musikerin Jasmin Tabatabai hat ihr drittes Kind bekommen, zum ersten Mal einen Sohn. Der Vater ist ihr Freund und Kollege Andreas Pietschmann, der auch Vater ihrer zweiten Tochter Helena Leila ist. Ihre erste Tochter kommt aus einer früheren Ehe. Heiraten möchte sie schon wieder, sie will sich aber noch etwas Zeit lassen.\n\nJasmin Tabatabai wurde 1967 in Teheran geboren. Ihre Mutter ist Deutsche und ihr Vater, der 1986 gestorben ist, war Iraner. Beide haben sich in Deutschland kennengelernt. Seit 1978 lebt Jasmin in Deutschland. Sie hat beide Nationalitäten.\n\nHeute ist Jasmin eine der bekanntesten Schauspielerinnen Deutschlands. Ihre Karriere als Schauspielerin begann 1992, seit dieser Zeit hatte sie viele Rollen in Fernsehfilmen. Sehr beliebt bei den Fernsehzuschauern ist die Krimiserie „Letzte Spur Berlin“. Dort spielt sie eine Kommissarin. In sehr vielen Kinofilmen hat sie mitgespielt und bekam auch viele Preise, unter anderem den Deutschen Filmpreis. Inzwischen hat sie ihren hundertsten Film gefeiert. Auch in Theatern war sie zu sehen.\n\nJasmin Tabatabai arbeitet außerdem als Musikerin und Sängerin. Für viele ihrer Filme hat sie Songs geschrieben, auch CDs mit eigenen Liedern. 2012 bekam sie den Echo Jazz Award." };

const CTX2 = { type: "text", title: "Lesen Teil 2 — marktplatz.de", content:
"**marktplatz.de — Günstige Angebote online**\n\n- **Büroartikel & Schreibwaren:** Büromöbel, Büroartikel, Papier, Geschenkartikel\n- **Elektronik:** Hi-Fi, TV, CD-/MP3-Player, Stereoanlagen, Lautsprecher, Telefonie & Fax, Handys, Smartphones, Computer, Drucker, Scanner, **Software**\n- **Essen & Trinken:** Getränke, Lebensmittel, Brot & Kuchen\n- **Haus & Garten:** Blumen, Pflanzen, **Garten- und Balkonmöbel**, Sonnenschirme\n- **Haushaltsgeräte:** Küchengeräte, Staubsauger, Waschmaschinen, Kühlschränke\n- **Bauen & Renovieren:** Baustoffe, Werkzeug, Fußböden, **Farbe / Alles für die Renovierung**\n- **Musik:** CDs, LPs, DVDs, Musikinstrumente, Songbücher\n- **Film & Video:** Fotoapparate, Kameras, Videokameras\n- **Sport & Wellness:** Fitness, Fahrräder, Sportgeräte\n- **Freizeit, Urlaub & Reise:** Flug-, Bahn- und Busreisen, Last-Minute-Reisen\n- **Kultur:** Tickets für Festivals, Konzerte, Theater\n- **Wohnen:** Wohn-/Schlafzimmermöbel, Lampen, Küchen-/Badezimmermöbel, Teppiche\n- **Fit & Gesund:** Gesundheit & Kosmetik, Diät & Ernährung, Wellness, Drogerieartikel, **Apotheke**" };

const CTX3 = { type: "text", title: "Lesen Teil 3 — E-Mail", content:
"Liebe Nadine,\n\nwie war euer Essen am Samstag? Tut mir leid, dass ich nicht gekommen bin, aber, wie ich dir ja gemailt habe, ich lag im Bett. Heute geht es wieder etwas besser, ich habe kein Fieber mehr. Schade, dass ich dir mein Geschenk nicht geben konnte. Ich sage dir noch nicht, was es ist, nur so viel: etwas für eure neue Wohnung.\n\nUnd schade, dass ich deine Wohnung noch nicht gesehen habe. Naja, wenn ich wieder gesund bin, komme ich ganz schnell vorbei. Weil ich aber immer noch nicht ganz fit bin und zu Hause bleiben muss, hast du vielleicht Lust, heute oder die nächsten Tage bei mir vorbeizukommen? Wir können uns nett unterhalten oder einen Film im Fernsehen sehen.\n\nNadine, wenn du möchtest, schick mir doch Fotos von deiner neuen Wohnung. Ich bin gespannt auf deinen großen Balkon, von dem du mir erzählt hast. Du hattest wirklich Glück, so eine günstige Miete! Wenn du etwas von einer leeren Wohnung hörst, sag mir bitte Bescheid. Ich suche ja immer noch und kann einfach nichts finden. Über die Zeitung und über Internet hatte ich kein Glück.\n\nJetzt mache ich erst einmal Schluss für heute, mir geht es immer noch nicht so gut und ich muss mich wieder hinlegen und ausruhen …\n\nAlles Liebe und bis bald, Laura" };

const CTX4 = { type: "text", title: "Lesen Teil 4 — Anzeigen", content:
"**a) www.las-tapas.de** — Supermarkt: Essen und Getränke aus Spanien und Portugal. Tapas, Serrano Schinken, Feinkost und Weine. Mo.–Sa. 11.30–20.00 Uhr. Jeden Samstagnachmittag kann man bekannten Köchen bei der Zubereitung zusehen.\n\n**b) www.restaurant-Asturia.de** — Gerichte aus der portugiesischen und spanischen Küche. Täglich frischer Fisch. Täglich 19–23 Uhr. Samstagabends Live-Musik. Garten wegen Umbau zurzeit geschlossen.\n\n**c) www.asia-Shop.de** — Fachgeschäft für asiatische Lebensmittel. Thai-Curry, Sushi. Täglich 10–19 Uhr.\n\n**d) www.schwäbische-Küche.de** — Spezialitäten aus Süddeutschland. Frühstück, Mittagessen, Kaffee/Kuchen, Abendessen. Mit Biergarten und Spielplatz. Täglich 11–14 und 17–23 Uhr. **Montags geschlossen.**\n\n**e) www.essen-service.de** — Keine Lust zu kochen? PLZ eingeben, Lieferservice in der Nähe finden, bestellen — Essen kommt am selben Tag.\n\n**f) www.café-bäckerei-groß.de** — Café zum Ausspannen, Frühstück, Spezialitäten der Biobäckerei. Mo.–Sa. 6.30–18.00 Uhr, So. 8.00–17.00 Uhr." };

const T4ITEMS = ["a) las-tapas.de", "b) restaurant-Asturia.de", "c) asia-Shop.de", "d) schwäbische-Küche.de", "e) essen-service.de", "f) café-bäckerei-groß.de", "X — keine Anzeige passt"];

const q = (n, txt, head = "") => `${head}<strong>${n}.</strong> ${txt}`;
const H1 = "<strong>Lesen Teil 1</strong> — Pročitaj tekst (desno) i izaberi a/b/c.<br><br>";
const H2 = "<strong>Lesen Teil 2</strong> — Na koju stranicu (Seite) treba da odeš?<br><br>";
const H3 = "<strong>Lesen Teil 3</strong> — Pročitaj e-mail i izaberi a/b/c.<br><br>";
const H4 = "<strong>Lesen Teil 4</strong> — Koji oglas (a–f) odgovara osobi? Ako nijedan: X.<br><br>";

const QS = [
  // Teil 1
  { question: q(1, "Jasmin Tabatabai …", H1), items: ["war noch nie verheiratet.", "hatte schon einmal einen Mann.", "findet heiraten nicht wichtig."], correct: "2", ctx: CTX1 },
  { question: q(2, "Ihre Mutter …"), items: ["ist im Iran geboren.", "hat einen deutschen und einen iranischen Pass.", "hat ihren Vater zum ersten Mal in Deutschland getroffen."], correct: "2", ctx: CTX1 },
  { question: q(3, "Sie macht nicht nur Filme, …"), items: ["sie macht auch Musik und Theater.", "sie arbeitet auch bei der Polizei.", "sie gibt anderen Künstlern Preise."], correct: "0", ctx: CTX1 },
  { question: q(4, "In Deutschland …"), items: ["hat sie 100 Preise bekommen.", "hat sie Preise für ihre Filme und ihre Musik bekommen.", "hat sie schon 1992 einen Preis bekommen."], correct: "1", ctx: CTX1 },
  { question: q(5, "Dieser Text informiert über …"), items: ["Musik aus verschiedenen Ländern.", "das Leben einer Künstlerin.", "bekannte Kinofilme."], correct: "1", ctx: CTX1 },
  // Teil 2
  { question: q(6, "Für Arbeiten in Ihrem Bad suchen Sie Farbe.", H2), items: ["Wohnen.", "Bauen & Renovieren.", "andere Seite."], correct: "1", ctx: CTX2 },
  { question: q(7, "Sie möchten Ihre Musik auf dem Computer neu ordnen und suchen eine Software dafür."), items: ["Kultur.", "Musik.", "andere Seite."], correct: "2", ctx: CTX2 },
  { question: q(8, "Sie suchen einen Schreibtisch, Kugelschreiber und Hefte für Ihr Arbeitszimmer."), items: ["Büroartikel & Schreibwaren.", "Wohnen.", "andere Seite."], correct: "0", ctx: CTX2 },
  { question: q(9, "Sie fahren mit dem Bus in den Urlaub und suchen ein Medikament gegen Übelkeit."), items: ["Freizeit, Urlaub & Reise.", "Fit & Gesund.", "andere Seite."], correct: "1", ctx: CTX2 },
  { question: q(10, "Sie haben eine neue Wohnung und suchen Balkonstühle."), items: ["Haus & Garten.", "Haushaltsgeräte.", "andere Seite."], correct: "0", ctx: CTX2 },
  // Teil 3
  { question: q(11, "Laura entschuldigt sich, …", H3), items: ["weil sie nicht geschrieben hat.", "weil sie Nadine nicht besuchen konnte.", "weil sie kein Geschenk gekauft hat."], correct: "1", ctx: CTX3 },
  { question: q(12, "Laura schlägt vor, …"), items: ["sich bald zu treffen.", "bald ins Kino zu gehen.", "Sport zu machen."], correct: "0", ctx: CTX3 },
  { question: q(13, "Nadine …"), items: ["hat viele Bilder in ihrer Wohnung.", "hat lange im Internet eine Wohnung gesucht.", "muss nicht viel für ihre neue Wohnung bezahlen."], correct: "2", ctx: CTX3 },
  { question: q(14, "Laura …"), items: ["zieht bald um.", "braucht neue Möbel.", "möchte umziehen."], correct: "2", ctx: CTX3 },
  { question: q(15, "Laura kann nicht viel schreiben, …"), items: ["weil sie immer noch nicht ganz gesund ist.", "weil sie keine Zeit hat.", "weil sie noch am Computer arbeiten muss."], correct: "0", ctx: CTX3 },
  // Teil 4
  { question: q(16, "Saskia möchte am Montagnachmittag ihren Geburtstag feiern und Kuchen essen gehen.", H4), items: T4ITEMS, correct: "5", ctx: CTX4 },
  { question: q(17, "Marian möchte am Samstagabend spanisch essen gehen und draußen sitzen."), items: T4ITEMS, correct: "6", ctx: CTX4 },
  { question: q(18, "Lola feiert am Samstagabend Geburtstag und möchte Essen und Getränke bestellen."), items: T4ITEMS, correct: "4", ctx: CTX4 },
  { question: q(19, "Tim kocht gern und sucht Tipps für die spanische Küche."), items: T4ITEMS, correct: "0", ctx: CTX4 },
  { question: q(20, "Susanne möchte in der Mittagspause Kollegen in ein Restaurant einladen."), items: T4ITEMS, correct: "3", ctx: CTX4 },
];

// 1) lekcija
let { data: lesson } = await sb.from("lessons").select("id").eq("course_id", COURSE).eq("title", "Modelltest 3 — Lesen").maybeSingle();
if (lesson) console.log("Lekcija već postoji:", lesson.id);
else {
  console.log("→ kreiram lekciju 'Modelltest 3 — Lesen' (order_index 35)");
  if (APPLY) {
    const sections = [
      { type: "badge", module: "Modelltest 3", category: "lesen" },
      { type: "text", style: "info", content: "## Modelltest 3 — Lesen\n\nVežbaj čitanje kao na ispitu (Goethe-Zertifikat A2), 4 dela, 20 zadataka. Tekst za čitanje vidiš uz svako pitanje.\n\n- **Teil 1:** novinski tekst + 5×a/b/c\n- **Teil 2:** marktplatz.de — na koju stranicu? 5×\n- **Teil 3:** e-mail + 5×a/b/c\n- **Teil 4:** 6 oglasa → 5 osoba (ili X)" },
    ];
    const { data: c, error } = await sb.from("lessons").insert({ course_id: COURSE, title: "Modelltest 3 — Lesen", lesson_type: "text", content: "", order_index: 35, is_free_preview: false, sections }).select("id").single();
    if (error) { console.log("ERROR lekcija:", error.message); process.exit(1); }
    lesson = c; console.log("  ✓ lekcija:", lesson.id);
  }
}
// 2) vežba + pitanja
if (APPLY && lesson) {
  const { data: exEx } = await sb.from("exercises").select("id").eq("lesson_id", lesson.id).eq("title", "Lesen — Modelltest 3").maybeSingle();
  if (exEx) console.log("Vežba već postoji:", exEx.id);
  else {
    const { data: ex, error: e1 } = await sb.from("exercises").insert({ lesson_id: lesson.id, title: "Lesen — Modelltest 3", exercise_type: "quiz", order_index: 0 }).select("id").single();
    if (e1) { console.log("ERROR vežba:", e1.message); process.exit(1); }
    const rows = QS.map((x, i) => ({ exercise_id: ex.id, question: x.question, options: { type: "quiz", items: x.items, context: x.ctx }, correct_answer: x.correct, explanation: null, order_index: i }));
    const { error: e2 } = await sb.from("exercise_questions").insert(rows);
    console.log(e2 ? `ERROR pitanja: ${e2.message}` : `  ✓ vežba + ${rows.length} pitanja`);
  }
} else if (!APPLY) console.log(`(dry-run) bi kreirao 'Lesen — Modelltest 3' sa ${QS.length} pitanja`);
