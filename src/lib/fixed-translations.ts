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

  // ── B2.1 (Vielfalt) — po jedan AI-prevod po modulu, gramatika tog modula ──
  // MODUL 1: Nomen mit fester Präposition, kausale Zusammenhänge
  "Das Leben neu gestalten – Vielfalt B2.1": [
    { sr: "Mnogi ljudi imaju strah od neuspeha.", de: "Viele Menschen haben Angst vor dem Misserfolg." },
    { sr: "Doneo je odluku da iz temelja promeni svoj život.", de: "Er hat die Entscheidung getroffen, sein Leben komplett zu verändern." },
    { sr: "Pošto je bio nezadovoljan, krenuo je novim putem.", de: "Weil er unzufrieden war, schlug er einen neuen Weg ein." },
    { sr: "Njeno oduševljenje prirodom je veliko.", de: "Ihre Begeisterung für die Natur ist groß." },
    { sr: "Posle nesreće preispitao je ceo svoj život.", de: "Nach dem Unfall hinterfragte er sein ganzes Leben." },
    { sr: "Nije lako zarađivati za život kao instruktor surfovanja.", de: "Es ist nicht leicht, sich seinen Lebensunterhalt als Surflehrer zu verdienen." },
  ],
  // MODUL 2: konditionale Zusammenhänge, zweiteilige Konnektoren
  "Berufliche Kompetenzen": [
    { sr: "Kada bi svi bili fleksibilniji, timski rad bi bolje funkcionisao.", de: "Wenn alle flexibler wären, würde die Teamarbeit besser funktionieren." },
    { sr: "Dobra šefica ne samo da deli zadatke, nego i ukazuje poštovanje.", de: "Eine gute Chefin gibt nicht nur Aufgaben ab, sondern bringt auch Wertschätzung entgegen." },
    { sr: "Zaposleni moraju biti otvoreni i za kritiku i za promene.", de: "Die Mitarbeiter müssen sowohl für Kritik als auch für Veränderungen offen sein." },
    { sr: "Ili preuzimaš odgovornost, ili prepuštaš odluku drugima.", de: "Entweder übernimmst du die Verantwortung, oder du überlässt die Entscheidung anderen." },
    { sr: "Po mom mišljenju, ravne hijerarhije motivišu zaposlene.", de: "Meines Erachtens motivieren flache Hierarchien die Mitarbeiter." },
    { sr: "Da je bila otvorenija, lakše bi rešila konflikt.", de: "Wäre sie offener gewesen, hätte sie den Konflikt leichter gelöst." },
  ],
  // MODUL 3: Passiv / Passiversatz, finale Zusammenhänge
  "Alles unter Kontrolle? – Ernährung": [
    { sr: "Jelo se priprema od svežih namirnica.", de: "Das Essen wird aus frischen Lebensmitteln zubereitet." },
    { sr: "Problem sa ishranom može da se reši.", de: "Das Problem mit der Ernährung lässt sich lösen." },
    { sr: "Jedem zdravo da bih ostao u formi.", de: "Ich esse gesund, um fit zu bleiben." },
    { sr: "Kalorije se lako mogu izmeriti.", de: "Die Kalorien lassen sich leicht messen." },
    { sr: "Hranljive materije su važne za telo.", de: "Die Nährstoffe sind wichtig für den Körper." },
    { sr: "Da bi se snizio šećer u krvi, treba jesti manje slatkiša.", de: "Um den Blutzucker zu senken, sollte man weniger Süßigkeiten essen." },
  ],
  // MODUL 4: temporale & modale Zusammenhänge
  "Erfolg und Scheitern im Beruf": [
    { sr: "Pošto je doživeo neuspeh, započeo je nešto novo.", de: "Nachdem er gescheitert war, fing er etwas Neues an." },
    { sr: "Učio je iz svojih grešaka tako što je razmišljao o njima.", de: "Er lernte aus seinen Fehlern, indem er über sie nachdachte." },
    { sr: "Otkad je samostalan, srećniji je.", de: "Seit er selbstständig ist, ist er glücklicher." },
    { sr: "Umesto da odustane, potražio je pomoć.", de: "Anstatt aufzugeben, suchte er Hilfe." },
    { sr: "Pre nego što je doneo odluku, dugo je razmišljao.", de: "Bevor er die Entscheidung traf, dachte er lange nach." },
    { sr: "Uspeh i neuspeh su dve strane iste medalje.", de: "Erfolg und Scheitern sind zwei Seiten derselben Medaille." },
  ],
  // ── B2.1 — preostale tematske lekcije ───────────────────────────────────
  "Migration": [
    { sr: "Moji preci su emigrirali iz ekonomskih razloga.", de: "Meine Vorfahren sind aus wirtschaftlichen Gründen emigriert." },
    { sr: "Morala je da pobegne iz svoje domovine.", de: "Sie musste aus ihrer Heimat fliehen." },
    { sr: "Posle rata su se vratili u svoju zemlju.", de: "Nach dem Krieg sind sie in ihr Land zurückgekehrt." },
    { sr: "Njegovi roditelji su došli kao gastarbajteri.", de: "Seine Eltern sind als Gastarbeiter gekommen." },
    { sr: "Mnogi useljenici žele da poboljšaju uslove života.", de: "Viele Einwanderer wollen ihre Lebensbedingungen verbessern." },
    { sr: "Da bi se integrisao, brzo je naučio jezik.", de: "Um sich zu integrieren, hat er schnell die Sprache gelernt." },
  ],
  "WIEN": [
    { sr: "Rado šeta starim gradom Beča.", de: "Er schlendert gern durch die Altstadt von Wien." },
    { sr: "Pošto nedeljom ima vremena, ide u svoj omiljeni lokal.", de: "Weil er sonntags Zeit hat, geht er in sein Stammlokal." },
    { sr: "Oduševljena je arhitekturom grada.", de: "Sie ist von der Architektur der Stadt begeistert." },
    { sr: "Sa tornja katedrale pruža se divan pogled.", de: "Vom Turm des Doms hat man einen wunderbaren Blick." },
    { sr: "Završila je studije i postala gradski vodič.", de: "Sie hat ihr Studium abgeschlossen und ist Stadtführerin geworden." },
    { sr: "U nacionalnom parku oseća se kao kod kuće.", de: "Im Nationalpark fühlt er sich wie zu Hause." },
  ],
  "Erwartungen in der Familie B2.1": [
    { sr: "Roditelji često vrše pritisak na svoju decu.", de: "Eltern setzen ihre Kinder oft unter Druck." },
    { sr: "Kada bi bilo više poverenja, bilo bi manje sukoba.", de: "Wenn es mehr Vertrauen gäbe, gäbe es weniger Konflikte." },
    { sr: "Deca bi trebalo da idu svojim putem.", de: "Kinder sollten ihren eigenen Weg gehen." },
    { sr: "Nije ispunio očekivanja svojih roditelja.", de: "Er hat die Erwartungen seiner Eltern nicht erfüllt." },
    { sr: "Sloga u porodici mu je veoma važna.", de: "Der Zusammenhalt in der Familie ist ihm sehr wichtig." },
    { sr: "Da je razgovarao sa njima, bolje bi se razumeli.", de: "Hätte er mit ihnen gesprochen, hätten sie sich besser verstanden." },
  ],
  "Das eigene Profil schärfen": [
    { sr: "Trebalo bi da svoje profile međusobno uskladiš.", de: "Du solltest deine Profile aufeinander abstimmen." },
    { sr: "Profesionalan nastup je na internetu veoma važan.", de: "Ein professioneller Auftritt ist im Netz sehr wichtig." },
    { sr: "Umrežava se sa drugima preko društvenih mreža.", de: "Er vernetzt sich über soziale Netzwerke mit anderen." },
    { sr: "Privatni imidž ne sme da protivreči poslovnom.", de: "Das private Image sollte dem beruflichen nicht widersprechen." },
    { sr: "Mnogi korisnici odmah kliknu dalje ako je video predugačak.", de: "Viele Nutzer klicken sofort weg, wenn das Video zu lang ist." },
    { sr: "Objavila je novi prilog na svom kanalu.", de: "Sie hat einen neuen Beitrag auf ihrem Kanal gepostet." },
  ],
  "Extrem unter Kontrolle – Lena auf Expedition": [
    { sr: "On rado preuzima rizike.", de: "Er geht gern Risiken ein." },
    { sr: "Da bi poboljšao kondiciju, trči svaki dan.", de: "Um seine Kondition zu verbessern, läuft er jeden Tag." },
    { sr: "Na velikoj visini telo radi punom snagom.", de: "In großer Höhe arbeitet der Körper auf Hochtouren." },
    { sr: "Uprkos naporu, nije odustala.", de: "Trotz der Anstrengung hat sie nicht aufgegeben." },
    { sr: "Izdržljivost i koordinacija su pri penjanju presudni.", de: "Ausdauer und Koordination sind beim Klettern entscheidend." },
    { sr: "Skakanje padobranom mi je previše rizično.", de: "Fallschirmspringen ist mir zu riskant." },
  ],
  "So tickt unsere innere Uhr! – Tagesrhythmus": [
    { sr: "Ja sam ranoranilac, dok moj brat dugo spava.", de: "Ich bin Frühaufsteher, während mein Bruder lange schläft." },
    { sr: "Unutrašnji sat određuje kada postajemo umorni.", de: "Die innere Uhr bestimmt, wann wir müde werden." },
    { sr: "Ujutru bi trebalo upijati mnogo dnevne svetlosti.", de: "Morgens sollte man viel Tageslicht aufnehmen." },
    { sr: "Ujutru je fit, a uveče naprotiv umoran.", de: "Morgens ist er fit, abends dagegen müde." },
    { sr: "Ko radi noću, na duge staze ne živi zdravo.", de: "Wer nachts arbeitet, lebt auf Dauer nicht gesund." },
    { sr: "Dnevni ritam leži u genima.", de: "Der Tagesrhythmus liegt in den Genen." },
  ],
  "Minimalismus": [
    { sr: "Štedim novac tako što kupujem manje.", de: "Ich spare Geld, indem ich weniger kaufe." },
    { sr: "Umesto da kupuje nove stvari, popravlja stare.", de: "Anstatt neue Dinge zu kaufen, repariert sie alte." },
    { sr: "Rastao se od mnogih nepotrebnih stvari.", de: "Er hat sich von vielen unnötigen Dingen getrennt." },
    { sr: "Ko ima manje, mora manje da brine o imovini.", de: "Wer weniger hat, muss sich weniger um den Besitz kümmern." },
    { sr: "Živi održivije time što manje baca.", de: "Sie lebt nachhaltiger, indem sie weniger wegwirft." },
    { sr: "Manje je ponekad više.", de: "Weniger ist manchmal mehr." },
  ],
  "Nachbarschaft 2.0": [
    { sr: "Alat se može pozajmiti preko aplikacije.", de: "Das Werkzeug lässt sich über die App leihen." },
    { sr: "Mnogi ljudi čeznu za zajednicom.", de: "Viele Menschen sehnen sich nach einer Gemeinschaft." },
    { sr: "U aplikaciji se mogu deliti kućni aparati.", de: "In der App lassen sich Haushaltsgeräte teilen." },
    { sr: "Tako štedimo resurse i ostajemo u kontaktu.", de: "So sparen wir Ressourcen und bleiben in Kontakt." },
    { sr: "Susedi se preko platforme lako umrežavaju.", de: "Über die Plattform vernetzen sich die Nachbarn leicht." },
    { sr: "Komšiluk se ponekad doživljava kao socijalna kontrola.", de: "Die Nachbarschaft wird manchmal als soziale Kontrolle wahrgenommen." },
  ],
};

/** Vraća fiksne rečenice za naslov lekcije, ili null ako ih nema. */
export function getFixedTranslations(lessonTitle: string): FixedSentence[] | null {
  return FIXED_TRANSLATIONS[lessonTitle] ?? null;
}
