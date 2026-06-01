/**
 * B1.2 — Schreiben lekcije (3 dela B1 ispita) iz Cornelsen Prüfungstraining.
 * Redemittel doslovno na nemačkom + prevod; Cornelsen primeri zadataka.
 * Dodaju se kao nove lekcije (modul Schreiben). Pravila: ekavica, "ti" forma.
 */
import type { Section } from "../src/lib/section-types";

export interface B12Lesson {
  title: string;
  vimeoId: string | null;
  sections: Section[];
}

export const LESSONS: B12Lesson[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // Schreiben Teil 1 — neformalni mejl prijatelju (~80 reči)
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: "Schreiben Teil 1 – Informelle E-Mail",
    vimeoId: null,
    sections: [
      { type: "badge", module: "Modul 9 · Schreiben", category: "schreiben" },
      {
        type: "text",
        style: "info",
        content:
          "Prvi deo pismenog ispita je **neformalni mejl prijatelju** (du-forma). Pišeš oko **80 reči**, obrađuješ **tri tačke** (Leitpunkte): nešto opišeš (*beschreiben*), obrazložiš (*begründen*) i daš predlog (*einen Vorschlag machen*). Imaš ~20 minuta, nosi do 40 poena.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Struktura mejla\n\n1. **Anrede** (oslovljavanje imenom)\n2. **Einleitung** (kratak uvod)\n3. **Hauptteil** — tri tačke redom, po 2-3 rečenice\n4. **Schluss** (zaključna rečenica)\n5. **Grußformel** + tvoje ime",
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "## Redemittel — gotove fraze (nemački · prevod)\n\n**Anrede:** *Liebe/Lieber [ime],* — Draga/Dragi… · *Hallo [ime],* — Zdravo…\n\n**Einleitung:** *wie geht es dir?* — kako si? · *ich möchte dir etwas erzählen* — htela bih nešto da ti ispričam · *es gibt etwas Neues* — ima nešto novo",
      },
      {
        type: "table",
        headers: ["Funkcija", "Redemittel (DE)", "Prevod"],
        rows: [
          ["beschreiben", "Gestern war ich … / Es geht gut / nicht so gut.", "Juče sam bio/la… / Dobro je / nije baš dobro."],
          ["begründen", "…, weil / denn / deshalb … / Ich würde mich freuen, wenn …", "…, jer / zato … / Bilo bi mi drago kad bi…"],
          ["Vorschlag", "Ich schlage vor, dass … / Wollen wir …? / Sollen wir …?", "Predlažem da… / Hoćemo li…? / Da li da…?"],
        ],
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "**Schluss:** *Sag bitte Bescheid, ob …* — javi mi da li… · *Bitte antworte mir bald.* — odgovori mi uskoro · *Ruf mich an.* — pozovi me\n\n**Grußformel:** *Bis bald* · *Viele Grüße* · *Liebe Grüße* · *Herzliche Grüße* — zatim *dein/deine [ime]*",
      },
      {
        type: "text",
        style: "uebung",
        content:
          "## Zadatak (Cornelsen primer)\n\n*Ihr Freund Carsten liegt im Krankenhaus, weil er sich bei einem Unfall das rechte Bein gebrochen hat. Sie haben ihn gestern besucht und schreiben einem Freund / einer Freundin, der/die Carsten auch kennt.*\n\n- **Beschreiben Sie:** Wie geht es Carsten?\n- **Begründen Sie:** Was braucht er in seiner Situation?\n- **Machen Sie einen Vorschlag** für einen gemeinsamen Besuch.\n\n*Schreiben Sie eine E-Mail (ca. 80 Wörter). Schreiben Sie etwas zu allen drei Punkten. Achten Sie auf den Textaufbau (Anrede, Einleitung, Reihenfolge der Inhaltspunkte, Schluss).*",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Beleške za ovaj zadatak (Stichpunkte)\n\n- Carsten Unfall – im Krankenhaus besucht – geht gut – Krankenhaus o.k., aber langweilig\n- braucht etwas Unterhaltung: Buch, Zeitschrift oder MP3-Player\n- Vorschlag: zusammen besuchen – etwas mitbringen – Sonntag? – sag Bescheid",
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "## Musterlösung — uzorni mejl (Cornelsen)\n\nOvako izgleda dobar odgovor na sličan zadatak (prijatelj Manuel pao na ispitu):\n\n*Lieber Thomas,*\n*hast du schon gehört, dass Manuel seine Prüfung nicht bestanden hat? Ich habe ihn gestern getroffen, es geht ihm wirklich nicht gut. Er ist traurig, dass er die Prüfung wiederholen muss. Ich weiß, er hat viel gelernt, aber das war nicht genug. Vielleicht braucht er Hilfe. Ich habe nun eine Idee: Können wir ihm nicht bei der Vorbereitung helfen? Zum Beispiel könnten wir uns am Montagabend bei mir treffen und gemeinsam lernen. Was meinst du?*\n*Ciao*\n*Anna*",
      },
      {
        type: "spoiler",
        title: "Provera — pre nego što predaš",
        items: [
          { question: "Da li si oslovio/la osobu imenom (Anrede) i potpisao/la se na kraju?", answer: "Mora oba — bez toga gubiš poene na koherentnosti." },
          { question: "Da li si obradio/la SVE tri tačke (beschreiben, begründen, Vorschlag)?", answer: "Da — svaka tačka nosi poene." },
          { question: "Du ili Sie u ovom delu?", answer: "Du — prijatelju se obraćaš sa du i imenom." },
        ],
      },
      {
        type: "text",
        style: "default",
        content:
          "📌 **Savet:** ne počinji svaku rečenicu istom rečju (npr. stalno „Ich…“). Variraj — *Gestern… / Außerdem… / Vielleicht…* To diže ocenu za koherentnost.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Schreiben Teil 2 — forum-komentar / mišljenje (~80 reči)
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: "Schreiben Teil 2 – Meinung im Forum",
    vimeoId: null,
    sections: [
      { type: "badge", module: "Modul 9 · Schreiben", category: "schreiben" },
      {
        type: "text",
        style: "info",
        content:
          "Drugi deo je **komentar u forumu / gostinjskoj knjizi** gde iznosiš svoje **mišljenje** o zadatoj temi. Oko **80 reči**, ~25 minuta, do 40 poena. Dat ti je tuđi komentar — na njega *ne moraš* da se osvrneš, ali možeš.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Šta treba da uradiš\n\nIzraziš mišljenje i potkrepiš ga: *beschreiben, begründen, erläutern* (objasniti), *vergleichen* (uporediti), *rechtfertigen* (opravdati). Cilj: jasan stav + argumenti.",
      },
      {
        type: "table",
        headers: ["Funkcija", "Redemittel (DE)", "Prevod"],
        rows: [
          ["uvod / osvrt", "Das Thema … finde ich sehr wichtig.", "Temu… smatram veoma važnom."],
          ["osvrt na komentar", "Ich möchte etwas zum Kommentar von … schreiben.", "Htela bih da napišem nešto na komentar od…"],
          ["suprotno mišljenje", "Im Gegensatz zu … bin ich der Meinung, dass …", "Za razliku od… ja smatram da…"],
          ["obrazloženje", "Ich bin dafür / dagegen, dass … / Es stört mich, dass …", "Za sam / protiv sam toga da… / Smeta mi što…"],
          ["objašnjenje", "Einerseits …, andererseits … / Die Folgen sind …", "S jedne strane…, s druge… / Posledice su…"],
          ["zaključak", "Meiner Meinung nach sollte man … / Eine Lösung wäre …", "Po mom mišljenju trebalo bi… / Rešenje bi bilo…"],
        ],
      },
      {
        type: "text",
        style: "uebung",
        content:
          "## Zadatak (Cornelsen primer) — „Gewalt im Fernsehen“\n\n*Sie haben im Fernsehen eine Dokumentarsendung zum Thema „Gewalt im Fernsehen“ gesehen. Im Online-Gästebuch der Sendung lesen Sie folgenden Kommentar:*\n\n> **Kirsten:** „Diese Dokumentation war wichtig, da die Gewalt in Fernsehsendungen immer mehr zunimmt. Nichts gegen Krimis – aber muss alles so deutlich und hart gezeigt werden? Das hat sicher einen schlechten Einfluss auf die Zuschauer. Also, was tun?“\n\n*Schreiben Sie nun Ihre Meinung (ca. 80 Wörter).*",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Beleške za ovaj zadatak (Stichpunkte)\n\n- Sendung wichtig – in Krimis viel Gewalt – finde ich nicht gut (schlechter Einfluss auf Kinder)\n- Andererseits: das Fernsehen kontrollieren? – wer? wo ist die Grenze? – Gefahr: alles wird kontrolliert",
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "## Musterlösung — uzorni komentar (Cornelsen)\n\nPrimer dobrog foruma-mišljenja na sličnu temu (treba li mladi sami da žive):\n\n*Das ist eine schwierige Frage! Klar, es ist wichtig, dass man unabhängig ist und seine eigene Wohnung hat. Aber die meisten jungen Leute haben nicht genug Geld, die Miete und die anderen Kosten zu bezahlen. Ich selbst bin mit 18 ausgezogen und wohne jetzt in einer WG. Aber ich kann verstehen, dass andere noch warten, bis sie mit der Ausbildung fertig sind und einen Job gefunden haben. Bis dahin bleiben sie bei den Eltern.*\n\n💡 Primeti strukturu: **stav → argument → lično iskustvo → druga strana → zaključak.**",
      },
      {
        type: "spoiler",
        title: "Provera",
        items: [
          { question: "Da li imaš JASAN stav (za ili protiv)?", answer: "Da — mišljenje mora biti prepoznatljivo, ne neodlučno." },
          { question: "Da li si dao/la bar dva argumenta?", answer: "Da — koristi weil/denn/deshalb i Einerseits…andererseits." },
          { question: "Da li si na ~80 reči?", answer: "Da — previše kratko gubi poene za ispunjenje zadatka." },
        ],
      },
      {
        type: "text",
        style: "default",
        content:
          "📌 **Savet:** struktura mišljenja koja uvek radi: **uvod (tema) → moj stav → 2 argumenta → zaključak/rešenje.** Iskoristi *Einerseits… andererseits…* da pokažeš da vidiš obe strane.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Schreiben Teil 3 — poluformalni mejl (Sie) (~40 reči)
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: "Schreiben Teil 3 – Formelle E-Mail",
    vimeoId: null,
    sections: [
      { type: "badge", module: "Modul 9 · Schreiben", category: "schreiben" },
      {
        type: "text",
        style: "info",
        content:
          "Treći deo je **kratak poluformalni mejl** osobi kojoj se obraćaš sa **Sie** (prezime). Oko **40 reči**, ~15 minuta, do 20 poena. Obično: zahvališ se, izviniš se i objasniš zašto ne možeš (npr. otkazivanje termina/poziva).",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Obavezno\n\n- **Anrede** (Sehr geehrte/r…) — ne zaboravi!\n- **Gruß am Schluss** (Mit freundlichen Grüßen) — ne zaboravi!\n- **Učtiv ton**, bez kolokvijalizama (ne *Mist, Quatsch*…)",
      },
      {
        type: "table",
        headers: ["Funkcija", "Redemittel (DE)", "Prevod"],
        rows: [
          ["Anrede", "Sehr geehrter Herr … / Sehr geehrte Frau …", "Poštovani gospodine… / Poštovana gospođo…"],
          ["zahvalnost", "Vielen Dank für Ihre E-Mail / Einladung.", "Hvala Vam na mejlu / pozivu."],
          ["izvinjenje", "Leider muss ich mich entschuldigen, da ich … / Es tut mir leid, aber leider …", "Nažalost moram da se izvinim, jer… / Žao mi je, ali nažalost…"],
          ["obrazloženje", "An diesem Termin bin ich verreist / muss ich arbeiten.", "Tog termina sam na putu / moram da radim."],
          ["pozdrav", "Mit freundlichen Grüßen / Freundliche Grüße", "S poštovanjem / Srdačan pozdrav"],
        ],
      },
      {
        type: "text",
        style: "uebung",
        content:
          "## Zadatak (Cornelsen primer)\n\n*Ihr Lehrer, Herr Möller, hat Sie zu einem internationalen Theatertreffen eingeladen. Zu dem Termin im August können Sie aber nicht kommen.*\n\n*Schreiben Sie an Herrn Möller. Bedanken Sie sich, entschuldigen Sie sich höflich und berichten Sie, warum Sie nicht teilnehmen können.*\n\n*Schreiben Sie eine E-Mail (ca. 40 Wörter). Vergessen Sie nicht die Anrede und den Gruß am Schluss.*",
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "## Musterlösungen — uzorni mejlovi (Cornelsen)\n\n**Otkazivanje termina za posao (bolest):**\n*Sehr geehrter Herr Leitner,*\n*ich muss Ihnen leider mitteilen, dass ich zu unserem Termin morgen nicht kommen kann, weil ich eine Grippe habe. Es tut mir sehr leid und ich hoffe, dass wir einen neuen Termin finden. Ich würde mich freuen, wenn ich nächste Woche zum Vorstellungsgespräch kommen könnte.*\n*Mit freundlichen Grüßen*\n*Jurij Sladek*\n\n**Prijava za učešće na manifestaciji:**\n*Sehr geehrter Herr Röder,*\n*ich habe gelesen, dass für die Veranstaltung „Kulturen der Welt“ Personen gesucht werden, die etwas über ihre Heimat berichten. Ich würde gerne teilnehmen. Ich komme aus Indonesien und könnte einen Vortrag über die Geschichte Indonesiens vorbereiten. Ich freue mich auf Ihre Antwort.*\n*Mit freundlichen Grüßen*\n*Susanna Sumaram*",
      },
      {
        type: "spoiler",
        title: "Provera",
        items: [
          { question: "Du ili Sie u ovom delu?", answer: "Sie — poluformalno, sa prezimenom. Nikad „euch/du“." },
          { question: "Da li imaš i Anrede i pozdrav na kraju?", answer: "Oba su obavezna — bez njih se oduzimaju poeni." },
          { question: "Da li si obradio/la sve: zahvalnost + izvinjenje + razlog?", answer: "Da — sve tri stvari iz zadatka." },
        ],
      },
      {
        type: "text",
        style: "default",
        content:
          "📌 **Savet:** 40 reči je malo — budi konkretan. Jedna rečenica po funkciji (zahvalnost / izvinjenje / razlog) + Anrede + pozdrav je dovoljno.",
      },
    ],
  },
];
