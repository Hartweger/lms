/**
 * Fiksni prevodi za AI-prevod vežbu (B1.2).
 *
 * Pravilo: prevod = FIKSNE rečenice iz baze/koda (ne AI-generisane).
 * /api/ai-translate vraća ove rečenice kad postoje za dati naslov lekcije;
 * u suprotnom pada na AI-generisanje.
 *
 * Ključ = TAČAN naslov lekcije (lessons.title). Dugme „AI prevod" se na
 * lekciji prikazuje samo ako naslov postoji u ovoj mapi.
 *
 * Izvor: LMS/B1/Prevod B1.2.pdf (Schritte 6, Lektion 8–14 + gramatika).
 */
export interface FixedSentence {
  sr: string;
  de: string;
}

export const FIXED_TRANSLATIONS: Record<string, FixedSentence[]> = {
  // ── Nove tematske lekcije (Schritte L8–14) ───────────────────────────────
  "Familie, Generationen und Lebensformen": [
    { sr: "Danas mnogi mladi ljudi žive u životnim zajednicama.", de: "Heute leben viele junge Menschen in Wohngemeinschaften." },
    { sr: "Moji roditelji imaju drugačije mišljenje o vaspitanju dece.", de: "Meine Eltern haben eine andere Meinung zur Kindererziehung." },
    { sr: "U našoj porodici su kućni poslovi ravnomerno podeljeni.", de: "In unserer Familie werden die Hausarbeiten gleichmäßig verteilt." },
    { sr: "Mnogi stariji ljudi žive sami.", de: "Viele ältere Menschen leben allein." },
    { sr: "Važno je poštovati različite oblike života.", de: "Es ist wichtig, verschiedene Lebensformen zu respektieren." },
  ],
  "Glück, Erfolg und Lebensziele": [
    { sr: "Moj cilj je da naučim nemački veoma dobro.", de: "Mein Ziel ist es, Deutsch sehr gut zu lernen." },
    { sr: "Uspeh ne zavisi samo od novca.", de: "Erfolg hängt nicht nur vom Geld ab." },
    { sr: "Morao je da donese važnu odluku.", de: "Er musste eine wichtige Entscheidung treffen." },
    { sr: "Mnogi ljudi sanjaju o boljoj budućnosti.", de: "Viele Menschen träumen von einer besseren Zukunft." },
    { sr: "Zadovoljan sam svojim životom.", de: "Ich bin mit meinem Leben zufrieden." },
  ],
  "Ehrenamt und gesellschaftliches Engagement": [
    { sr: "Vikendom volontiram.", de: "Am Wochenende arbeite ich ehrenamtlich." },
    { sr: "Mnogi građani se angažuju za zaštitu životne sredine.", de: "Viele Bürger engagieren sich für den Umweltschutz." },
    { sr: "Želela bi da učestvuje u jednom projektu.", de: "Sie möchte an einem Projekt teilnehmen." },
    { sr: "Dobrovoljni rad je važan za društvo.", de: "Ehrenamtliche Arbeit ist wichtig für die Gesellschaft." },
    { sr: "Mladi ljudi bi trebalo više da se angažuju.", de: "Junge Menschen sollten sich stärker engagieren." },
  ],
  "Politik, Rechte und Pflichten": [
    { sr: "Svaki građanin ima određena prava i obaveze.", de: "Jeder Bürger hat bestimmte Rechte und Pflichten." },
    { sr: "Sledeće nedelje se održavaju izbori.", de: "Nächste Woche finden Wahlen statt." },
    { sr: "Svi moraju da poštuju zakone.", de: "Alle müssen die Gesetze einhalten." },
    { sr: "Važno je informisati se o političkim temama.", de: "Es ist wichtig, sich über politische Themen zu informieren." },
    { sr: "Država podržava različite obrazovne programe.", de: "Der Staat unterstützt verschiedene Bildungsprogramme." },
  ],

  // ── Postojeće lekcije (tema već postoji) ─────────────────────────────────
  "Das Paket ist nicht angekommen": [
    { sr: "Većinu stvari naručujem preko interneta.", de: "Die meisten Dinge bestelle ich im Internet." },
    { sr: "Želeo bih da reklamiram ovaj uređaj.", de: "Ich möchte dieses Gerät reklamieren." },
    { sr: "Ovaj proizvod nije ispunio moja očekivanja.", de: "Dieses Produkt hat meine Erwartungen nicht erfüllt." },
    { sr: "Kupci imaju pravo na povraćaj novca.", de: "Kunden haben das Recht auf eine Rückerstattung." },
    { sr: "Uvek upoređujem cene pre kupovine.", de: "Vor dem Kauf vergleiche ich immer die Preise." },
  ],
  "Freundschaften im Job – Leseverstehen und Wortschatz": [
    { sr: "Pravi prijatelji pomažu jedni drugima u teškim situacijama.", de: "Wahre Freunde helfen einander in schwierigen Situationen." },
    { sr: "Juče smo imali nesporazum, ali smo ga brzo rešili.", de: "Gestern hatten wir ein Missverständnis, aber wir haben es schnell gelöst." },
    { sr: "Važno je otvoreno razgovarati o problemima.", de: "Es ist wichtig, offen über Probleme zu sprechen." },
    { sr: "Veoma cenim njeno poverenje.", de: "Ich schätze ihr Vertrauen sehr." },
    { sr: "Posvađali su se zbog sitnice.", de: "Sie haben sich wegen einer Kleinigkeit gestritten." },
    { sr: "Pokušavam da izbegavam nepotrebne konflikte.", de: "Ich versuche, unnötige Konflikte zu vermeiden." },
  ],
  "Seitdem ich hier lebe": [
    { sr: "Mnogi ljudi napuštaju svoju domovinu zbog posla.", de: "Viele Menschen verlassen ihre Heimat wegen der Arbeit." },
    { sr: "Integracija je važna za zajednički život.", de: "Integration ist wichtig für das Zusammenleben." },
    { sr: "U ovom gradu žive ljudi iz različitih kultura.", de: "In dieser Stadt leben Menschen aus verschiedenen Kulturen." },
    { sr: "On želi da se dobro integriše u novo društvo.", de: "Er möchte sich gut in die neue Gesellschaft integrieren." },
  ],
  "Relativsätze mit Präpositionen": [
    { sr: "To je sve što znam.", de: "Das ist alles, was ich weiß." },
    { sr: "To je mesto gde smo se upoznali.", de: "Das ist der Ort, wo wir uns kennengelernt haben." },
    { sr: "Pokazala mi je nešto što me je iznenadilo.", de: "Sie hat mir etwas gezeigt, was mich überrascht hat." },
    { sr: "To je grad gde želim da živim.", de: "Das ist die Stadt, wo ich leben möchte." },
    { sr: "Sve što je rekao bilo je tačno.", de: "Alles, was er gesagt hat, war richtig." },
    { sr: "Tražim restoran gde mogu da jedem vegetarijansku hranu.", de: "Ich suche ein Restaurant, wo ich vegetarisch essen kann." },
  ],
  "20 glagola za nivo B1": [
    { sr: "Moramo da donesemo važnu odluku.", de: "Wir müssen eine wichtige Entscheidung treffen." },
    { sr: "Ona preuzima veliku odgovornost.", de: "Sie übernimmt große Verantwortung." },
    { sr: "Juče smo stupili u kontakt sa klijentom.", de: "Gestern haben wir mit dem Kunden Kontakt aufgenommen." },
    { sr: "Želim da uputim jednu žalbu.", de: "Ich möchte eine Beschwerde einreichen." },
  ],
  "100 reči za nivo B1": [
    { sr: "Zbog lošeg vremena ostali smo kod kuće.", de: "Wegen des schlechten Wetters sind wir zu Hause geblieben." },
    { sr: "Tokom odmora smo mnogo putovali.", de: "Während des Urlaubs sind wir viel gereist." },
    { sr: "Uprkos problemima nije odustao.", de: "Trotz der Probleme hat er nicht aufgegeben." },
    { sr: "To je automobil mog komšije.", de: "Das ist das Auto meines Nachbarn." },
    { sr: "Zbog bolesti nije došao na posao.", de: "Wegen seiner Krankheit ist er nicht zur Arbeit gekommen." },
    { sr: "Tokom sastanka nije bilo pitanja.", de: "Während der Besprechung gab es keine Fragen." },
  ],
};

/** Vraća fiksne rečenice za naslov lekcije, ili null ako ih nema. */
export function getFixedTranslations(lessonTitle: string): FixedSentence[] | null {
  return FIXED_TRANSLATIONS[lessonTitle] ?? null;
}
