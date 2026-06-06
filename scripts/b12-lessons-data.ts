/**
 * B1.2 — JEDINSTVENI IZVOR ISTINE za lekcije (naslov + redosled + sekcije).
 *
 * I `create-b12-lessons.ts` i `import-b12-sections.ts` čitaju ODAVDE,
 * keyovano po `order` — nema fuzzy-mapiranja naslova (greška iz copilot verzije).
 *
 * Logika kursa: Schritte 6 (Lektion 8–14) = okosnica, Cornelsen = dopuna,
 * snimljeni video PDF-ovi = video/tekst lekcije. Vidi docs/b12-MAPA-SADRZAJA.md.
 *
 * Sadržaj izvučen iz Natašinih PDF-ova u LMS/B1/B12/. Pravila: ekavica, bez ćirilice,
 * tabele zaglavlje "Prevod", "ti" forma, komunikativne vežbe.
 */

import type { Section } from "../src/lib/section-types";

export const COURSE_SLUG = "nemacki-b1-2";

export interface B12Lesson {
  order: number;
  title: string;
  /** vimeoId ako postoji snimljen video; null = tekst-lekcija (kasnije dodati video) */
  vimeoId: string | null;
  isFreePreview?: boolean;
  sections: Section[];
}

export const LESSONS: B12Lesson[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // 0 · Willkommen   (uvodna lekcija — isti format kao ostali kursevi)
  // ─────────────────────────────────────────────────────────────────────────
  {
    order: -1, // postaviće se na pravu poziciju pri sinhronizaciji; vidi b12-sync
    title: "Willkommen",
    vimeoId: null,
    isFreePreview: true,
    sections: [
      { type: "badge", module: "Uvod" },
      {
        type: "text",
        style: "info",
        content:
          "Dobrodošla u kurs **Nemački B1.2**! Ovaj kurs prati udžbenik Schritte International Neu 6 i vodi te do **ispita B1** (Goethe ili TELC). Nastavak je na B1.1 — zajedno pokrivaju ceo nivo B1.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Šta ćeš naučiti u B1.2?\n\n- **Als ob** — Konjunktiv II za nestvarne situacije\n- **Wenn / Falls** — razlika i upotreba u mejlovima\n- **Relativsätze sa predlozima** — *der Kollege, von dem…*\n- **Futur I** — werden + Infinitiv za planove i predviđanja\n- **Temporalsätze** — während / bevor / nachdem\n- **Finalsätze** — um…zu / damit\n- **Partizip Präsens** — kao pridev i kao prilog\n- **Zweiteilige Konnektoren** — sowohl…als auch, weder…noch\n- **Lesen & Schreiben** — reklamacije, mejlovi, argumentovanje\n- **Priprema za ispit B1** — Lesen, Hören, Schreiben, Sprechen + Modelltest",
      },
      {
        type: "text",
        style: "uebung",
        content:
          "## Kako da učiš?\n\n1. **Pogledaj video** — gramatičke lekcije imaju video objašnjenje\n2. **Pročitaj sadržaj** — tabele, formule i primeri ispod videa\n3. **Uradi vežbe** — spoileri, flashcards i kvizovi\n4. **AI vežbe** — prevod i dijalog na kraju svake lekcije\n5. **Test po modulu** — proveri znanje posle svake celine\n6. **Modelltest** — na kraju kursa uradiš završni ispit",
      },
      {
        type: "text",
        style: "default",
        content:
          "Počni sa prvom lekcijom kada budeš spremna. **Viel Erfolg!** 🎉",
      },
      {
        type: "text",
        style: "info",
        content:
          "💡 **Savet:** Ako ti treba podsetnik gramatike sa nižih nivoa, koristi naš **Masterclass A2-B1** kurs.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 1 · Als ob — Konjunktiv II   (Schritte L9 · PDF Als-ob-Satze · VIDEO)
  // ─────────────────────────────────────────────────────────────────────────
  {
    order: 0,
    title: "Als ob — Konjunktiv II",
    vimeoId: "1112584625",
    sections: [
      { type: "badge", module: "B1.2 · Lektion 9 · Bildung", category: "grammatik" },
      { type: "video", vimeoId: "1112584625" },
      {
        type: "text",
        style: "info",
        content:
          "U ovoj lekciji učiš **als ob** rečenice — kako da opišeš nešto što *izgleda* tako, ali nije stvarno. Npr. *Sie tut so, als ob sie müde wäre* = „Pravi se kao da je umorna.\" Ključno pravilo: **als ob** uvek ide sa **Konjunktivom II**.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Prvo: Konjunktiv II (obnavljanje)\n\nAls ob ne radi bez Konjunktiva II. On izražava želje, mogućnosti i nestvarne situacije. Tri stuba koja moraš da znaš:",
      },
      {
        type: "formula",
        content:
          "sein  →  wäre\nhaben →  hätte\nostali glagoli →  würde + Infinitiv",
      },
      {
        type: "table",
        headers: ["Lice", "sein → wäre", "haben → hätte", "würde"],
        rows: [
          ["ich", "wäre", "hätte", "würde"],
          ["du", "wärest", "hättest", "würdest"],
          ["er/sie/es", "wäre", "hätte", "würde"],
          ["wir", "wären", "hätten", "würden"],
          ["ihr", "wärt", "hättet", "würdet"],
          ["sie/Sie", "wären", "hätten", "würden"],
        ],
      },
      {
        type: "text",
        style: "default",
        content:
          "Modalni glagoli imaju svoj Konjunktiv II: **können → könnte**, **müssen → müsste**, **dürfen → dürfte**, **sollen → sollte**.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Kako se gradi „als ob\"\n\nAls ob je veznik (kao *weil*, *dass*) — zato **glagol ide na kraj** rečenice, a ispred „als ob\" dolazi **zarez**.",
      },
      {
        type: "table",
        headers: ["Nemački", "Prevod"],
        rows: [
          ["Er spricht so, als ob er der Chef wäre.", "On govori kao da je šef."],
          ["Sie tun so, als ob sie Geld hätten.", "Prave se da imaju novca."],
          ["Du tust so, als ob du arbeiten würdest.", "Praviš se kao da radiš."],
          ["Es sieht aus, als ob es gleich regnen würde.", "Izgleda kao da će uskoro pasti kiša."],
        ],
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "## Redemittel — gotove fraze za utisak i osećaj\n\n**Utisak / izgled:** Er sieht so aus, als ob… · Sie wirkt so, als ob… · Es scheint so, als ob…\n\n**Osećaj / misli:** Es fühlt sich an, als ob… · Ich habe das Gefühl, als ob… · Mir kommt es so vor, als ob…",
      },
      {
        type: "spoiler",
        title: "Mini vežba — dopuni Konjunktiv II",
        items: [
          { question: "Er tut so, als ob er krank ______. (sein)", answer: "wäre" },
          { question: "Du siehst aus, als ob du keine Sorgen ______. (haben)", answer: "hättest" },
          { question: "Sie redet, als ob sie mehr Zeit ______. (haben)", answer: "hätte" },
          { question: "Ihr spielt, als ob ihr Profis ______. (sein)", answer: "wärt" },
          { question: "Du tust so, als ob du nicht zur Party gehen ______. (gehen)", answer: "würdest" },
        ],
      },
      {
        type: "flashcard",
        frontLabel: "Infinitiv",
        backLabel: "Konjunktiv II",
        items: [
          { front: "sein", back: "wäre" },
          { front: "haben", back: "hätte" },
          { front: "können", back: "könnte" },
          { front: "müssen", back: "müsste" },
          { front: "dürfen", back: "dürfte" },
          { front: "sollen", back: "sollte" },
        ],
      },
      {
        type: "text",
        style: "default",
        content:
          "## Als ob vs. realnost 😄\n\nNajlakše se pamti kroz primere — utisak nasuprot stvarnosti:\n\n- *Er lebt, als ob er Millionär wäre.* → Realnost: kredit za telefon i auto još 5 godina.\n- *Er gibt Trinkgeld, als ob er ein Scheich wäre.* → Realnost: na kraju pita može li da se podeli račun.\n- *Sie kocht, als ob eine Hochzeit wäre.* → Realnost: dolaze samo dvoje prijatelja na večeru.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2 · Wenn oder Falls   (Schritte L8 · PDF Wenn-oder-Falls)
  // ─────────────────────────────────────────────────────────────────────────
  {
    order: 1,
    title: "Wenn oder Falls — Konditionalsätze",
    vimeoId: "1194021785",
    sections: [
      { type: "badge", module: "B1.2 · Lektion 8 · Unter Kollegen", category: "grammatik" },
      { type: "video", vimeoId: "1194021785" },
      {
        type: "text",
        style: "info",
        content:
          "**Wenn** i **falls** oba znače „ako\", ali ton je potpuno drugačiji. Kad znaš razliku, zvučiš profesionalnije — naročito u mejlovima.",
      },
      {
        type: "table",
        headers: ["Veznik", "Kada se koristi", "Prevod"],
        rows: [
          ["wenn", "sigurno, ponavljano, očekivano — rutina i pravila", "ako / kada"],
          ["falls", "neizvesno, hipotetičko, formalno — mejlovi, neočekivano", "ukoliko / u slučaju da"],
        ],
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "## WENN — rutina i pravila na poslu\n\n- *Wenn ich morgens ins Büro komme, mache ich mir einen Kaffee.* (svakodnevna rutina)\n- *Wenn die Atmosphäre im Team gut ist, wirkt sich das positiv aus.* (opšte pravilo)\n- *Wenn ein Kollege krank ist, muss er sich krankmelden.* (čvrsto pravilo)",
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "## FALLS — neizvesnost i formalne situacije\n\n- *Falls Sie Fragen zum Auftrag haben, wenden Sie sich bitte an mich.* (ponuda pomoći)\n- *Falls der Kollege seinen Bericht nicht abgibt, gibt es Konsequenzen.* (neizvesno)\n- *Falls jemand plötzlich krank wird, meldet euch bitte bis 8 Uhr.* (mejl timu)",
      },
      {
        type: "mistakes",
        items: [
          {
            wrong: "Falls ich jeden Tag ins Büro komme, trinke ich Kaffee.",
            correct: "Wenn ich jeden Tag ins Büro komme, trinke ich Kaffee.",
            explanation: "„jeden Tag\" = ponavljano → WENN.",
          },
          {
            wrong: "Wenn ein Feuer ausbricht, verlassen Sie das Gebäude.",
            correct: "Falls ein Feuer ausbricht, verlassen Sie das Gebäude.",
            explanation: "Požar je neizvestan, hipotetičan → FALLS.",
          },
        ],
      },
      {
        type: "spoiler",
        title: "Mini vežba — wenn ili falls?",
        items: [
          { question: "______ du Hilfe beim Auftrag brauchst, wende dich an mich. (formalna ponuda)", answer: "Falls" },
          { question: "______ ich nach Hause komme, koche ich Abendessen. (svaki dan)", answer: "Wenn" },
          { question: "______ Sie noch Änderungen haben, geben Sie mir bitte Bescheid. (mejl)", answer: "Falls" },
          { question: "______ das Wetter schön ist, gehen wir spazieren. (uvek tako)", answer: "Wenn" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["der Auftrag", "nalog, zadatak"],
          ["die Konsequenz", "posledica"],
          ["sich wenden an", "obratiti se"],
          ["sich krankmelden", "javiti se da si bolestan"],
          ["plötzlich", "iznenada"],
          ["eventuell", "eventualno"],
        ],
      },
      {
        type: "text",
        style: "default",
        content:
          "**Zapamti:** ponavljanje = *wenn*; neizvesnost i formalni mejl = *falls*. U svakodnevnom govoru ljudi često koriste *wenn* i tamo gde bi moglo *falls* — ali na ispitu znaj razliku!",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3 · Relativsätze mit Präpositionen   (Schritte L8/L12 · PDF · za snimanje)
  // ─────────────────────────────────────────────────────────────────────────
  {
    order: 2,
    title: "Relativsätze mit Präpositionen",
    vimeoId: "1194014794",
    sections: [
      { type: "badge", module: "B1.2 · Lektion 8 · Unter Kollegen", category: "grammatik" },
      { type: "video", vimeoId: "1194014794" },
      {
        type: "text",
        style: "info",
        content:
          "Relativne rečenice sa predlozima zvuče komplikovano, ali imaju jasno pravilo: **predlog uvek ide ISPRED relativne zamenice — nikad na kraj rečenice.** Npr. *Das Projekt, an dem wir arbeiten…*",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Obnavljanje: relativne zamenice\n\nZamenica se poklapa sa rodom imenice na koju se odnosi (ne sa smislom!) i menja se po padežu predloga.",
      },
      {
        type: "table",
        headers: ["Padež", "Maskulin", "Feminin", "Neutrum", "Plural"],
        rows: [
          ["Nominativ", "der", "die", "das", "die"],
          ["Akkusativ", "den", "die", "das", "die"],
          ["Dativ", "dem", "der", "dem", "denen"],
          ["Genitiv", "dessen", "deren", "dessen", "deren"],
        ],
      },
      {
        type: "text",
        style: "default",
        content:
          "Poklapaju se sa određenim članom — **osim u Dativu množine (denen)** i u Genitivu (dessen/deren).",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Predlog + relativna zamenica\n\nMnogi glagoli na poslu traže predlog (*arbeiten an*, *sich bewerben um*, *sich wenden an*, *erzählen von*, *sich kümmern um*). Taj predlog stavljamo ISPRED zamenice.",
      },
      {
        type: "table",
        headers: ["Predlog", "Maskulin", "Feminin", "Neutrum", "Plural"],
        rows: [
          ["von", "von dem", "von der", "von dem", "von denen"],
          ["mit", "mit dem", "mit der", "mit dem", "mit denen"],
          ["bei", "bei dem", "bei der", "bei dem", "bei denen"],
          ["für", "für den", "für die", "für das", "für die"],
          ["um", "um den", "um die", "um das", "um die"],
          ["an", "an dem", "an der", "an dem", "an denen"],
        ],
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "## Primeri iz kancelarije\n\n- *Das ist der Kollege, **von dem** ich dir erzählt habe.* — To je kolega o kome sam ti pričao/la.\n- *Die Firma, **bei der** ich mich beworben habe, ist international.* — Firma kod koje sam se prijavio/la je internacionalna.\n- *Die Kollegen, **mit denen** die Zusammenarbeit so gut funktioniert, sind im dritten Stock.* — Kolege sa kojima saradnja odlično funkcioniše su na trećem spratu.\n- *Der Arbeitsplatz, **auf den** ich so lange gewartet habe, ist perfekt.* — Radno mesto koje sam tako dugo čekao/la je savršeno.",
      },
      {
        type: "mistakes",
        items: [
          {
            wrong: "Der Kollege, von der ich erzählt habe…",
            correct: "Der Kollege, von dem ich erzählt habe…",
            explanation: "„Kollege\" se završava na -e, ali je MUŠKOG roda!",
          },
          {
            wrong: "Die Stelle, ich habe mich beworben für…",
            correct: "Die Stelle, für die ich mich beworben habe…",
            explanation: "Predlog uvek ISPRED zamenice — nikad na kraj.",
          },
          {
            wrong: "Die Kollegen, mit den ich zusammenarbeite…",
            correct: "Die Kollegen, mit denen ich zusammenarbeite…",
            explanation: "Plural u Dativu je uvek DENEN — obavezno sa -n!",
          },
        ],
      },
      {
        type: "spoiler",
        title: "Mini vežba — dopuni predlog + zamenicu",
        items: [
          { question: "Das ist die Chefin, ______ sich alle wenden können. (sich wenden an + Fem.)", answer: "an die" },
          { question: "Der Kollege, ______ ich oft spreche, ist nett. (sprechen mit + Mask.)", answer: "mit dem" },
          { question: "Die Kolleginnen, ______ der Einfluss groß ist, arbeiten hier seit 10 Jahren. (von + Plural)", answer: "von denen" },
          { question: "Die Stelle, ______ ich mich beworben habe, war schon vergeben. (sich bewerben um + Fem.)", answer: "um die" },
        ],
      },
      {
        type: "text",
        style: "default",
        content:
          "## 5 koraka za gradnju\n\n1. Nađi glagol i njegov predlog (npr. *arbeiten an*).\n2. Predlog stavi ISPRED zamenice.\n3. Odredi rod imenice (der/die/das).\n4. Dekliniraj zamenicu po padežu predloga.\n5. Glagol ide na kraj relativne rečenice.",
      },
      {
        type: "vocabulary",
        rows: [
          ["der Auftrag", "nalog, zadatak"],
          ["die Zusammenarbeit", "saradnja"],
          ["der Einfluss", "uticaj"],
          ["der Arbeitsplatz", "radno mesto"],
          ["sich bewerben um", "prijaviti se za"],
          ["sich wenden an", "obratiti se"],
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4 · Futur I — Ich sehe deine Zukunft   (Schritte L13 · PDF · za snimanje)
  // ─────────────────────────────────────────────────────────────────────────
  {
    order: 3,
    title: "Futur I — Ich sehe deine Zukunft",
    vimeoId: "1193593540",
    sections: [
      { type: "badge", module: "B1.2 · Lektion 13 · Zukunft", category: "grammatik" },
      { type: "video", vimeoId: "1193593540" },
      {
        type: "text",
        style: "info",
        content:
          "🔮 Dobro došao/la kod Madame Zukunft — proročice koja proriče samo na nemačkom! U ovoj lekciji učiš **Futur I**: *werden + Infinitiv*. „Du **wirst** sehr gut Deutsch **sprechen**!\"",
      },
      {
        type: "text",
        style: "default",
        content:
          "## Kada se koristi Futur I?\n\n- 🗓 **Planovi:** Ich werde nächsten Monat nach Berlin ziehen.\n- 🔮 **Predviđanja i pretpostavke:** Es wird morgen regnen.\n- 💪 **Obećanja:** Ich werde nie wieder zu spät kommen!\n- 📣 **Snažni zahtevi:** Du wirst jetzt sofort dein Zimmer aufräumen!",
      },
      {
        type: "formula",
        content: "Subjekt + werden (lično) + … + Infinitiv (na kraju!)",
      },
      {
        type: "table",
        headers: ["Lice", "werden", "Primer"],
        rows: [
          ["ich", "werde", "Ich werde Deutsch lernen."],
          ["du", "wirst", "Du wirst es schaffen!"],
          ["er/sie/es", "wird", "Es wird klappen."],
          ["wir", "werden", "Wir werden feiern!"],
          ["ihr", "werdet", "Ihr werdet staunen."],
          ["sie/Sie", "werden", "Sie werden zufrieden sein."],
        ],
      },
      {
        type: "text",
        style: "default",
        content:
          "📌 **Merke:** *werden* se menja, Infinitiv ide na kraj. Kod razdvojivih glagola Infinitiv ostaje cео: *Ich werde früh aufstehen.* ✅ (ne: aufstehen werde)\n\n💡 U svakodnevnom govoru za planove se često koristi **Präsens + vremenska odrednica**: *Ich gehe morgen ins Kino* = *Ich werde morgen ins Kino gehen.* Oba su tačna!",
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "## Bonus: veznik „da\" (= weil, ali na početku)\n\n*da* objašnjava razlog kao *weil*, ali najčešće stoji **na početku** rečenice; glagol ide na kraj zavisne rečenice.\n\n- *Da ich morgen früh aufstehen muss, gehe ich jetzt schlafen.*\n- *Da du so fleißig lernst, wirst du die Prüfung bestehen.*",
      },
      {
        type: "spoiler",
        title: "Mini vežba — dopuni werden",
        items: [
          { question: "Ich ___ nächstes Jahr nach München ziehen.", answer: "werde" },
          { question: "Du ___ das nicht glauben!", answer: "wirst" },
          { question: "Er ___ heute Abend nicht kommen.", answer: "wird" },
          { question: "Ihr ___ staunen, wie schnell ihr Fortschritte macht.", answer: "werdet" },
          { question: "Da du so fleißig lernst, ___ du die Prüfung bestehen.", answer: "wirst" },
        ],
      },
      {
        type: "spoiler",
        title: "Vežba — napravi Futur I rečenicu",
        items: [
          { question: "du / bald / fließend Deutsch / sprechen", answer: "Du wirst bald fließend Deutsch sprechen." },
          { question: "wir / nächstes Jahr / eine Reise / machen", answer: "Wir werden nächstes Jahr eine Reise machen." },
          { question: "ich / nie wieder / zu spät / kommen", answer: "Ich werde nie wieder zu spät kommen." },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["die Umstellung", "promena, prilagođavanje"],
          ["sich gewöhnen an", "naviknuti se na"],
          ["sich einleben", "udomaćiti se"],
          ["das Herkunftsland", "zemlja porekla"],
          ["pünktlich", "tačan"],
          ["Heimweh haben", "čeznuti za domom"],
          ["ankommen", "snaći se, biti prihvaćen"],
        ],
      },
      {
        type: "text",
        style: "default",
        content:
          "🔮 „Du wirst Deutsch meistern — da bin ich mir ganz sicher!\" — Madame Zukunft 🌟",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 5 · Temporalsätze: während / bevor / nachdem   (Schritte L13 · PDF · snimanje)
  // ─────────────────────────────────────────────────────────────────────────
  {
    order: 4,
    title: "Temporalsätze: während · bevor · nachdem",
    vimeoId: null,
    sections: [
      { type: "badge", module: "B1.2 · Lektion 13 · Digitale Welt", category: "grammatik" },
      {
        type: "text",
        style: "info",
        content:
          "Tri veznika koja objašnjavaju **KADA** se nešto dešava: **während** (istovremeno), **bevor** (pre), **nachdem** (posle — radnja je završena). Kod sva tri glagol ide na kraj zavisne rečenice.",
      },
      {
        type: "table",
        headers: ["Veznik", "Značenje", "Prevod", "Vreme"],
        rows: [
          ["während", "istovremeno", "dok", "isto vreme"],
          ["bevor", "prvo druga radnja", "pre nego što", "isto vreme"],
          ["nachdem", "prvo ova radnja, pa glavna", "nakon što", "jedan korak unazad!"],
        ],
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "## WÄHREND — dve stvari u isto vreme\n\n- *Ich höre Musik, während ich die Dateien kopiere.*\n- *Während das Update läuft, trinke ich einen Kaffee.*\n\n## BEVOR — prvo se desi drugo\n\n- *Bevor du den Computer ausschaltest, speichere die Datei!*\n- *Ich mache immer ein Backup, bevor ich das System aktualisiere.*",
      },
      {
        type: "text",
        style: "default",
        content:
          "## NACHDEM — radnja je ZAVRŠENA, pa dolazi glavna\n\nKlju­č je **slaganje vremena — nachdem je uvek jedan korak unazad:**",
      },
      {
        type: "table",
        headers: ["nachdem-rečenica", "Glavna rečenica", "Situacija"],
        rows: [
          ["Perfekt", "Präsens", "sadašnjost / budućnost"],
          ["Plusquamperfekt", "Präteritum", "prošlost"],
        ],
      },
      {
        type: "text",
        style: "beispiele",
        content:
          "- *Nachdem sie die Datei **gespeichert hat**, **schickt** sie die E-Mail.* (Perfekt → Präsens)\n- *Nachdem er den Ordner **gelöscht hatte**, **bemerkte** er den Fehler.* (Plusquamperfekt → Präteritum)",
      },
      {
        type: "mistakes",
        items: [
          {
            wrong: "Bevor ich den Ordner lösche, mache ich eine Kopie — znači prvo brišem.",
            correct: "Bevor ich den Ordner lösche, mache ich eine Sicherungskopie — prvo kopija, pa brisanje.",
            explanation: "Radnja iz glavne rečenice se dešava PRE bevor-radnje.",
          },
        ],
      },
      {
        type: "spoiler",
        title: "Mini vežba — während, bevor ili nachdem?",
        items: [
          { question: "______ du auf den Link klickst, lies den Text! (prvo čitaj)", answer: "Bevor" },
          { question: "______ das Video lädt, schau dir die Kommentare an. (istovremeno)", answer: "Während" },
          { question: "______ ich das Foto hochgeladen habe, teile ich den Link. (posle)", answer: "Nachdem" },
          { question: "Ich höre Podcast, ______ ich die E-Mails beantworte. (istovremeno)", answer: "während" },
        ],
      },
      {
        type: "spoiler",
        title: "Vežba — nachdem: koji oblik glagola?",
        items: [
          { question: "Nachdem er das Programm ______ (installieren), funktioniert alles besser. (glavna: Präsens)", answer: "installiert hat" },
          { question: "Nachdem sie den Link ______ (anklicken), öffnete sich ein Virus. (glavna: Präteritum)", answer: "angeklickt hatte" },
        ],
      },
      {
        type: "vocabulary",
        rows: [
          ["herunterladen", "preuzeti (Perf. heruntergeladen)"],
          ["speichern", "sačuvati"],
          ["ausschalten", "isključiti"],
          ["hochladen", "otpremiti, uploadovati"],
          ["löschen", "obrisati"],
          ["installieren", "instalirati"],
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 6 · Finalsätze: um … zu / damit   (Schritte L14 · PDF · VIDEO)
  // ─────────────────────────────────────────────────────────────────────────
  {
    order: 5,
    title: "Finalsätze: um … zu / damit",
    vimeoId: "1100291090",
    sections: [
      { type: "badge", module: "B1.2 · Lektion 14 · Ziele & Zwecke", category: "grammatik" },
      { type: "video", vimeoId: "1100291090" },
      {
        type: "text",
        style: "info",
        content:
          "Finalsatz pokazuje **cilj ili svrhu** radnje. Odgovara na pitanja **Wozu?** i **Warum?** Imamo dve konstrukcije: **um … zu** i **damit**. Cela poenta je u tome ko je subjekat.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## „um … zu\" — kada je subjekat ISTI\n\nKad je subjekat u glavnoj i u zavisnoj rečenici **isti**, koristimo *um … zu + Infinitiv*. U zavisnoj rečenici nema subjekta, glagol (Infinitiv) ide na kraj.",
      },
      {
        type: "formula",
        content: "Hauptsatz + um + … + zu + Infinitiv\n(isti subjekat u obe rečenice)",
      },
      {
        type: "table",
        headers: ["Nemački", "Prevod"],
        rows: [
          ["Ich lerne Deutsch, um in Deutschland zu arbeiten.", "Učim nemački da bih radio/la u Nemačkoj."],
          ["Wir sparen Geld, um eine Reise zu machen.", "Štedimo novac da bismo otputovali."],
          ["Sie trainiert jeden Tag, um gesund zu bleiben.", "Vežba svaki dan da bi ostala zdrava."],
        ],
      },
      {
        type: "text",
        style: "default",
        content:
          "📌 Kod **razdvojivih glagola** „zu\" ide IZMEĐU prefiksa i glagola: *um pünktlich **anzukommen***, *um einen Termin **auszumachen***.",
      },
      {
        type: "text",
        style: "default",
        content:
          "## „damit\" — kada su subjekti RAZLIČITI\n\nKad subjekat glavne rečenice **nije isti** kao subjekat zavisne, koristimo *damit + subjekat + … + glagol (na kraju)*.",
      },
      {
        type: "formula",
        content: "Hauptsatz + damit + Subjekt + … + Verb (Ende)\n(različiti subjekti)",
      },
      {
        type: "table",
        headers: ["Nemački", "Prevod"],
        rows: [
          ["Ich erkläre es ihm, damit er es versteht.", "Objašnjavam mu da bi (on) razumeo."],
          ["Sie spricht langsam, damit alle sie verstehen.", "Govori sporo da bi je svi razumeli."],
          ["Ich gebe meinem Sohn Geld, damit er ein Buch kaufen kann.", "Dajem sinu novac da bi mogao da kupi knjigu."],
        ],
      },
      {
        type: "mistakes",
        items: [
          {
            wrong: "Ich lerne Deutsch, um in Deutschland arbeiten zu wollen.",
            correct: "Ich lerne Deutsch, um in Deutschland zu arbeiten.",
            explanation: "„um … zu\" već znači nameru — ne kombinuje se sa „wollen\".",
          },
        ],
      },
      {
        type: "spoiler",
        title: "Mini vežba — um … zu ili damit?",
        items: [
          { question: "Ich gehe ins Bett, ______ früh aufzustehen. (isti subjekat)", answer: "um … zu" },
          { question: "Ich wecke ihn, ______ er pünktlich aufsteht. (različiti subjekti)", answer: "damit" },
          { question: "Er kauft ein Wörterbuch, ______ neue Wörter zu lernen. (isti)", answer: "um … zu" },
          { question: "Sie erklärt es noch einmal, ______ alle es verstehen. (različiti)", answer: "damit" },
        ],
      },
      {
        type: "text",
        style: "default",
        content:
          "## Na prvi pogled\n\n1. **Cilj/svrha?** → Finalsatz (Wozu? Warum?)\n2. **Isti subjekat?** → da: *um … zu* · ne: *damit*\n3. Kod razdvojivih glagola: *zu* između prefiksa i glagola. Izbegavaj *wollen*.",
      },
    ],
  },
];
