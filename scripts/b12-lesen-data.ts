/**
 * B1.2 — Lesen lekcije sa AUTENTIČNIM tekstom iz WP PDF-ova (skenovi pročitani OCR-om).
 * Freundschaften im Job (intervju T. Pieper), Duzen vs. Siezen (Leserbriefe),
 * Lese- und Hörverstehen (uparivanje uputstava A–G).
 * Pravila: originalni nemački tekst doslovno; objašnjenja/pitanja ekavica, "ti" forma.
 */
import type { Section } from "../src/lib/section-types";

export interface B12Lesson {
  title: string;
  vimeoId?: string | null;
  sections: Section[];
}

export const LESSONS: B12Lesson[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // Freundschaften im Job – Leseverstehen und Wortschatz   (autentičan tekst)
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: "Freundschaften im Job – Leseverstehen und Wortschatz",
    sections: [
      { type: "badge", module: "B1.2 · Unter Kollegen", category: "lesen" },
      {
        type: "text",
        style: "info",
        content:
          "Originalni tekst za čitanje sa ispita — intervju sa karijernom ekspertkinjom o prijateljstvima na poslu. Prvo pročitaj tekst, pa odgovori na pitanja. Obrati pažnju na konstrukciju **je … desto** koja se ovde pojavljuje više puta.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## B2 · Freundschaften im Job\n\n*Lesen Sie den Text. Was ist richtig?*\n\nFreundschaften im Job haben positiven Einfluss auf das Betriebsklima. Trotzdem warnt die Karriereexpertin **Tanja Pieper** vor zu engen Freundschaften am Arbeitsplatz.",
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "**— Frau Pieper, Studien zeigen, dass Freundschaften am Arbeitsplatz das Betriebsklima verbessern. Je angenehmer die Arbeitsatmosphäre ist, desto weniger Stress haben die Mitarbeiter und desto besser arbeiten sie. Warum warnen Sie trotzdem vor Freundschaften im Job?**\n\nNun ja, Freundschaften im Job können auch zu Problemen führen. So kann zum Beispiel die Freundin plötzlich zur Chefin werden.\n\n**— Privat- und Berufsleben sollten also getrennt werden?**\n\nNein, ein gutes Betriebsklima ist schon wichtig. Je kälter das Betriebsklima ist, desto schneller wechseln die Mitarbeiter den Betrieb und desto häufiger sind sie krank.\n\n**— Ist es nicht schwierig, immer auf Distanz zu bleiben?**\n\nEinen freundschaftlichen Umgang kann man nicht vermeiden. Aber der Kontakt muss trotzdem professionell bleiben.\n\n**— Und wie schafft man das?**\n\nZunächst sollte man gute Zusammenarbeit nicht mit Freundschaft verwechseln. Außerdem gibt es am Arbeitsplatz natürlich Tabuthemen, beispielsweise Beziehungsprobleme und Geldsorgen.",
      },
      {
        type: "spoiler",
        title: "Pitanja uz tekst — Was ist richtig? (Richtig / Falsch)",
        items: [
          { question: "1. Freundschaften im Job beeinflussen die Arbeitsleistung negativ.", answer: "Falsch — dobra atmosfera znači manje stresa i bolji rad (je angenehmer … desto besser)." },
          { question: "2. Frau Pieper meint, dass Freundschaften im Job auch problematisch sein können.", answer: "Richtig — „können auch zu Problemen führen“." },
          { question: "3. Angestellte, die sich am Arbeitsplatz wohlfühlen, melden sich häufiger krank.", answer: "Falsch — obrnuto: hladna atmosfera = češće bolovanje." },
          { question: "4. Auch sehr private Gesprächsthemen sind am Arbeitsplatz sinnvoll.", answer: "Falsch — postoje Tabuthemen (Beziehungsprobleme, Geldsorgen)." },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["das Betriebsklima", "atmosfera na poslu"],
          ["der Einfluss", "uticaj"],
          ["die Karriereexpertin", "stručnjakinja za karijeru"],
          ["der Umgang", "ophođenje, odnos"],
          ["vermeiden", "izbeći"],
          ["verwechseln", "pobrkati, zameniti"],
          ["das Tabuthema", "tabu tema"],
          ["die Geldsorgen", "novčane brige"],
          ["trennen", "razdvojiti"],
          ["professionell", "profesionalan"],
        ],
      },
      {
        type: "text",
        style: "uebung",
        content:
          "## B3 · Kollegen oder Freunde? — Diskussion\n\nNapravi beleške i razgovaraj/piši:\n\n1. *Sind Freundschaften im Job in Ordnung?*\n2. *Welche Gesprächsthemen sind im Job okay / tabu?*\n3. *Welche Regeln im Umgang mit Kollegen finden Sie wichtig?*",
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "**Redemittel za odgovor:**\n\n- *Ich finde, dass Freundschaften im Job sinnvoll sind. Denn je besser man sich mit den Kollegen versteht, desto besser arbeitet man.*\n- *Ja, das denke ich auch. Ich habe meine beste Freundin auf der Arbeit kennengelernt.*\n- *Ich bin anderer Meinung, denn private Probleme sollten nicht ins Büro kommen.*",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Duzen vs. Siezen – Prüfung B1 – Leseverstehen   (Leserbriefe, autentično)
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: "Duzen vs. Siezen – Prüfung B1 – Leseverstehen",
    sections: [
      { type: "badge", module: "B1.2 · Kommunikation", category: "lesen" },
      {
        type: "text",
        style: "info",
        content:
          "Originalna čitalačka pisma (Leserbriefe) na temu **duzanja i persiranja** — tip zadatka koji se pojavljuje na B1 ispitu. Svako pismo iznosi mišljenje. Tvoj zadatak je da uhvatiš **stav** svakog autora: da li je za brzo „du“ ili protiv.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Leserbriefe — pisma čitalaca\n\nPročitaj svako pismo i odredi: da li je osoba **za** ili **protiv** brzog duzanja?",
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "**Sibylle, 45, Freiburg:** Ich finde es unmöglich, wie oft ich heute von fremden Menschen einfach so geduzt werde. Vor allem unter Verkäufern scheint das Mode zu sein… Was ist so schlimm am Sie?\n\n**Kathrin, 23, Berlin:** Mich hat neulich ein Mitstudent gesiezt. Zuerst dachte ich, für wie alt hält der mich? Aber eigentlich hatte er Recht… Plötzlich fand ich es schön. Das hat doch was!\n\n**Sigi, 45, Bad Bergzabern:** Mal ehrlich, wer braucht denn heute noch das Sie? Außer vielleicht gegenüber dem Chef! Wer höflich ist, ist es auch per Du.\n\n**Olga, 62, Radevormwald:** Kinder lernen das höfliche Siezen gar nicht mehr… Die Kinder meiner Nachbarin sagen alle „Du“ zu mir, obwohl ich das nicht will.",
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "**Ellen, 56, Leipzig:** Unter jungen Leuten ist das Du heute fast normal, z. B. in der Kneipe. Eigentlich eine schöne Entwicklung — am Abend sind wir ja alle gleich, oder?\n\n**Theo, 19, Münster:** Gleich am ersten Arbeitstag bot mir meine Chefin das „Du“ an. Keine Woche später war klar: ständig Überstunden – ohne Bezahlung! Ob ich da per Du meine Rechte durchsetzen kann?\n\n**Anton, 78, Moers:** Zu meiner Zeit war es undenkbar, Fremde zu duzen! Aber ich finde es prima, dass man sich heute schneller duzt. Vieles lässt sich per Du leichter sagen.\n\n**Lothar, 37, Gelsenkirchen:** Das schnelle Duzen zeigt nur eins: Die Leute benehmen sich schlecht. Man kann sehr negativ auffallen, wenn man Leute zu schnell duzt.",
      },
      {
        type: "spoiler",
        title: "Pitanja — Wer ist dafür, wer dagegen?",
        items: [
          { question: "Sibylle (Freiburg) — za ili protiv brzog „du“?", answer: "Protiv — smeta joj što je stranci duzaju." },
          { question: "Kathrin (Berlin)?", answer: "Za „Sie“ — otkrila je da persiranje ima draž." },
          { question: "Sigi (Bad Bergzabern)?", answer: "Za „du“ — smatra „Sie“ nepotrebnim." },
          { question: "Anton (Moers)?", answer: "Za „du“ — drago mu je da se danas brže prelazi na „du“." },
          { question: "Lothar (Gelsenkirchen)?", answer: "Protiv — brzo duzanje smatra lošim ponašanjem." },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["duzen", "obraćati se sa „du“ (ti)"],
          ["siezen", "obraćati se sa „Sie“ (Vi)"],
          ["unmöglich", "nemoguće, neprihvatljivo"],
          ["die Distanz", "distanca"],
          ["die Entwicklung", "razvoj, tok"],
          ["die Überstunden", "prekovremeni sati"],
          ["seine Rechte durchsetzen", "izboriti svoja prava"],
          ["negativ auffallen", "ostaviti loš utisak"],
        ],
      },
      {
        type: "text",
        style: "default",
        content:
          "💡 **Strategija za ovaj tip zadatka:** ne moraš razumeti svaku reč. Traži ključne signale stava — *unmöglich*, *schlimm*, *schlecht benehmen* (protiv) naspram *schön*, *prima*, *leichter* (za).",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Lese- und Hörverstehen   (dodajemo autentičan A–G zadatak iz Leseverstehen.pdf)
  // ─────────────────────────────────────────────────────────────────────────
  {
    title: "Lese – und Hörverstehen",
    vimeoId: "1128598236",
    sections: [
      { type: "badge", module: "B1.2 · Prüfungstraining", category: "lesen" },
      { type: "video", vimeoId: "1128598236" },
      {
        type: "text",
        style: "info",
        content:
          "Lesen i Hören su moduli gde se najlakše skupljaju poeni — ako znaš tehniku. Ista strategija (prvo pitanja, pa tekst/audio, pa potvrda) radi za oba. Ispod je i pravi ispitni zadatak za vežbu.",
      },
      {
        type: "text",
        style: "uebung",
        content:
          "## Lesen — korak po korak\n\n1. Pročitaj **naslov i pitanja** pre teksta.\n2. **Podvuci ključne reči** u svakom pitanju.\n3. Pređi tekst i traži ta mesta — odgovor je obično parafraza (sinonim), ne ista reč.\n4. Za **Richtig/Falsch**: nađi rečenicu u tekstu koja to dokazuje. Nema dokaza → verovatno Falsch.",
      },
      {
        type: "text",
        style: "uebung",
        content:
          "## Hören — korak po korak\n\n1. U pauzi pre slušanja **pročitaj pitanja** i predvidi temu.\n2. Slušaj **glavnu informaciju**, ne svaku reč.\n3. Hvataj **imenice, brojeve, datume**.\n4. Drugi put slušaj samo da **proveriš** ono u šta nisi siguran.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Pravi zadatak za vežbu (Lesen)\n\nKoji tekst (A–G) odgovara kojoj situaciji? Svaki opis je kratko uputstvo — poveži ga sa temom. Ovo je tipičan B1 Lesen zadatak „uparivanja“.",
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "**A** — Stecken Sie das Ladegerät in eine Steckdose… Während Ihr Telefon lädt, sehen Sie das Symbol für **Akku laden**. → *punjenje telefona*\n\n**B** — Wenn Sie einen neuen Kontakt erstellen möchten, wählen Sie **Kontakte**… tippen Sie auf **Speichern**. → *novi kontakt*\n\n**C** — Stecken Sie ein LAN-Kabel in den LAN-Anschluss… **Netzwerk einstellen** → **Starten**. → *TV na internet*\n\n**D** — Wenn Ihr Gerät nicht mehr reagiert, schließen Sie die App… schalten Sie das Gerät aus und wieder ein. → *uređaj se zamrznuo*\n\n**E** — Wählen Sie **Kontakte**, dann Ihren Namen und das Bleistift-Symbol… Kontaktdaten versenden/freigeben. → *deljenje svojih podataka*\n\n**F** — Tippen Sie auf das **Wecker-Symbol**… Uhrzeit und Tage auswählen → **Speichern**. → *podešavanje alarma*\n\n**G** — Öffnen Sie den Shop, tippen Sie bei **Suche** den Namen der App ein… **Installieren**. → *instaliranje aplikacije*",
      },
      {
        type: "spoiler",
        title: "Vežba — poveži situaciju sa tekstom (A–G)",
        items: [
          { question: "Želiš da podesiš da te telefon budi ujutru.", answer: "F (Wecker)" },
          { question: "Aplikacija se zaledila i ne reaguje.", answer: "D (Gerät reagiert nicht)" },
          { question: "Hoćeš novu aplikaciju.", answer: "G (Shop → installieren)" },
          { question: "Telefon je prazan, treba da ga napuniš.", answer: "A (Ladegerät)" },
          { question: "Hoćeš da povežeš TV na internet.", answer: "C (LAN-Kabel)" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["das Schlüsselwort", "ključna reč"],
          ["die Aussage", "tvrdnja, izjava"],
          ["paraphrasieren", "reći drugim rečima"],
          ["das Ladegerät", "punjač"],
          ["der Anschluss", "priključak"],
          ["einstellen", "podesiti"],
        ],
      },
      {
        type: "text",
        style: "default",
        content:
          "🎧 **Vežbaj redovno:** Deutsche Welle „Langsam gesprochene Nachrichten“ za slušanje + kratki članci za čitanje. 15 minuta dnevno diže razumevanje brže od svega.",
      },
    ],
  },
];
