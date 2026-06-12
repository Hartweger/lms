export type HalfLevel = "A1.1" | "A1.2" | "A2.1" | "A2.2" | "B1.1" | "B1.2" | "B2.1" | "B2.2";
export type QuestionType = "vocabulary" | "grammar" | "reading" | "communication";

export interface Question {
  id: string;
  level: HalfLevel;
  type: QuestionType;
  context?: string;       // Reading passage (for reading questions)
  question: string;
  options: [string, string, string, string];
  correctIndex: number;   // 0-3
}

export const HALF_LEVELS: HalfLevel[] = [
  "A1.1", "A1.2", "A2.1", "A2.2", "B1.1", "B1.2", "B2.1", "B2.2"
];

export const questions: Question[] = [
  // ===== A1.1 (10 questions) - target correctIndex: 0,1,2,3,0,1,2,3,0,2 =====
  {
    id: "a11-v1",
    level: "A1.1",
    type: "vocabulary",
    question: "Die Schwester von meiner Mutter ist meine ___.",
    // original correct: "Tante" (was index 1) → move to index 0
    options: ["Tante", "Oma", "Tochter", "Freundin"],
    correctIndex: 0,
  },
  {
    id: "a11-v2",
    level: "A1.1",
    type: "vocabulary",
    question: "Es ist Winter. Draußen sind minus 5 Grad. Wie ist das Wetter?",
    // original correct: "Es ist kalt." (was index 1) → keep at index 1
    options: ["Es ist heiß.", "Es ist kalt.", "Es regnet.", "Es ist warm."],
    correctIndex: 1,
  },
  {
    id: "a11-v3",
    level: "A1.1",
    type: "vocabulary",
    question: "Im Supermarkt kaufe ich Milch, Brot und ___.",
    // original correct: "Äpfel" (was index 1) → move to index 2
    options: ["Schuhe", "Stühle", "Äpfel", "Bücher"],
    correctIndex: 2,
  },
  {
    id: "a11-g4",
    level: "A1.1",
    type: "grammar",
    question: "Hallo, ich bin Maria. Und wie ___ du?",
    // original correct: "heißt" (was index 0) → move to index 3
    options: ["heiße", "heißen", "heißest", "heißt"],
    correctIndex: 3,
  },
  {
    id: "a11-g5",
    level: "A1.1",
    type: "grammar",
    question: "___ kommen Sie, Herr Erol? - Aus der Türkei.",
    // original correct: "Woher" (was index 1) → move to index 0
    options: ["Woher", "Wo", "Was", "Wer"],
    correctIndex: 0,
  },
  {
    id: "a11-g6",
    level: "A1.1",
    type: "grammar",
    question: "Das sind Claire und Charles. ___ leben in der Schweiz.",
    // original correct: "Sie" (was index 1) → keep at index 1
    options: ["Wir", "Sie", "Ihr", "Er"],
    correctIndex: 1,
  },
  {
    id: "a11-l7",
    level: "A1.1",
    type: "reading",
    context: "Hallo, ich bin Sara. Ich wohne in Wien und arbeite in einem Krankenhaus. Ich arbeite oft am Wochenende. Am Montag habe ich frei. Dann gehe ich gern ins Kino.",
    question: "Wann arbeitet Sara NICHT?",
    // original correct: "Am Montag" (was index 1) → move to index 2
    options: ["Am Wochenende", "Jeden Tag", "Am Montag", "Am Freitag"],
    correctIndex: 2,
  },
  {
    id: "a11-l8",
    level: "A1.1",
    type: "reading",
    context: "Das ist Pedro. Er kommt aus Spanien. Er lebt seit zwei Jahren in Deutschland. Er spricht Spanisch, Englisch und ein bisschen Deutsch. Er lernt Deutsch bei der Volkshochschule.",
    question: "Was ist Pedros Muttersprache?",
    // original correct: "Spanisch" (was index 2) → move to index 3
    options: ["Deutsch", "Englisch", "Französisch", "Spanisch"],
    correctIndex: 3,
  },
  {
    id: "a11-k9",
    level: "A1.1",
    type: "communication",
    question: "Du bist im Restaurant. Du möchtest bezahlen. Was sagst du?",
    // original correct: "Die Rechnung, bitte!" (was index 1) → move to index 0
    options: ["Die Rechnung, bitte!", "Guten Appetit!", "Ich habe Hunger.", "Das Essen ist gut."],
    correctIndex: 0,
  },
  {
    id: "a11-k10",
    level: "A1.1",
    type: "communication",
    question: "Ein Freund ist krank. Was sagst du?",
    // original correct: "Gute Besserung!" (was index 2) → keep at index 2
    options: ["Herzlichen Glückwunsch!", "Viel Spaß!", "Gute Besserung!", "Guten Appetit!"],
    correctIndex: 2,
  },

  // ===== A1.2 (10 questions) - target correctIndex: 1,2,3,0,1,2,3,0,1,2 =====
  {
    id: "a12-v1",
    level: "A1.2",
    type: "vocabulary",
    question: "Was ist Herr Müller von Beruf? Er arbeitet im Krankenhaus und hilft kranken Menschen. Er ist ___.",
    // original correct: "Arzt" (was index 1) → keep at index 1
    options: ["Lehrer", "Arzt", "Koch", "Kellner"],
    correctIndex: 1,
  },
  {
    id: "a12-v2",
    level: "A1.2",
    type: "vocabulary",
    question: "Es regnet draußen. Vergiss deine ___ nicht!",
    // original correct: "Jacke" (was index 1) → move to index 2
    options: ["Sonnenbrille", "Shorts", "Jacke", "Sandalen"],
    correctIndex: 2,
  },
  {
    id: "a12-v3",
    level: "A1.2",
    type: "vocabulary",
    question: "Ich war beim Zahnarzt. Mein ___ tut noch ein bisschen weh.",
    // original correct: "Zahn" (was index 2) → move to index 3
    options: ["Arm", "Fuß", "Rücken", "Zahn"],
    correctIndex: 3,
  },
  {
    id: "a12-g4",
    level: "A1.2",
    type: "grammar",
    question: "Gestern ___ ich zu Hause. Ich ___ starke Kopfschmerzen.",
    // original correct: "war ... hatte" (was index 1) → move to index 0
    options: ["war ... hatte", "bin ... habe", "habe ... bin", "sein ... haben"],
    correctIndex: 0,
  },
  {
    id: "a12-g5",
    level: "A1.2",
    type: "grammar",
    question: "Du bist immer so müde! ___ doch mal früher ins Bett!",
    // original correct: "Geh" (was index 2) → move to index 1
    options: ["Gehst", "Geh", "Gehen", "Gegangen"],
    correctIndex: 1,
  },
  {
    id: "a12-g6",
    level: "A1.2",
    type: "grammar",
    question: "Ich schenke ___ Bruder ein Buch zum Geburtstag.",
    // original correct: "meinem" (was index 1) → move to index 2
    options: ["mein", "meinen", "meinem", "meiner"],
    correctIndex: 2,
  },
  {
    id: "a12-l7",
    level: "A1.2",
    type: "reading",
    context: "Ich bin Lena und bin Krankenschwester. Ich arbeite im Krankenhaus, oft auch nachts und am Wochenende. Das ist manchmal schwer, aber ich mag meinen Beruf. Die Patienten sind immer sehr dankbar.",
    question: "Wann muss Lena manchmal arbeiten?",
    // original correct: "Auch nachts und am Wochenende" (was index 2) → move to index 3
    options: ["Nur am Morgen", "Nur am Wochenende", "Nie am Wochenende", "Auch nachts und am Wochenende"],
    correctIndex: 3,
  },
  {
    id: "a12-l8",
    level: "A1.2",
    type: "reading",
    context: "Liebe Frau Schmidt, ich kann leider morgen nicht zum Deutschkurs kommen. Meine Tochter ist krank und ich muss mit ihr zum Arzt gehen. Kann ich die Hausaufgaben per E-Mail bekommen? Vielen Dank! Mit freundlichen Grüßen, Maria Petrov",
    question: "Warum schreibt Maria diese E-Mail?",
    // original correct: "Sie kann nicht zum Kurs kommen." (was index 1) → move to index 0
    options: ["Sie kann nicht zum Kurs kommen.", "Sie möchte den Kurs wechseln.", "Sie braucht einen Arzt.", "Sie sucht eine neue Lehrerin."],
    correctIndex: 0,
  },
  {
    id: "a12-k9",
    level: "A1.2",
    type: "communication",
    question: "Dein Kind hat Fieber. Du rufst in der Schule an. Was sagst du?",
    // original correct: "Mein Kind ist krank und kann heute leider nicht kommen." (was index 1) → keep at index 1
    options: [
      "Mein Kind kommt heute nicht, es hat keine Lust.",
      "Mein Kind ist krank und kann heute leider nicht kommen.",
      "Mein Kind kommt später.",
      "Geben Sie meinem Kind keine Hausaufgaben."
    ],
    correctIndex: 1,
  },
  {
    id: "a12-k10",
    level: "A1.2",
    type: "communication",
    question: "Du bist im Geschäft. Die Verkäuferin fragt: \"Kann ich Ihnen helfen?\" Du suchst eine Winterjacke. Was sagst du?",
    // original correct: "Ja, ich suche eine warme Jacke." (was index 2) → keep at index 2
    options: ["Nein, danke.", "Ich brauche nichts.", "Ja, ich suche eine warme Jacke.", "Das Geschäft ist schön."],
    correctIndex: 2,
  },

  // ===== A2.1 (10 questions) - target correctIndex: 2,3,0,1,2,3,0,1,2,3 =====
  {
    id: "a21-v1",
    level: "A2.1",
    type: "vocabulary",
    question: "Ich habe starke Kopfschmerzen. Ich muss zum ___ gehen.",
    // original correct: "Arzt" (was index 1) → move to index 2
    options: ["Lehrer", "Kellner", "Arzt", "Friseur"],
    correctIndex: 2,
  },
  {
    id: "a21-v2",
    level: "A2.1",
    type: "vocabulary",
    question: "Nach dem Essen gehen wir spazieren. Ich brauche frische ___.",
    // original correct: "Luft" (was index 1) → move to index 3
    options: ["Wasser", "Essen", "Kleidung", "Luft"],
    correctIndex: 3,
  },
  {
    id: "a21-v3",
    level: "A2.1",
    type: "vocabulary",
    question: "Meine Oma hat bald Geburtstag. Ich möchte ihr einen Blumenstrauß ___.",
    // original correct: "schenken" (was index 2) → move to index 0
    options: ["schenken", "kochen", "schreiben", "lesen"],
    correctIndex: 0,
  },
  {
    id: "a21-g4",
    level: "A2.1",
    type: "grammar",
    question: "Warum lernst du Deutsch? - ___ ich in Deutschland arbeiten möchte.",
    // original correct: "Weil" (was index 2) → move to index 1
    options: ["Denn", "Weil", "Dann", "Aber"],
    correctIndex: 1,
  },
  {
    id: "a21-g5",
    level: "A2.1",
    type: "grammar",
    question: "Er ___ doch früher immer Arzt werden. Warum hat er Informatik studiert?",
    // original correct: "wollte" (was index 0) → move to index 2
    options: ["will", "wolltet", "wollte", "wollt"],
    correctIndex: 2,
  },
  {
    id: "a21-g6",
    level: "A2.1",
    type: "grammar",
    question: "Wir kommen dich am Samstag besuchen. Ich freue ___ schon!",
    // original correct: "mich" (was index 1) → move to index 3
    options: ["sich", "dir", "mir", "mich"],
    correctIndex: 3,
  },
  {
    id: "a21-l7",
    level: "A2.1",
    type: "reading",
    context: "Mein Name ist Kemal. Ich bin vor zwei Jahren aus der Türkei nach Wien gekommen. Am Anfang war alles schwer, besonders die Sprache. Jetzt besuche ich einen Deutschkurs und habe viele Freunde gefunden.",
    question: "Was war für Kemal am Anfang das größte Problem?",
    // original correct: "Die Sprache." (was index 2) → move to index 0
    options: ["Die Sprache.", "Keine Wohnung.", "Kein Geld.", "Keine Arbeit."],
    correctIndex: 0,
  },
  {
    id: "a21-l8",
    level: "A2.1",
    type: "reading",
    context: "Liebe Gäste, unser Restaurant ist vom 24. Dezember bis 2. Januar geschlossen. Ab dem 3. Januar sind wir wieder für Sie da. Frohe Feiertage! Ihr Restaurant-Team",
    question: "Wann kann man wieder ins Restaurant gehen?",
    // original correct: "Ab dem 3. Januar" (was index 2) → move to index 1
    options: ["Am 24. Dezember", "Ab dem 3. Januar", "Am 2. Januar", "Am 1. Januar"],
    correctIndex: 1,
  },
  {
    id: "a21-k9",
    level: "A2.1",
    type: "communication",
    question: "Im Zug liegt eine Tasche neben dem Fenster. Du möchtest dort sitzen. Was sagst du?",
    // original correct: "Entschuldigung, ist hier noch frei?" (was index 1) → move to index 2
    options: [
      "Das ist mein Platz!",
      "Ich will hier sitzen.",
      "Entschuldigung, ist hier noch frei?",
      "Nehmen Sie die Tasche weg!"
    ],
    correctIndex: 2,
  },
  {
    id: "a21-k10",
    level: "A2.1",
    type: "communication",
    question: "Dein Freund hat eine neue Arbeit gefunden. Was sagst du?",
    // original correct: "Das freut mich! Herzlichen Glückwunsch!" (was index 2) → move to index 3
    options: ["Das tut mir leid.", "Gute Besserung!", "Schade!", "Das freut mich! Herzlichen Glückwunsch!"],
    correctIndex: 3,
  },

  // ===== A2.2 (10 questions) - target correctIndex: 3,0,1,2,3,0,1,2,3,0 =====
  {
    id: "a22-v1",
    level: "A2.2",
    type: "vocabulary",
    question: "Ich suche einen Job. Deshalb lese ich jeden Tag die ___ in der Zeitung.",
    // original correct: "Stellenanzeigen" (was index 1) → move to index 3
    options: ["Nachrichten", "Wetterbericht", "Kochrezepte", "Stellenanzeigen"],
    correctIndex: 3,
  },
  {
    id: "a22-v2",
    level: "A2.2",
    type: "vocabulary",
    question: "Wir haben die Wohnung letzten Monat ___. Jetzt zahlen wir 600 Euro Miete.",
    // original correct: "gemietet" (was index 1) → move to index 0
    options: ["gemietet", "gekauft", "verkauft", "gebaut"],
    correctIndex: 0,
  },
  {
    id: "a22-v3",
    level: "A2.2",
    type: "vocabulary",
    question: "Ich habe meine ___ verloren. Jetzt komme ich nicht in meine Wohnung!",
    // original correct: "Schlüssel" (was index 2) → move to index 1
    options: ["Tasche", "Schlüssel", "Brille", "Handy"],
    correctIndex: 1,
  },
  {
    id: "a22-g4",
    level: "A2.2",
    type: "grammar",
    question: "Hast du dir schon ___ Computer gekauft? - Nein, ich habe zu wenig Geld.",
    // original correct: "einen neuen" (was index 2) → move to index 2 (keep)
    options: ["ein neuer", "ein neue", "einen neuen", "einem neuen"],
    correctIndex: 2,
  },
  {
    id: "a22-g5",
    level: "A2.2",
    type: "grammar",
    question: "In Deutschland ___ der Müll getrennt!",
    // original correct: "wird" (was index 2) → move to index 3
    options: ["ist", "hat", "soll", "wird"],
    correctIndex: 3,
  },
  {
    id: "a22-g6",
    level: "A2.2",
    type: "grammar",
    question: "Ich würde gern wissen, ___ ich auch in Raten bezahlen kann.",
    // original correct: "ob" (was index 1) → move to index 0
    options: ["ob", "dass", "wenn", "weil"],
    correctIndex: 0,
  },
  {
    id: "a22-l7",
    level: "A2.2",
    type: "reading",
    context: "Liebe Mieter, am Donnerstag wird das Wasser von 8.00 bis 14.00 Uhr abgestellt. Bitte sammeln Sie vorher genug Wasser. Ihre Hausverwaltung.",
    question: "Was sollen die Mieter tun?",
    // original correct: "Vorher Wasser sammeln." (was index 1) → move to index 1 (keep)
    options: ["Zu Hause bleiben.", "Vorher Wasser sammeln.", "Die Hausverwaltung anrufen.", "Kein Wasser benutzen."],
    correctIndex: 1,
  },
  {
    id: "a22-l8",
    level: "A2.2",
    type: "reading",
    context: "Hallo Jan, ich bin nächste Woche in Berlin! Hast du am Mittwoch Zeit? Wir könnten zusammen essen gehen. Ich kenne ein tolles italienisches Restaurant in Kreuzberg. Sag mir Bescheid! Viele Grüße, Petra",
    question: "Was möchte Petra?",
    // original correct: "Mit Jan essen gehen" (was index 1) → move to index 2
    options: ["Nach Italien fahren", "Ein Restaurant eröffnen", "Mit Jan essen gehen", "In Berlin wohnen"],
    correctIndex: 2,
  },
  {
    id: "a22-k9",
    level: "A2.2",
    type: "communication",
    question: "Du möchtest eine Hose anprobieren. Was sagst du?",
    // original correct: "Kann ich die Hose anprobieren?" (was index 2) → move to index 3
    options: ["Ich nehme die Hose.", "Was kostet die Hose?", "Die Hose ist zu teuer.", "Kann ich die Hose anprobieren?"],
    correctIndex: 3,
  },
  {
    id: "a22-k10",
    level: "A2.2",
    type: "communication",
    question: "Dein Nachbar macht abends immer laute Musik. Was sagst du?",
    // original correct: "Könnten Sie bitte die Musik leiser machen?" (was index 1) → move to index 0
    options: [
      "Könnten Sie bitte die Musik leiser machen?",
      "Ich rufe die Polizei!",
      "Ihre Musik ist schrecklich!",
      "Ich mag keine Musik."
    ],
    correctIndex: 0,
  },

  // ===== B1.1 (10 questions) - target correctIndex: 0,1,2,3,0,1,2,3,0,1 =====
  {
    id: "b11-v1",
    level: "B1.1",
    type: "vocabulary",
    question: "Sie hat eine Stelle als Ingenieurin bei Siemens ___.",
    // original correct: "bekommen" (was index 1) → move to index 0
    options: ["bekommen", "gesucht", "verloren", "gekündigt"],
    correctIndex: 0,
  },
  {
    id: "b11-v2",
    level: "B1.1",
    type: "vocabulary",
    question: "Die ___ im Krankenhaus war lang, aber jetzt bin ich wieder gesund.",
    // original correct: "Behandlung" (was index 0) → keep at index 1... move to index 1
    options: ["Veranstaltung", "Behandlung", "Ausbildung", "Bewerbung"],
    correctIndex: 1,
  },
  {
    id: "b11-v3",
    level: "B1.1",
    type: "vocabulary",
    question: "Die Firma hat eine neue Mitarbeiterin ___. Sie fängt nächste Woche an.",
    // original correct: "eingestellt" (was index 1) → move to index 2
    options: ["gekündigt", "entlassen", "eingestellt", "ausgebildet"],
    correctIndex: 2,
  },
  {
    id: "b11-g4",
    level: "B1.1",
    type: "grammar",
    question: "Lisa hat sich getrennt. - Was?! ___ sie sich erst letztes Jahr verlobt haben!",
    // original correct: "Obwohl" (was index 1) → move to index 3
    options: ["Weil", "Damit", "Falls", "Obwohl"],
    correctIndex: 3,
  },
  {
    id: "b11-g5",
    level: "B1.1",
    type: "grammar",
    question: "Wenn ich mehr Geld ___, ___ ich eine Weltreise machen.",
    // original correct: "hätte ... würde" (was index 1) → move to index 0
    options: ["hätte ... würde", "habe ... werde", "hatte ... wollte", "haben ... werden"],
    correctIndex: 0,
  },
  {
    id: "b11-g6",
    level: "B1.1",
    type: "grammar",
    question: "Die Wohnung ist ___ groß, ___ sie ist sehr dunkel.",
    // original correct: "zwar ... aber" (was index 2) → move to index 1
    options: ["so ... dass", "zwar ... aber", "nicht nur ... sondern auch", "entweder ... oder"],
    correctIndex: 1,
  },
  {
    id: "b11-l7",
    level: "B1.1",
    type: "reading",
    context: "Immer mehr junge Deutsche entscheiden sich für ein Auslandsjahr. Sie wollen andere Kulturen kennenlernen und ihre Sprachkenntnisse verbessern. Kritiker meinen allerdings, dass die jungen Leute den Anschluss an der Uni verlieren könnten.",
    question: "Was sagen die Kritiker?",
    // original correct: "Die jungen Leute könnten Probleme beim Studienstart bekommen." (was index 1) → move to index 2
    options: [
      "Ein Auslandsjahr ist zu teuer.",
      "Sprachkenntnisse sind nicht wichtig.",
      "Die jungen Leute könnten Probleme beim Studienstart bekommen.",
      "Man sollte lieber in Deutschland bleiben."
    ],
    correctIndex: 2,
  },
  {
    id: "b11-l8",
    level: "B1.1",
    type: "reading",
    context: "Homeoffice hat viele Vorteile: Man spart Zeit und kann flexibler arbeiten. Allerdings fehlt vielen der direkte Kontakt zu Kollegen. Studien zeigen, dass die Produktivität steigt, die Kreativität im Team aber sinkt.",
    question: "Was ist ein Nachteil vom Homeoffice?",
    // original correct: "Der Kontakt zu Kollegen fehlt." (was index 2) → move to index 3
    options: ["Man arbeitet weniger.", "Man spart keine Zeit.", "Die Produktivität sinkt.", "Der Kontakt zu Kollegen fehlt."],
    correctIndex: 3,
  },
  {
    id: "b11-k9",
    level: "B1.1",
    type: "communication",
    question: "Dein Kollege bittet dich, am Samstag zu arbeiten. Du kannst nicht. Was sagst du?",
    // original correct: "Das geht leider nicht, ich habe schon etwas vor." (was index 1) → move to index 0
    options: [
      "Das geht leider nicht, ich habe schon etwas vor.",
      "Nein, ich will nicht.",
      "Frag jemand anderen.",
      "Samstag arbeite ich nie."
    ],
    correctIndex: 0,
  },
  {
    id: "b11-k10",
    level: "B1.1",
    type: "communication",
    question: "Du hast online das falsche Produkt bekommen. Was schreibst du?",
    // original correct: "Leider habe ich einen falschen Artikel erhalten. Könnten Sie den richtigen zusenden?" (was index 1) → keep at index 1
    options: [
      "Ich bin wütend! Geld zurück!",
      "Leider habe ich einen falschen Artikel erhalten. Könnten Sie den richtigen zusenden?",
      "Das Produkt ist schlecht.",
      "Ich bestelle nie wieder bei Ihnen."
    ],
    correctIndex: 1,
  },

  // ===== B1.2 (10 questions) - target correctIndex: 1,2,3,0,1,2,3,0,1,2 =====
  {
    id: "b12-v1",
    level: "B1.2",
    type: "vocabulary",
    question: "Die Regierung hat beschlossen, das Gesetz zu ___.",
    // original correct: "ändern" (was index 0) → move to index 1
    options: ["löschen", "ändern", "vergessen", "verlieren"],
    correctIndex: 1,
  },
  {
    id: "b12-v2",
    level: "B1.2",
    type: "vocabulary",
    question: "Er hat den Vertrag unterschrieben, ohne das ___ zu lesen.",
    // original correct: "Kleingedruckte" (was index 1) → move to index 2
    options: ["Rezept", "Formular", "Kleingedruckte", "Zeugnis"],
    correctIndex: 2,
  },
  {
    id: "b12-v3",
    level: "B1.2",
    type: "vocabulary",
    question: "Nach langen ___ haben sich die Firmen auf einen Preis geeinigt.",
    // original correct: "Verhandlungen" (was index 1) → move to index 3
    options: ["Bewerbungen", "Vorstellungen", "Veranstaltungen", "Verhandlungen"],
    correctIndex: 3,
  },
  {
    id: "b12-g4",
    level: "B1.2",
    type: "grammar",
    question: "___ länger ich nachdenke, ___ wütender werde ich.",
    // original correct: "Je ... desto" (was index 2) → move to index 0
    options: ["Je ... desto", "Zwar ... aber", "Entweder ... oder", "Sowohl ... als auch"],
    correctIndex: 0,
  },
  {
    id: "b12-g5",
    level: "B1.2",
    type: "grammar",
    question: "___ ich hier die Wohnung putze, sitzt du einfach da und liest!",
    // original correct: "Während" (was index 1) → keep at index 1
    options: ["Nachdem", "Während", "Bevor", "Sobald"],
    correctIndex: 1,
  },
  {
    id: "b12-g6",
    level: "B1.2",
    type: "grammar",
    question: "Ich spreche leider ___ Chinesisch ___ Japanisch. Ich habe mich immer auf Englisch unterhalten.",
    // original correct: "weder ... noch" (was index 2) → move to index 2 (keep)
    options: ["sowohl ... als auch", "entweder ... oder", "weder ... noch", "nicht nur ... sondern auch"],
    correctIndex: 2,
  },
  {
    id: "b12-l7",
    level: "B1.2",
    type: "reading",
    context: "Sehr geehrte Damen und Herren, hiermit kündige ich meinen Vertrag zum nächstmöglichen Zeitpunkt. Der Grund ist, dass ich ein Jobangebot aus dem Ausland angenommen habe. Ich bedanke mich für die gute Zusammenarbeit. Mit freundlichen Grüßen, Stefan Müller.",
    question: "Warum schreibt Herr Müller diesen Brief?",
    // original correct: "Er will seinen Job kündigen." (was index 1) → move to index 3
    options: ["Er möchte mehr Gehalt.", "Er beschwert sich.", "Er bewirbt sich um eine Stelle.", "Er will seinen Job kündigen."],
    correctIndex: 3,
  },
  {
    id: "b12-l8",
    level: "B1.2",
    type: "reading",
    context: "Ab dem 1. Juni gelten neue Regeln für das Homeoffice. Sie dürfen maximal zwei Tage pro Woche von zu Hause arbeiten. An den restlichen Tagen ist Ihre Anwesenheit im Büro erforderlich. Besprechen Sie die genauen Tage mit Ihrem Teamleiter. - Die Geschäftsführung",
    question: "Wie oft darf man von zu Hause arbeiten?",
    // original correct: "Höchstens zwei Tage pro Woche" (was index 1) → move to index 0
    options: ["Höchstens zwei Tage pro Woche", "Jeden Tag", "Nur am Freitag", "Gar nicht mehr"],
    correctIndex: 0,
  },
  {
    id: "b12-k9",
    level: "B1.2",
    type: "communication",
    question: "Du möchtest in einer Diskussion höflich widersprechen. Was sagst du?",
    // original correct: "Da bin ich anderer Meinung, weil..." (was index 1) → keep at index 1
    options: [
      "Das ist falsch!",
      "Da bin ich anderer Meinung, weil...",
      "Das stimmt nicht!",
      "Du hast keine Ahnung!"
    ],
    correctIndex: 1,
  },
  {
    id: "b12-k10",
    level: "B1.2",
    type: "communication",
    question: "Dein Freund hat eine Prüfung nicht bestanden. Was sagst du?",
    // original correct: "Das tut mir leid. Du schaffst das beim nächsten Mal!" (was index 1) → move to index 2
    options: [
      "Das war ja klar.",
      "Hättest du mehr gelernt!",
      "Das tut mir leid. Du schaffst das beim nächsten Mal!",
      "Nicht so schlimm."
    ],
    correctIndex: 2,
  },

  // ===== B2.1 (10 questions) - target correctIndex: 2,3,0,1,2,3,0,1,2,3 =====
  {
    id: "b21-v1",
    level: "B2.1",
    type: "vocabulary",
    question: "Die Verhandlungen sind ___. Man konnte sich nicht einigen.",
    // original correct: "gescheitert" (was index 1) → move to index 2
    options: ["gelungen", "entstanden", "gescheitert", "erschienen"],
    correctIndex: 2,
  },
  {
    id: "b21-v2",
    level: "B2.1",
    type: "vocabulary",
    question: "Das Thema ist ___. Die einen sehen Freiheit, die anderen Risiko.",
    // original correct: "umstritten" (was index 1) → move to index 3
    options: ["eindeutig", "offensichtlich", "selbstverständlich", "umstritten"],
    correctIndex: 3,
  },
  {
    id: "b21-v3",
    level: "B2.1",
    type: "vocabulary",
    question: "Es würde sich bestimmt ___, eine Bewerbung zu schicken.",
    // original correct: "lohnen" (was index 0) → keep at index 0
    options: ["lohnen", "ändern", "unterscheiden", "empfehlen"],
    correctIndex: 0,
  },
  {
    id: "b21-g4",
    level: "B2.1",
    type: "grammar",
    question: "Der Sprecher erklärte, die Regierung ___ bereits an einer Lösung.",
    // original correct: "arbeite" (was index 2) → move to index 1
    options: ["arbeitet", "arbeite", "arbeitete", "würde arbeiten"],
    correctIndex: 1,
  },
  {
    id: "b21-g5",
    level: "B2.1",
    type: "grammar",
    question: "Die stark ___ Computerspiel-Industrie macht größere Umsätze als die Filmindustrie.",
    // original correct: "wachsende" (was index 1) → move to index 2
    options: ["wachsend", "wachsenden", "wachsende", "wachsender"],
    correctIndex: 2,
  },
  {
    id: "b21-g6",
    level: "B2.1",
    type: "grammar",
    question: "Das ist ein Problem, ___ Lösung nicht einfach ist.",
    // original correct: "dessen" (was index 2) → move to index 3
    options: ["das", "die", "dem", "dessen"],
    correctIndex: 3,
  },
  {
    id: "b21-l7",
    level: "B2.1",
    type: "reading",
    context: "Studien haben ergeben, dass Charakter und Dauer eines Geräusches die Wahrnehmung beeinflussen: Den Ton eines Alarms empfinden viele als unangenehm, während gleichmäßige Hintergrundgeräusche beruhigend wirken. Forscher vermuten, dass das Gehirn unregelmäßige Geräusche als potenzielle Gefahr einstuft.",
    question: "Warum empfinden Menschen Alarmtöne als unangenehm?",
    // original correct: "Weil das Gehirn unregelmäßige Geräusche als Gefahr deutet." (was index 2) → move to index 0
    options: [
      "Weil das Gehirn unregelmäßige Geräusche als Gefahr deutet.",
      "Weil sie zu laut sind.",
      "Weil sie zu lange dauern.",
      "Weil sie an schlechte Erfahrungen erinnern."
    ],
    correctIndex: 0,
  },
  {
    id: "b21-l8",
    level: "B2.1",
    type: "reading",
    context: "Eine Umfrage zeigt, dass 68 Prozent der Befragten die zunehmende Digitalisierung positiv bewerten. Gleichzeitig äußern 45 Prozent Bedenken hinsichtlich des Datenschutzes. Besonders die ältere Generation steht digitalen Neuerungen skeptischer gegenüber.",
    question: "Was zeigt die Umfrage?",
    // original correct: "Die Mehrheit ist positiv, aber viele sorgen sich um Datenschutz." (was index 1) → keep at index 1
    options: [
      "Alle finden Digitalisierung gut.",
      "Die Mehrheit ist positiv, aber viele sorgen sich um Datenschutz.",
      "Ältere Menschen nutzen mehr Technologie.",
      "Datenschutz ist kein Problem."
    ],
    correctIndex: 1,
  },
  {
    id: "b21-k9",
    level: "B2.1",
    type: "communication",
    question: "Jemand sagt etwas, dem Sie nur teilweise zustimmen. Was sagen Sie?",
    // original correct: "Ihr Argument leuchtet mir ein, aber man könnte auch einwenden, dass..." (was index 1) → move to index 2
    options: [
      "Das stimmt überhaupt nicht.",
      "Ja, Sie haben völlig recht.",
      "Ihr Argument leuchtet mir ein, aber man könnte auch einwenden, dass...",
      "Das ist mir egal."
    ],
    correctIndex: 2,
  },
  {
    id: "b21-k10",
    level: "B2.1",
    type: "communication",
    question: "Ein Kollege hat einen schweren Verlust erlitten und kommt zurück ins Büro. Was sagen Sie?",
    // original correct: "Es tut mir sehr leid. Wenn du reden möchtest, bin ich für dich da." (was index 3) → keep at index 3
    options: [
      "Was genau ist passiert? Erzähl mal!",
      "Das Leben geht weiter.",
      "Jetzt konzentrier dich auf die Arbeit.",
      "Es tut mir sehr leid. Wenn du reden möchtest, bin ich für dich da."
    ],
    correctIndex: 3,
  },

  // ===== B2.2 (10 questions) - target correctIndex: 3,0,1,2,3,0,1,2,3,0 =====
  {
    id: "b22-v1",
    level: "B2.2",
    type: "vocabulary",
    question: "Er hat die Kritik nicht persönlich genommen, sondern sehr ___ reagiert.",
    // original correct: "sachlich" (was index 1) → move to index 3
    options: ["empfindlich", "gründlich", "ausführlich", "sachlich"],
    correctIndex: 3,
  },
  {
    id: "b22-v2",
    level: "B2.2",
    type: "vocabulary",
    question: "Das Unternehmen musste 200 Mitarbeiter ___, weil es zu wenig Aufträge gab.",
    // original correct: "entlassen" (was index 2) → move to index 0
    options: ["entlassen", "bewerben", "anstellen", "ausbilden"],
    correctIndex: 0,
  },
  {
    id: "b22-v3",
    level: "B2.2",
    type: "vocabulary",
    question: "Die Studie ___ die These, dass regelmäßige Bewegung das Wohlbefinden steigert.",
    // original correct: "bestätigt" (was index 1) → keep at index 1
    options: ["widerspricht", "bestätigt", "bezweifelt", "ignoriert"],
    correctIndex: 1,
  },
  {
    id: "b22-g4",
    level: "B2.2",
    type: "grammar",
    question: "Er tat so, ___ er nichts davon gewusst hätte.",
    // original correct: "als ob" (was index 1) → move to index 2
    options: ["ob", "als", "als ob", "wie"],
    correctIndex: 2,
  },
  {
    id: "b22-g5",
    level: "B2.2",
    type: "grammar",
    question: "Hätte ich früher angefangen zu sparen, ___ ich mir jetzt eine Wohnung leisten.",
    // original correct: "könnte" (was index 1) → move to index 3
    options: ["würde", "sollte", "müsste", "könnte"],
    correctIndex: 3,
  },
  {
    id: "b22-g6",
    level: "B2.2",
    type: "grammar",
    question: "Die Studie, ___ Ergebnisse letzte Woche veröffentlicht wurden, sorgt für Diskussionen.",
    // original correct: "deren" (was index 1) → move to index 0
    options: ["deren", "die", "denen", "dessen"],
    correctIndex: 0,
  },
  {
    id: "b22-l7",
    level: "B2.2",
    type: "reading",
    context: "Es gibt immer mehr Agenturen, die akademisches Ghostwriting anbieten. Gegen Bezahlung werden Hausarbeiten professionell geschrieben. Das Thema ist umstritten. Aber Befürworter weisen darauf hin, dass es kein Gesetz gibt, das die angebotene Dienstleistung verbietet.",
    question: "Was sagen die Befürworter von Ghostwriting?",
    // original correct: "Es ist rechtlich nicht verboten." (was index 2) → move to index 1
    options: [
      "Es ist moralisch vertretbar.",
      "Es ist rechtlich nicht verboten.",
      "Studenten haben zu wenig Zeit.",
      "Die Qualität ist besser."
    ],
    correctIndex: 1,
  },
  {
    id: "b22-l8",
    level: "B2.2",
    type: "reading",
    context: "In einer alternden Gesellschaft sinkt die Zahl der Beitragszahler, während die Ausgaben für Renten und Pflege steigen. Experten fordern daher eine grundlegende Reform, die sowohl die Beitragsstruktur als auch das Renteneintrittsalter berücksichtigt.",
    question: "Was fordern die Experten?",
    // original correct: "Eine umfassende Reform des Sozialsystems." (was index 2) → move to index 2 (keep)
    options: [
      "Höhere Renten für alle.",
      "Mehr Beitragszahler.",
      "Eine umfassende Reform des Sozialsystems.",
      "Ein niedrigeres Renteneintrittsalter."
    ],
    correctIndex: 2,
  },
  {
    id: "b22-k9",
    level: "B2.2",
    type: "communication",
    question: "Sie müssen per E-Mail eine dringende Bitte formulieren. Welche Formulierung passt am besten?",
    // original correct: "Ich wäre Ihnen sehr verbunden, wenn Sie sich dieser Angelegenheit annehmen könnten." (was index 1) → move to index 3
    options: [
      "Machen Sie das sofort!",
      "Können Sie das mal machen?",
      "Sie müssen das erledigen.",
      "Ich wäre Ihnen sehr verbunden, wenn Sie sich dieser Angelegenheit annehmen könnten."
    ],
    correctIndex: 3,
  },
  {
    id: "b22-k10",
    level: "B2.2",
    type: "communication",
    question: "Ein Kollege schlägt etwas vor, das Ihrer Meinung nach nicht funktionieren wird. Wie reagieren Sie diplomatisch?",
    // original correct: "Der Ansatz ist interessant, allerdings sehe ich bei der Umsetzung einige Herausforderungen." (was index 1) → move to index 0
    options: [
      "Der Ansatz ist interessant, allerdings sehe ich bei der Umsetzung einige Herausforderungen.",
      "Das wird nie funktionieren.",
      "Haben Sie darüber überhaupt nachgedacht?",
      "Mir ist das egal, machen Sie was Sie wollen."
    ],
    correctIndex: 0,
  },
];

export function getQuestionsForLevel(level: HalfLevel): Question[] {
  return questions.filter((q) => q.level === level);
}
