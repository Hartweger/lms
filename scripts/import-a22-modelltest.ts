/**
 * Import A2.2 Modelltest — Goethe-Zertifikat A2 format
 * Run: npx tsx scripts/import-a22-modelltest.ts
 *
 * Structure (identical to Goethe A2 exam):
 *   Lesen Teil 1: Zeitungstext + 5 Fragen (a/b/c)
 *   Lesen Teil 2: Kaufhaus-Wegweiser + 5 Fragen
 *   Lesen Teil 3: E-Mail + 5 Fragen
 *   Lesen Teil 4: 6 Anzeigen + 5 Zuordnungen
 *   Hören Teil 1: 5 kurze Texte + Fragen (audio)
 *   Hören Teil 3: 5 Gespräche + Fragen (audio, text options)
 *   Hören Teil 4: Interview + 5x Ja/Nein (audio)
 *   Schreiben Teil 1: SMS schreiben (essay)
 *   Schreiben Teil 2: formaler Brief (essay)
 *
 * Audio files: /audio/modelltest-a2/track-XX.mp3
 * Based on Cornelsen Prüfungstraining Goethe-Zertifikat A2, Modelltest 1
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Lesson sections (reading texts displayed inline) ───

const MODELLTEST_SECTIONS = [
  {
    type: 'badge',
    module: 'Završni ispit',
    category: 'grammatik',
  },
  {
    type: 'text',
    style: 'info',
    content:
      'Ovo je **završni test za nivo A2** po formatu Goethe-Zertifikat A2. Test se sastoji od tri dela:\n\n' +
      '1. **Lesen** (čitanje) — 20 pitanja\n' +
      '2. **Hören** (slušanje) — 15 pitanja\n' +
      '3. **Schreiben** (pisanje) — 2 zadatka\n\n' +
      'Za prolaz je potrebno minimum **60%** na Lesen + Hören delu. Ako položiš, dobijaš **sertifikat A2**!',
  },
  {
    type: 'text',
    style: 'uebung',
    content:
      '**Saveti:**\n' +
      '- Pročitaj svako pitanje pažljivo\n' +
      '- Za Hören: pusti audio i slušaj pažljivo pre nego odgovoriš\n' +
      '- Imaš neograničen broj pokušaja\n' +
      '- Koristi se najbolji rezultat',
  },

  // ── LESEN TEIL 1: Zeitungstext ──
  {
    type: 'text',
    style: 'default',
    content:
      `## Lesen Teil 1\n\nPročitaj sledeći tekst iz novina. Odgovori na pitanja 1-5 (a, b ili c).\n\n---\n\n### Joachim Sanders — Ein Mann als Sekretärin\n\n*"Ich habe einen typischen Frauenberuf — warum auch nicht?"*\n\nIn unserer Reihe "Frauenberufe — Jetzt auch für Männer!" möchten wir Ihnen heute Joachim Sanders vorstellen. Joachim Sanders hat immer schon gern Büroarbeit gemacht. Auch das Lernen von Sprachen ist schon seit seiner Schulzeit ein wichtiges Hobby. Nach seiner Ausbildung zum Fremdsprachensekretär fuhr er erst einmal nach England und Frankreich. Dort konnte er seine Sprachkenntnisse noch weiter verbessern. Er hat dort auch in verschiedenen Büros gearbeitet, aber immer nur kurze Zeit.\n\nAls er zurück in Hamburg war, suchte er einen festen Job als Sekretär. Er schrieb viele Bewerbungen, hatte aber kein Glück. Dann sah er im Internet eine Anzeige bei der Firma KantorPartners. Er hatte mit dem Personalchef der Firma ein Gespräch und bekam die Stelle.\n\nJetzt arbeitet er als Sekretär bei dieser Firma. Er ist der einzige männliche Sekretär. Seine Kolleginnen haben damit kein Problem. Nur einige Kollegen finden das manchmal noch etwas komisch. Immer noch denken viele, dass man als Sekretärin nur schnell tippen können muss, gut aussehen sollte und vor allem in der Büroküche Kaffee kocht. Aber das ist schon lange nicht mehr so.\n\nJoachim Sanders: "Es war schon lustig. Ich habe an einem Wettbewerb für Fremdsprachensekretärinnen teilgenommen und war der einzige Mann. Und ich habe den Wettbewerb gewonnen. Ich wurde die Nummer Eins und bekam den Preis — und das als Mann."`,
  },

  // ── LESEN TEIL 2: Kaufhaus ──
  {
    type: 'text',
    style: 'default',
    content:
      '## Lesen Teil 2\n\nIdeš u kupovinu u robnu kuću. Pročitaj pitanja 6-10 i pogledaj informacije. Na koji sprat ideš?',
  },
  {
    type: 'table',
    headers: ['Sprat', 'Odeljenja'],
    rows: [
      [
        '<mark>4. Stock</mark>',
        'Café & Restaurant / Computer / Computerspiele / Software / Ticketshop / Kartenvorverkauf / Bücher / Toiletten / Schlüsseldienst',
      ],
      [
        '<mark>3. Stock</mark>',
        'Einrichtung & Möbel / Lampen & Beleuchtung / Sportartikel / Fahrräder / Kinderwelt / Spielzeug / Spiele / Uhren & Schmuck',
      ],
      [
        '<mark>2. Stock</mark>',
        'Kindermode / Radio & Fernsehen / CDs & DVDs / Musik / Fotostudio',
      ],
      [
        '<mark>1. Stock</mark>',
        'Damenbekleidung / Herrenbekleidung / Damen- und Herrenschuhe',
      ],
      [
        '<mark>Erdgeschoss</mark>',
        'Lebensmittel / Getränkemarkt / Büro- und Schreibwaren / Uhren / Haushaltsartikel / Geschenkartikel / Küchengeräte / Elektrogeräte / Geldautomat',
      ],
    ],
  },

  // ── LESEN TEIL 3: E-Mail ──
  {
    type: 'text',
    style: 'default',
    content:
      '## Lesen Teil 3\n\nPročitaj sledeći mejl. Odgovori na pitanja 11-15.\n\n---\n\nLiebe Alexa,\n\nerinnerst du dich an den tollen Urlaub am Bodensee? Dort haben wir uns kennengelernt und es war sehr schön. Ich wollte dir schon die ganze Zeit schreiben, hatte aber so wenig Zeit. Tut mir wirklich leid.\n\nWie geht es dir? Bei mir läuft alles super. Ich bin inzwischen mit dem Studium fertig und hoffe, dass ich bald eine Arbeit finde. Und das Beste: Ich habe endlich eine größere Wohnung gefunden. Dort wohne ich jetzt seit einem Monat.\n\nDas möchte ich feiern. Deshalb schreibe ich dir. Ich möchte gern, dass du zu meiner Party kommst. Hast du Lust zu kommen und mich zu besuchen?\n\nDie Party findet am Samstag, dem 5. September, statt. Essen und Trinken habe ich schon eingekauft. Du brauchst nichts mitzubringen, nur vielleicht Musik aus deinem Land, es gibt doch so schöne griechische Musik! Wir wollen ja auch tanzen! Das wäre super.\n\nUnd wenn du schon mal in Berlin bist, kannst du auch etwas länger bleiben. Es gibt in Kreuzberg billige Hotels, aber wenn du willst, kannst du auch gern in meiner Wohnung schlafen, Platz gibt es genug, übernachten ist also kein Problem. Überleg es dir, ich würde mich sehr freuen, dich wiederzusehen.\n\nMeine neue Adresse ist Wrangelstraße 40 in Kreuzberg. Und am Sonntag könnte ich dir Berlin zeigen, die Stadt wird dir bestimmt gefallen, ich habe auch zwei Fahrräder. Und am Abend gibt es hier ein tolles Straßenfest mit Musik und Essen.\n\nLass bald etwas von dir hören!\n\nViele Grüße\nThomas',
  },

  // ── LESEN TEIL 4: Anzeigen ──
  {
    type: 'text',
    style: 'default',
    content:
      '## Lesen Teil 4\n\nŠest osoba žele da upoznaju Nemačku i traže savete na internetu. Pročitaj oglase a-f i odgovori na pitanja 16-20: koji oglas odgovara kojoj osobi?',
  },
  {
    type: 'text',
    style: 'beispiele',
    content:
      '**a) www.essen-und-trinken-in-deutschland.de** — Ihr Restaurantfinder für Spezialitätenrestaurants mit deutschen Gerichten in ganz Deutschland. Mit der Detailsuche finden Sie die besten Restaurants in jeder Stadt. Sie können auch nach einem typisch deutschen Gericht suchen.\n\n**b) www.deutsche-kueche.de** — Was isst und trinkt man in Deutschland? Kleine kulinarische Geschichte Deutschlands, Deutsche Küche und Spezialitäten aus allen Regionen. Links zu unzähligen Rezepten zum Selberkochen, von Kohlrouladen über Nordseefisch bis zu Grüner Soße.\n\n**c) www.Radsport.de** — Fahrräder, Tourenräder, Mountainbikes, E-Bikes: die neuesten Modelle! Fachabteilung für Fahrradzubehör, Fahrradtaschen und alles, was Sie für eine Radreise brauchen. Außerdem Fahrradhelme, Fahrradkleidung. Alles zu supergünstigen Preisen. Machen Sie eine Probefahrt!\n\n**d) www.norddeutschland-verkehr.de** — Norddeutschland-Ticket jetzt für nur 33 Euro. Bis zu 5 Personen fahren für 33 Euro einen Tag durch Norddeutschland: gilt montags bis freitags ab 9.00 Uhr bis Betriebsende, samstags und sonntags auch ganztägig. Fahrradmitnahme kein Problem. So weit Sie wollen — mit Bus oder Bahn und Rad.\n\n**e) www.afc.de** — Radreisen: In unserer Online-Datenbank finden Sie zu jedem Reiseziel in Deutschland Informationen und Anbieter. Außerdem Karten mit den schönsten Radwegen. Auch Angebote für organisierte Radreisen, von einfach bis sportlich, mit mindestens 4 Teilnehmenden.\n\n**f) www.ticketshop.com** — Ticketshop EVENT: Jetzt Karten reservieren für Konzerte in ganz Deutschland! Jetzt im Vorverkauf: Karten für Musicals, Shows, Konzerte. Es gibt noch wenige Karten für das Sommerfestival im Olympiapark München.',
  },

  // ── HÖREN intro ──
  {
    type: 'text',
    style: 'default',
    content:
      '## Hören\n\nZa Hören deo testa, slušaj audio snimke i odgovori na pitanja. Svaki snimak možeš da pustiš dva puta.',
  },

  // ── SCHREIBEN intro ──
  {
    type: 'text',
    style: 'default',
    content:
      '## Schreiben\n\nU delu Schreiben pišeš dva kratka teksta. AI ili profesor će oceniti tvoj odgovor.',
  },
];

// ─── LESEN questions (20) ───

const LESEN_QUESTIONS = [
  // Teil 1: Joachim Sanders (1-5) — Lösungen: 1b, 2a, 3a, 4a, 5b
  {
    question:
      '<strong>Lesen Teil 1</strong>\n\n<strong>Beispiel:</strong> Joachim Sanders … <em>(b) mag Arbeiten im Büro</em>\n\n<strong>1.</strong> Nach seiner Ausbildung …',
    options: {
      type: 'quiz',
      items: [
        'hat er in Hamburg gearbeitet.',
        'hat er Jobs im Ausland gehabt.',
        'hat er Englisch und Französisch gelernt.',
      ],
    },
    correct_answer: '1',
    explanation: 'Beispiel — posle obuke je radio u inostranstvu (England und Frankreich).',
    question_type: 'quiz',
  },
  {
    question:
      '<strong>2.</strong> Bei der Firma KantorPartners arbeitet Joachim Sanders …',
    options: {
      type: 'quiz',
      items: ['als Sekretär.', 'in der Küche.', 'als Personalchef.'],
    },
    correct_answer: '0',
    question_type: 'quiz',
  },
  {
    question: '<strong>3.</strong> Viele Kollegen denken, dass …',
    options: {
      type: 'quiz',
      items: [
        'Büroarbeit einfache Arbeit für Frauen ist.',
        'Frauen schneller arbeiten als Männer.',
        'Frauen manchmal Probleme im Beruf haben.',
      ],
    },
    correct_answer: '0',
    question_type: 'quiz',
  },
  {
    question: '<strong>4.</strong> In einem Wettbewerb …',
    options: {
      type: 'quiz',
      items: [
        'war er der Beste.',
        'hat er viel gelacht.',
        'hat er eine Frau kennengelernt.',
      ],
    },
    correct_answer: '0',
    question_type: 'quiz',
  },
  {
    question: '<strong>5.</strong> Dieser Text informiert über …',
    options: {
      type: 'quiz',
      items: [
        'Frauen in Männerberufen.',
        'Männer in Frauenberufen.',
        'neue Berufe.',
      ],
    },
    correct_answer: '1',
    question_type: 'quiz',
  },

  // Teil 2: Kaufhaus Mitte (6-10) — Lösungen: 6c, 7a, 8b, 9a, 10c
  {
    question:
      '<strong>Lesen Teil 2</strong>\n\n<strong>6.</strong> Sie möchten Kaffee trinken und etwas essen.',
    options: {
      type: 'quiz',
      items: ['Erdgeschoss.', '3. Stock.', 'Anderer Stock.'],
    },
    correct_answer: '2',
    explanation: "Café & Restaurant je na 4. Stock — Anderer Stock je tačno.",
    question_type: 'quiz',
  },
  {
    question: '<strong>7.</strong> Sie brauchen einen neuen Wintermantel.',
    options: {
      type: 'quiz',
      items: ['1. Stock.', '2. Stock.', 'Anderer Stock.'],
    },
    correct_answer: '0',
    explanation: 'Damenbekleidung / Herrenbekleidung → 1. Stock.',
    question_type: 'quiz',
  },
  {
    question:
      '<strong>8.</strong> Sie suchen eine Hose für Ihren 6-jährigen Sohn.',
    options: {
      type: 'quiz',
      items: ['1. Stock.', '2. Stock.', 'Anderer Stock.'],
    },
    correct_answer: '1',
    explanation: 'Kindermode → 2. Stock.',
    question_type: 'quiz',
  },
  {
    question:
      '<strong>9.</strong> Sie interessieren sich für eine neue Kaffeemaschine.',
    options: {
      type: 'quiz',
      items: ['Erdgeschoss.', '3. Stock.', 'Anderer Stock.'],
    },
    correct_answer: '0',
    explanation: 'Küchengeräte / Elektrogeräte → Erdgeschoss.',
    question_type: 'quiz',
  },
  {
    question:
      '<strong>10.</strong> Ihre Freundin hat Geburtstag. Sie möchten ihr eine Eintrittskarte für ein Konzert schenken.',
    options: {
      type: 'quiz',
      items: ['Erdgeschoss.', '2. Stock.', 'Anderer Stock.'],
    },
    correct_answer: '2',
    explanation: "Ticketshop / Kartenvorverkauf → 4. Stock — Anderer Stock.",
    question_type: 'quiz',
  },

  // Teil 3: E-Mail von Thomas (11-15) — Lösungen: 11a, 12b, 13a, 14c, 15a
  {
    question:
      '<strong>Lesen Teil 3</strong>\n\n<strong>11.</strong> Thomas entschuldigt sich, weil er …',
    options: {
      type: 'quiz',
      items: [
        'so spät schreibt.',
        'in den Ferien keine Zeit hatte.',
        'den Urlaub vergessen hat.',
      ],
    },
    correct_answer: '0',
    question_type: 'quiz',
  },
  {
    question: '<strong>12.</strong> Vor kurzem …',
    options: {
      type: 'quiz',
      items: [
        'hat er eine Arbeit gefunden.',
        'ist er umgezogen.',
        'hat er sein Studium angefangen.',
      ],
    },
    correct_answer: '1',
    explanation: 'Er hat eine größere Wohnung gefunden und wohnt dort seit einem Monat.',
    question_type: 'quiz',
  },
  {
    question: '<strong>13.</strong> Thomas schreibt, dass er …',
    options: {
      type: 'quiz',
      items: [
        'Alexa einladen möchte.',
        'nach Griechenland fahren möchte.',
        'mit Alexa eine Party vorbereiten möchte.',
      ],
    },
    correct_answer: '0',
    question_type: 'quiz',
  },
  {
    question: '<strong>14.</strong> Er findet es toll, wenn Alexa …',
    options: {
      type: 'quiz',
      items: [
        'Getränke mitbringt.',
        'mit ihm tanzen geht.',
        'sich um Musik kümmert.',
      ],
    },
    correct_answer: '2',
    explanation: 'Er bittet sie, Musik aus ihrem Land mitzubringen.',
    question_type: 'quiz',
  },
  {
    question: '<strong>15.</strong> Was schlägt Thomas vor?',
    options: {
      type: 'quiz',
      items: [
        'Beide können einen Ausflug mit dem Fahrrad machen.',
        'Er kann ein billiges Zimmer in einem Hotel reservieren.',
        'Sie können am Abend in ein Restaurant gehen.',
      ],
    },
    correct_answer: '0',
    explanation: 'Er hat zwei Fahrräder und will ihr Berlin zeigen.',
    question_type: 'quiz',
  },

  // Teil 4: Anzeigen (16-20) — Lösungen: 16e, 17b, 18d, 19x, 20a
  {
    question:
      '<strong>Lesen Teil 4</strong>\n\n<strong>16.</strong> Tom möchte Bayern mit dem Rad kennenlernen.',
    options: {
      type: 'quiz',
      items: [
        'a) essen-und-trinken',
        'b) deutsche-kueche',
        'c) Radsport',
        'd) norddeutschland-verkehr',
        'e) afc.de (Radreisen)',
        'f) ticketshop',
      ],
    },
    correct_answer: '4',
    explanation: 'afc.de hat organisierte Radreisen mit Karten der schönsten Radwege.',
    question_type: 'quiz',
  },
  {
    question:
      '<strong>17.</strong> Dominika sucht Informationen über das Essen in Deutschland.',
    options: {
      type: 'quiz',
      items: [
        'a) essen-und-trinken',
        'b) deutsche-kueche',
        'c) Radsport',
        'd) norddeutschland-verkehr',
        'e) afc.de',
        'f) ticketshop',
      ],
    },
    correct_answer: '1',
    explanation: 'deutsche-kueche.de hat Rezepte und kulinarische Geschichte.',
    question_type: 'quiz',
  },
  {
    question:
      '<strong>18.</strong> Masoud möchte mit drei Freunden möglichst günstig durch Deutschland reisen.',
    options: {
      type: 'quiz',
      items: [
        'a) essen-und-trinken',
        'b) deutsche-kueche',
        'c) Radsport',
        'd) norddeutschland-verkehr',
        'e) afc.de',
        'f) ticketshop',
      ],
    },
    correct_answer: '3',
    explanation:
      'Norddeutschland-Ticket: bis zu 5 Personen für 33 Euro.',
    question_type: 'quiz',
  },
  {
    question:
      '<strong>19.</strong> Ina möchte ein Wochenende nach München und sucht Informationen über die Stadt.',
    options: {
      type: 'quiz',
      items: [
        'a) essen-und-trinken',
        'b) deutsche-kueche',
        'c) Radsport',
        'd) norddeutschland-verkehr',
        'e) afc.de',
        'f) ticketshop',
        'x) keine passende Anzeige',
      ],
    },
    correct_answer: '6',
    explanation: 'Keine der Anzeigen bietet allgemeine Stadtinformationen über München.',
    question_type: 'quiz',
  },
  {
    question:
      '<strong>20.</strong> Christopher plant einen Kurzurlaub am Meer und möchte abends echten Nordseefisch essen.',
    options: {
      type: 'quiz',
      items: [
        'a) essen-und-trinken',
        'b) deutsche-kueche',
        'c) Radsport',
        'd) norddeutschland-verkehr',
        'e) afc.de',
        'f) ticketshop',
      ],
    },
    correct_answer: '0',
    explanation: 'Restaurantfinder für Spezialitätenrestaurants — man kann nach Gerichten suchen.',
    question_type: 'quiz',
  },
];

// ─── HÖREN questions (15: Teil 1 + Teil 3 + Teil 4) ───

const HOEREN_QUESTIONS = [
  // Teil 1: 5 kurze Texte (1-5) — Lösungen: 1a, 2c, 3b, 4c, 5b
  {
    question:
      '<strong>Hören Teil 1</strong> — Slušaj audio i odgovori.\n\n<strong>1.</strong> Wie wird das Wetter am Wochenende?',
    options: {
      type: 'quiz',
      items: ['Es bleibt schön.', 'Es kann regnen.', 'Es wird kälter.'],
    },
    correct_answer: '0',
    audio_url: '/audio/modelltest-a2/track-03.mp3',
    question_type: 'quiz',
  },
  {
    question: '<strong>2.</strong> Was kann man gewinnen?',
    options: {
      type: 'quiz',
      items: ['Ein Auto.', 'Ein Radio.', 'Eintrittskarten.'],
    },
    correct_answer: '2',
    audio_url: '/audio/modelltest-a2/track-04.mp3',
    question_type: 'quiz',
  },
  {
    question: '<strong>3.</strong> Wo gibt es noch freie Parkplätze?',
    options: {
      type: 'quiz',
      items: [
        'Vor dem Schwimmbad.',
        'Hinter dem Sportplatz.',
        'Es gibt keine Parkplätze mehr.',
      ],
    },
    correct_answer: '1',
    audio_url: '/audio/modelltest-a2/track-05.mp3',
    question_type: 'quiz',
  },
  {
    question: '<strong>4.</strong> Wann kann Herr Lohmann einen Termin haben?',
    options: {
      type: 'quiz',
      items: [
        'Heute um 18 Uhr.',
        'Am Dienstag um 14 Uhr.',
        'Am Mittwoch um 10 Uhr.',
      ],
    },
    correct_answer: '2',
    audio_url: '/audio/modelltest-a2/track-06.mp3',
    question_type: 'quiz',
  },
  {
    question: '<strong>5.</strong> Wo will Pauline ihre Freundin treffen?',
    options: {
      type: 'quiz',
      items: ['Im Kino.', 'In ihrer Wohnung.', 'Beim Arzt.'],
    },
    correct_answer: '1',
    audio_url: '/audio/modelltest-a2/track-07.mp3',
    question_type: 'quiz',
  },

  // Teil 3: 5 Gespräche (11-15) — Lösungen: 11a, 12c, 13c, 14a, 15b
  {
    question:
      '<strong>Hören Teil 3</strong> — Slušaj kratke razgovore.\n\n<strong>11.</strong> Wie muss die Frau gehen?',
    options: {
      type: 'quiz',
      items: [
        'Geradeaus und dann links.',
        'Erst rechts, dann links.',
        'Erst links, dann geradeaus.',
      ],
    },
    correct_answer: '0',
    audio_url: '/audio/modelltest-a2/track-11.mp3',
    question_type: 'quiz',
  },
  {
    question: '<strong>12.</strong> Was ist kaputt?',
    options: {
      type: 'quiz',
      items: ['Der Computer.', 'Das Handy.', 'Der Drucker.'],
    },
    correct_answer: '2',
    audio_url: '/audio/modelltest-a2/track-12.mp3',
    question_type: 'quiz',
  },
  {
    question: '<strong>13.</strong> Was möchte die Frau kaufen?',
    options: {
      type: 'quiz',
      items: ['Ein Sakko (Jacke).', 'Eine Hose.', 'Einen Pullover.'],
    },
    correct_answer: '2',
    audio_url: '/audio/modelltest-a2/track-13.mp3',
    question_type: 'quiz',
  },
  {
    question: '<strong>14.</strong> Wohin soll der Mann gehen?',
    options: {
      type: 'quiz',
      items: ['Zum Arzt.', 'Zum Friseur.', 'In die Apotheke.'],
    },
    correct_answer: '0',
    audio_url: '/audio/modelltest-a2/track-14.mp3',
    question_type: 'quiz',
  },
  {
    question: '<strong>15.</strong> Wie kommt Herr Schneider zur Arbeit?',
    options: {
      type: 'quiz',
      items: [
        'Mit der Straßenbahn.',
        'Mit dem Fahrrad.',
        'Mit dem Auto.',
      ],
    },
    correct_answer: '1',
    audio_url: '/audio/modelltest-a2/track-15.mp3',
    question_type: 'quiz',
  },

  // Teil 4: Interview Ja/Nein (16-20) — Lösungen: 16 Ja, 17 Nein, 18 Ja, 19 Ja, 20 Nein
  {
    question:
      '<strong>Hören Teil 4</strong> — Slušaj intervju i odgovori Ja ili Nein.\n\n<strong>16.</strong> Er hat im Internet keine Arbeit gefunden.',
    options: { type: 'quiz', items: ['Ja, das ist richtig.', 'Nein, das ist falsch.'] },
    correct_answer: '0',
    audio_url: '/audio/modelltest-a2/track-17.mp3',
    question_type: 'quiz',
  },
  {
    question:
      '<strong>17.</strong> Er hat sich sofort bei einer Pizzeria beworben.',
    options: { type: 'quiz', items: ['Ja, das ist richtig.', 'Nein, das ist falsch.'] },
    correct_answer: '1',
    audio_url: '/audio/modelltest-a2/track-17.mp3',
    question_type: 'quiz',
  },
  {
    question:
      '<strong>18.</strong> Für seine Arbeit braucht er keinen Führerschein.',
    options: { type: 'quiz', items: ['Ja, das ist richtig.', 'Nein, das ist falsch.'] },
    correct_answer: '0',
    audio_url: '/audio/modelltest-a2/track-17.mp3',
    question_type: 'quiz',
  },
  {
    question: '<strong>19.</strong> Er arbeitet nicht nur als Fahrer.',
    options: { type: 'quiz', items: ['Ja, das ist richtig.', 'Nein, das ist falsch.'] },
    correct_answer: '0',
    audio_url: '/audio/modelltest-a2/track-17.mp3',
    question_type: 'quiz',
  },
  {
    question: '<strong>20.</strong> Seit einem Jahr macht er eine Ausbildung.',
    options: { type: 'quiz', items: ['Ja, das ist richtig.', 'Nein, das ist falsch.'] },
    correct_answer: '1',
    audio_url: '/audio/modelltest-a2/track-17.mp3',
    question_type: 'quiz',
  },
];

// ─── SCHREIBEN tasks (2 essay exercises) ───

const SCHREIBEN_TASKS = [
  {
    title: 'Schreiben Teil 1 — SMS',
    question:
      '<strong>Schreiben Teil 1</strong>\n\nSie wollten mit Ihrer Freundin Julia ins Kino gehen, haben aber keine Zeit. Schreiben Sie eine SMS an Ihre Freundin Julia.\n\n<ul><li>Entschuldigen Sie sich, dass Sie nicht kommen können.</li><li>Schreiben Sie, warum.</li><li>Machen Sie einen Vorschlag, wann Sie ins Kino gehen können.</li></ul>\n\nSchreiben Sie <strong>20 bis 30 Wörter</strong>. Schreiben Sie zu allen drei Punkten.',
  },
  {
    title: 'Schreiben Teil 2 — Formaler Brief',
    question:
      '<strong>Schreiben Teil 2</strong>\n\nIn Ihrem Haus gibt es einen neuen Mieter, Herrn Franke. Herr Franke macht am Samstag eine Party. Er möchte feiern, dass er eine neue Wohnung gefunden hat. Er hat Sie und die anderen Mieter zu der Party eingeladen.\n\n<ul><li>Bedanken Sie sich und sagen Sie, dass Sie gern kommen.</li><li>Sagen Sie, dass Sie etwas zur Party mitbringen wollen.</li><li>Fragen Sie nach der Uhrzeit.</li></ul>\n\nSchreiben Sie <strong>30 bis 40 Wörter</strong>. Schreiben Sie zu allen drei Punkten.',
  },
];

// ─── Main ───

async function main() {
  const COURSE_SLUG = 'nemacki-a2-2';

  const { data: course } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', COURSE_SLUG)
    .single();

  if (!course) {
    console.error('Course not found:', COURSE_SLUG);
    process.exit(1);
  }

  // Find or create Modelltest lesson
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, order_index')
    .eq('course_id', course.id)
    .order('order_index');

  if (!lessons) {
    console.error('No lessons');
    process.exit(1);
  }

  let modelltestLesson = lessons.find(
    (l) =>
      l.title.toLowerCase().includes('modelltest') ||
      l.title.toLowerCase().includes('model test')
  );

  if (!modelltestLesson) {
    // Create Modelltest lesson at the end
    const maxOrder = lessons.length > 0 ? lessons[lessons.length - 1].order_index : -1;
    const { data: newLesson, error } = await supabase
      .from('lessons')
      .insert({
        course_id: course.id,
        title: 'Modelltest A2',
        lesson_type: 'text',
        content: '',
        order_index: maxOrder + 1,
        is_free_preview: false,
        sections: MODELLTEST_SECTIONS,
      })
      .select('id, title, order_index')
      .single();

    if (error || !newLesson) {
      console.error('Failed to create lesson:', error);
      process.exit(1);
    }
    modelltestLesson = newLesson;
    console.log(`Created lesson: Modelltest A2 (order ${newLesson.order_index})`);
  } else {
    // Update sections on existing lesson
    await supabase
      .from('lessons')
      .update({ sections: MODELLTEST_SECTIONS })
      .eq('id', modelltestLesson.id);
    console.log(`Updated sections on: ${modelltestLesson.title}`);
  }

  // Delete existing exercises for clean import
  const { data: existingExercises } = await supabase
    .from('exercises')
    .select('id')
    .eq('lesson_id', modelltestLesson.id);

  if (existingExercises && existingExercises.length > 0) {
    for (const ex of existingExercises) {
      await supabase.from('exercise_questions').delete().eq('exercise_id', ex.id);
      await supabase.from('exercise_attempts').delete().eq('exercise_id', ex.id);
    }
    await supabase
      .from('exercises')
      .delete()
      .eq('lesson_id', modelltestLesson.id);
    console.log(`Deleted ${existingExercises.length} existing exercises`);
  }

  // ── Exercise 1: Lesen (20 questions) ──
  // Context blocks embedded in each question's options for reading comprehension
  const lesenContextMap: Record<string, { title: string; type: string; content?: string; headers?: string[]; rows?: string[][] }> = {
    teil1: {
      title: 'Lesen Teil 1 — Zeitungstext',
      type: 'text',
      content:
        '**Joachim Sanders — Ein Mann als Sekretärin**\n\n' +
        '*"Ich habe einen typischen Frauenberuf — warum auch nicht?"*\n\n' +
        'In unserer Reihe "Frauenberufe — Jetzt auch für Männer!" möchten wir Ihnen heute Joachim Sanders vorstellen. Joachim Sanders hat immer schon gern Büroarbeit gemacht. Auch das Lernen von Sprachen ist schon seit seiner Schulzeit ein wichtiges Hobby. Nach seiner Ausbildung zum Fremdsprachensekretär fuhr er erst einmal nach England und Frankreich. Dort konnte er seine Sprachkenntnisse noch weiter verbessern. Er hat dort auch in verschiedenen Büros gearbeitet, aber immer nur kurze Zeit.\n\n' +
        'Als er zurück in Hamburg war, suchte er einen festen Job als Sekretär. Er schrieb viele Bewerbungen, hatte aber kein Glück. Dann sah er im Internet eine Anzeige bei der Firma KantorPartners. Er hatte mit dem Personalchef der Firma ein Gespräch und bekam die Stelle.\n\n' +
        'Jetzt arbeitet er als Sekretär bei dieser Firma. Er ist der einzige männliche Sekretär. Seine Kolleginnen haben damit kein Problem. Nur einige Kollegen finden das manchmal noch etwas komisch. Immer noch denken viele, dass man als Sekretärin nur schnell tippen können muss, gut aussehen sollte und vor allem in der Büroküche Kaffee kocht. Aber das ist schon lange nicht mehr so.\n\n' +
        'Joachim Sanders: "Es war schon lustig. Ich habe an einem Wettbewerb für Fremdsprachensekretärinnen teilgenommen und war der einzige Mann. Und ich habe den Wettbewerb gewonnen. Ich wurde die Nummer Eins und bekam den Preis — und das als Mann."',
    },
    teil2: {
      title: 'Lesen Teil 2 — Kaufhaus Mitte',
      type: 'table',
      content: 'Ideš u kupovinu u robnu kuću. Na koji sprat ideš?',
      headers: ['Sprat', 'Odeljenja'],
      rows: [
        ['4. Stock', 'Café & Restaurant / Computer / Computerspiele / Software / Ticketshop / Kartenvorverkauf / Bücher / Toiletten / Schlüsseldienst'],
        ['3. Stock', 'Einrichtung & Möbel / Lampen & Beleuchtung / Sportartikel / Fahrräder / Kinderwelt / Spielzeug / Spiele / Uhren & Schmuck'],
        ['2. Stock', 'Kindermode / Radio & Fernsehen / CDs & DVDs / Musik / Fotostudio'],
        ['1. Stock', 'Damenbekleidung / Herrenbekleidung / Damen- und Herrenschuhe'],
        ['Erdgeschoss', 'Lebensmittel / Getränkemarkt / Büro- und Schreibwaren / Uhren / Haushaltsartikel / Geschenkartikel / Küchengeräte / Elektrogeräte / Geldautomat'],
      ],
    },
    teil3: {
      title: 'Lesen Teil 3 — E-Mail von Thomas',
      type: 'text',
      content:
        'Liebe Alexa,\n\n' +
        'erinnerst du dich an den tollen Urlaub am Bodensee? Dort haben wir uns kennengelernt und es war sehr schön. Ich wollte dir schon die ganze Zeit schreiben, hatte aber so wenig Zeit. Tut mir wirklich leid.\n\n' +
        'Wie geht es dir? Bei mir läuft alles super. Ich bin inzwischen mit dem Studium fertig und hoffe, dass ich bald eine Arbeit finde. Und das Beste: Ich habe endlich eine größere Wohnung gefunden. Dort wohne ich jetzt seit einem Monat.\n\n' +
        'Das möchte ich feiern. Deshalb schreibe ich dir. Ich möchte gern, dass du zu meiner Party kommst. Hast du Lust zu kommen und mich zu besuchen?\n\n' +
        'Die Party findet am Samstag, dem 5. September, statt. Essen und Trinken habe ich schon eingekauft. Du brauchst nichts mitzubringen, nur vielleicht Musik aus deinem Land, es gibt doch so schöne griechische Musik! Wir wollen ja auch tanzen! Das wäre super.\n\n' +
        'Und wenn du schon mal in Berlin bist, kannst du auch etwas länger bleiben. Es gibt in Kreuzberg billige Hotels, aber wenn du willst, kannst du auch gern in meiner Wohnung schlafen, Platz gibt es genug, übernachten ist also kein Problem. Überleg es dir, ich würde mich sehr freuen, dich wiederzusehen.\n\n' +
        'Meine neue Adresse ist Wrangelstraße 40 in Kreuzberg. Und am Sonntag könnte ich dir Berlin zeigen, die Stadt wird dir bestimmt gefallen, ich habe auch zwei Fahrräder. Und am Abend gibt es hier ein tolles Straßenfest mit Musik und Essen.\n\n' +
        'Lass bald etwas von dir hören!\n\n' +
        'Viele Grüße\nThomas',
    },
    teil4: {
      title: 'Lesen Teil 4 — Anzeigen',
      type: 'text',
      content:
        '**a) www.essen-und-trinken-in-deutschland.de** — Ihr Restaurantfinder für Spezialitätenrestaurants mit deutschen Gerichten in ganz Deutschland. Mit der Detailsuche finden Sie die besten Restaurants in jeder Stadt.\n\n' +
        '**b) www.deutsche-kueche.de** — Was isst und trinkt man in Deutschland? Kleine kulinarische Geschichte Deutschlands, Deutsche Küche und Spezialitäten aus allen Regionen. Links zu unzähligen Rezepten zum Selberkochen.\n\n' +
        '**c) www.Radsport.de** — Fahrräder, Tourenräder, Mountainbikes, E-Bikes: die neuesten Modelle! Fachabteilung für Fahrradzubehör. Alles zu supergünstigen Preisen.\n\n' +
        '**d) www.norddeutschland-verkehr.de** — Norddeutschland-Ticket jetzt für nur 33 Euro. Bis zu 5 Personen fahren für 33 Euro einen Tag durch Norddeutschland. Fahrradmitnahme kein Problem.\n\n' +
        '**e) www.afc.de** — Radreisen: In unserer Online-Datenbank finden Sie zu jedem Reiseziel in Deutschland Informationen und Anbieter. Karten mit den schönsten Radwegen. Organisierte Radreisen.\n\n' +
        '**f) www.ticketshop.com** — Ticketshop EVENT: Jetzt Karten reservieren für Konzerte in ganz Deutschland! Musicals, Shows, Konzerte.',
    },
  };

  // Assign context to question ranges: Teil 1 (0-4), Teil 2 (5-9), Teil 3 (10-14), Teil 4 (15-19)
  function getLesenContext(index: number) {
    if (index <= 4) return lesenContextMap.teil1;
    if (index <= 9) return lesenContextMap.teil2;
    if (index <= 14) return lesenContextMap.teil3;
    return lesenContextMap.teil4;
  }

  const { data: lesenEx } = await supabase
    .from('exercises')
    .insert({
      lesson_id: modelltestLesson.id,
      title: 'Lesen — Goethe A2',
      exercise_type: 'quiz',
      order_index: 0,
    })
    .select('id')
    .single();

  if (lesenEx) {
    const qs = LESEN_QUESTIONS.map((q, i) => ({
      exercise_id: lesenEx.id,
      question: q.question,
      options: { ...q.options, context: getLesenContext(i) },
      correct_answer: q.correct_answer,
      explanation: q.explanation || null,
      order_index: i,
    }));
    await supabase.from('exercise_questions').insert(qs);
    console.log(`Lesen: ${qs.length} questions`);
  }

  // ── Exercise 2: Hören (15 questions) ──
  const { data: hoerenEx } = await supabase
    .from('exercises')
    .insert({
      lesson_id: modelltestLesson.id,
      title: 'Hören — Goethe A2',
      exercise_type: 'quiz',
      order_index: 1,
    })
    .select('id')
    .single();

  if (hoerenEx) {
    const qs = HOEREN_QUESTIONS.map((q, i) => ({
      exercise_id: hoerenEx.id,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: null,
      audio_url: q.audio_url || null,
      order_index: i,
    }));
    await supabase.from('exercise_questions').insert(qs);
    console.log(`Hören: ${qs.length} questions`);
  }

  // ── Exercise 3 & 4: Schreiben (2 essay exercises) ──
  for (let i = 0; i < SCHREIBEN_TASKS.length; i++) {
    const task = SCHREIBEN_TASKS[i];
    const { data: schreibenEx } = await supabase
      .from('exercises')
      .insert({
        lesson_id: modelltestLesson.id,
        title: task.title,
        exercise_type: 'listen_write',
        order_index: 2 + i,
      })
      .select('id')
      .single();

    if (schreibenEx) {
      await supabase.from('exercise_questions').insert({
        exercise_id: schreibenEx.id,
        question: task.question,
        options: null,
        correct_answer: 'essay',
        order_index: 0,
      });
      console.log(`${task.title}: created`);
    }
  }

  console.log('\nModelltest A2 komplett!');
  console.log('Exercises: Lesen (20) + Hören (15) + Schreiben (2)');
  console.log('Audio: /audio/modelltest-a2/track-XX.mp3');
}

main().catch(console.error);
