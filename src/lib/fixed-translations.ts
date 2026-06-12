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
 * Izvor: LMS/B1/Prevod B1.2.pdf (Schritte 6, Lektion 8-14 + gramatika).
 */
export interface FixedSentence {
  sr: string;
  de: string;
}

export const FIXED_TRANSLATIONS: Record<string, FixedSentence[]> = {
  // ── Nove tematske lekcije (Schritte L8-14) ───────────────────────────────
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
  "Freundschaften im Job - Leseverstehen und Wortschatz": [
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

  // ── B2.1 (Vielfalt) - po jedan AI-prevod po modulu, gramatika tog modula ──
  // MODUL 1: Nomen mit fester Präposition, kausale Zusammenhänge
  "Das Leben neu gestalten - Vielfalt B2.1": [
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
  "Alles unter Kontrolle? - Ernährung": [
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
  // ── B2.1 - preostale tematske lekcije ───────────────────────────────────
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
  "Extrem unter Kontrolle - Lena auf Expedition": [
    { sr: "On rado preuzima rizike.", de: "Er geht gern Risiken ein." },
    { sr: "Da bi poboljšao kondiciju, trči svaki dan.", de: "Um seine Kondition zu verbessern, läuft er jeden Tag." },
    { sr: "Na velikoj visini telo radi punom snagom.", de: "In großer Höhe arbeitet der Körper auf Hochtouren." },
    { sr: "Uprkos naporu, nije odustala.", de: "Trotz der Anstrengung hat sie nicht aufgegeben." },
    { sr: "Izdržljivost i koordinacija su pri penjanju presudni.", de: "Ausdauer und Koordination sind beim Klettern entscheidend." },
    { sr: "Skakanje padobranom mi je previše rizično.", de: "Fallschirmspringen ist mir zu riskant." },
  ],
  "So tickt unsere innere Uhr! - Tagesrhythmus": [
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

  // ── A2.1 - fiksne rečenice za prevod (ključ = naslov lekcije) ─────────────
  "Persönliche Angaben": [
    { sr: "Imam dvoje dece i jednog brata.", de: "Ich habe zwei Kinder und einen Bruder." },
    { sr: "Zašto učiš nemački?", de: "Warum lernst du Deutsch?" },
    { sr: "Moji roditelji žive u Srbiji.", de: "Meine Eltern leben in Serbien." },
    { sr: "Učim nemački jer radim u Nemačkoj.", de: "Ich lerne Deutsch, weil ich in Deutschland arbeite." },
    { sr: "Imaš li braću i sestre?", de: "Hast du Geschwister?" },
    { sr: "Nemam decu, ali imam dvoje braće i sestara.", de: "Ich habe keine Kinder, aber ich habe zwei Geschwister." },
  ],
  "Familie": [
    { sr: "Moj šurak je penzioner.", de: "Mein Schwager ist Rentner." },
    { sr: "Moji baba i deda žive u malom gradu.", de: "Meine Großeltern leben in einer kleinen Stadt." },
    { sr: "Ona je razvedena i sama podiže decu.", de: "Sie ist geschieden und alleinerziehend." },
    { sr: "Moja zaova ima sina i ćerku - to su moj bratanac i moja bratanica.", de: "Meine Schwägerin hat einen Sohn und eine Tochter - das sind mein Neffe und meine Nichte." },
    { sr: "Moja unuka ima tri godine.", de: "Meine Enkelin ist drei Jahre alt." },
    { sr: "Sutra dolaze rođaci u posetu.", de: "Morgen kommen die Verwandten zu Besuch." },
  ],
  "Perfekt": [
    { sr: "Jutros sam ustala u šest sati.", de: "Ich bin heute Morgen um sechs Uhr aufgestanden." },
    { sr: "Zaboravila sam da ga pozovem.", de: "Ich habe vergessen, ihn anzurufen." },
    { sr: "On je kupio hleb i doneo kolač.", de: "Er hat Brot eingekauft und einen Kuchen mitgebracht." },
    { sr: "Pozvala sam ga na večeru.", de: "Ich habe ihn zum Abendessen eingeladen." },
    { sr: "Kad si se vratio iz Berlina?", de: "Wann bist du aus Berlin zurückgekommen?" },
    { sr: "Film je počeo u osam i ona nije razumela ništa.", de: "Der Film hat um acht angefangen und sie hat nichts verstanden." },
  ],
  "Wie wohnen die Deutschen?": [
    { sr: "Stan ima tri sobe - spavaću sobu, dnevnu sobu i kuhinju.", de: "Die Wohnung hat drei Zimmer - ein Schlafzimmer, ein Wohnzimmer und eine Küche." },
    { sr: "Kolika je kirija?", de: "Wie hoch ist die Miete?" },
    { sr: "Kupatilo je malo, ali hodnik je veliki.", de: "Das Badezimmer ist klein, aber der Flur ist groß." },
    { sr: "Stan ima 65 kvadratnih metara.", de: "Die Wohnung hat 65 Quadratmeter." },
    { sr: "Stanodavac kaže da su režije uključene.", de: "Der Vermieter sagt, dass die Nebenkosten inklusive sind." },
    { sr: "U podrumu imamo dodatno mesto za stvari.", de: "Im Keller haben wir extra Platz für Sachen." },
  ],
  "Müll": [
    { sr: "U Nemačkoj se smeće razdvaja.", de: "In Deutschland trennt man den Müll." },
    { sr: "Baci limenku u žutu kantu za smeće.", de: "Wirf die Dose in die gelbe Mülltonne!" },
    { sr: "Ova kutija je od kartona - ne bacaj je u obični otpad.", de: "Diese Schachtel ist aus Karton - wirf sie nicht in den Restmüll!" },
    { sr: "Staklene flaše bacamo u kontejner za staklo.", de: "Glasflaschen werfen wir in den Glascontainer." },
    { sr: "Gde da bacim ovu kesu?", de: "Wo soll ich diese Tüte wegwerfen?" },
    { sr: "Ostatke hrane stavi u bio otpad.", de: "Wirf die Essensreste in den Biomüll!" },
  ],
  "Wechselpräpositionen": [
    { sr: "Lampa stoji na stolu.", de: "Die Lampe steht auf dem Tisch." },
    { sr: "Stavi knjige na sto.", de: "Leg die Bücher auf den Tisch!" },
    { sr: "Slika visi iznad sofe.", de: "Das Bild hängt über dem Sofa." },
    { sr: "Obesi jaknu iza vrata.", de: "Häng die Jacke hinter die Tür!" },
    { sr: "Sto stoji između prozora i ormara.", de: "Der Tisch steht zwischen dem Fenster und dem Schrank." },
    { sr: "Mačka leži pod stolom.", de: "Die Katze liegt unter dem Tisch." },
  ],
  "Allgemeine Kommunikation": [
    { sr: "Uđi, napolju je hladno!", de: "Komm rein, draußen ist es kalt!" },
    { sr: "Moram da brzo izađem napolje.", de: "Ich muss kurz rausgehen." },
    { sr: "Možeš li da dođeš do mene?", de: "Kannst du rüberkommen?" },
    { sr: "Lift je u kvaru, moramo da idemo stepenicama.", de: "Der Aufzug ist kaputt, wir müssen die Treppe nehmen." },
    { sr: "Molim te, iznesi smeće dole!", de: "Bring bitte den Müll runter!" },
    { sr: "Stepenice su previše strme za moju baku.", de: "Die Treppe ist zu steil für meine Oma." },
  ],
  "Essgewohnheiten": [
    { sr: "Za doručak jedem zobene pahuljice sa orasima.", de: "Zum Frühstück esse ich Haferflocken mit Nüssen." },
    { sr: "Volim mineralnu vodu bez gasa.", de: "Ich mag Mineralwasser ohne Kohlensäure." },
    { sr: "Nemam vremena za kuvanje, pa jedem gotova jela.", de: "Ich habe keine Zeit zum Kochen, deshalb esse ich Fertiggerichte." },
    { sr: "Za ručak jedemo povrće i sendviče.", de: "Zum Mittagessen essen wir Gemüse und belegte Brote." },
    { sr: "Deca vole čokoladice i slatkiše.", de: "Die Kinder mögen Schokoriegel und Süßigkeiten." },
    { sr: "Kupila sam zamrznutu picu za večeras.", de: "Ich habe eine Tiefkühlpizza für heute Abend gekauft." },
  ],
  "Im Restaurant": [
    { sr: "Jeste li već izabrali?", de: "Haben Sie schon gewählt?" },
    { sr: "Je li vam prijalo?", de: "Hat es Ihnen geschmeckt?" },
    { sr: "Želim šniclu sa prilogom, molim.", de: "Ich möchte ein Schnitzel mit Beilage, bitte." },
    { sr: "Za desert uzimam sladoled sa šlagom.", de: "Als Nachspeise nehme ich Eis mit Sahne." },
    { sr: "Mogu li da dobijem račun?", de: "Kann ich bitte die Rechnung bekommen?" },
    { sr: "To je ukupno 26,90€ - napojnica je uključena.", de: "Das macht 26,90€ - das Trinkgeld ist inklusive." },
  ],
  "Indefinitpronomen im Nominativ und Akkusativ": [
    { sr: "Na stolu nema nijedne viljuške.", de: "Auf dem Tisch ist keine Gabel." },
    { sr: "Treba mi nož i kašika.", de: "Ich brauche ein Messer und einen Löffel." },
    { sr: "Imaš li još jednu šolju?", de: "Hast du noch eine Tasse?" },
    { sr: "Tanjir je prazan, ali salveta je prljava.", de: "Der Teller ist leer, aber die Serviette ist schmutzig." },
    { sr: "Koje sastojke treba da kupim?", de: "Welche Zutaten soll ich kaufen?" },
    { sr: "Ovaj tiganj je u ponudi.", de: "Diese Pfanne ist im Angebot." },
  ],
  "Arbeitsklima": [
    { sr: "Kolega mi se obratio sa \"ti\".", de: "Mein Kollege hat mich geduzt." },
    { sr: "Da li si zaposlen ili radiš za sebe?", de: "Bist du angestellt oder selbstständig?" },
    { sr: "Ona radi skraćeno i ima dobru platu.", de: "Sie arbeitet Teilzeit und hat einen guten Lohn." },
    { sr: "Zahvalio sam se koleginici na pomoći.", de: "Ich habe mich bei der Kollegin für die Hilfe bedankt." },
    { sr: "On je dao otkaz i sada traži novi posao.", de: "Er hat gekündigt und sucht jetzt einen neuen Job." },
    { sr: "Želim da napravim karijeru u jednoj izdavačkoj kući.", de: "Ich möchte Karriere in einem Verlag machen." },
  ],
  "Bewerbungen": [
    { sr: "Napisala sam prijavu i poslala biografiju.", de: "Ich habe eine Bewerbung geschrieben und den Lebenslauf geschickt." },
    { sr: "Našao sam zanimljiv oglas za posao.", de: "Ich habe eine interessante Stellenanzeige gefunden." },
    { sr: "Imam pet godina radnog iskustva.", de: "Ich habe fünf Jahre Berufserfahrung." },
    { sr: "Sutra imam razgovor za posao.", de: "Morgen habe ich ein Vorstellungsgespräch." },
    { sr: "Prijavljujem se za mesto u jednoj firmi.", de: "Ich bewerbe mich um eine Stelle in einer Firma." },
    { sr: "Poslodavac želi da vidi svedočanstvo i kvalifikacije.", de: "Der Arbeitgeber möchte das Zeugnis und die Qualifikationen sehen." },
  ],
  "Arbeitszeit, Urlaubs- und Feiertage": [
    { sr: "Zaposleni u Nemačkoj imaju u proseku 30 dana odmora.", de: "Arbeitnehmer in Deutschland haben durchschnittlich 30 Urlaubstage." },
    { sr: "Zakonsko radno vreme iznosi 40 sati nedeljno.", de: "Die gesetzliche Arbeitszeit beträgt 40 Stunden pro Woche." },
    { sr: "Koliko prekovremenih sati imaš ovog meseca?", de: "Wie viele Überstunden hast du diesen Monat?" },
    { sr: "Prosek je oko 10 državnih praznika godišnje.", de: "In Deutschland gibt es im Durchschnitt etwa 10 Feiertage pro Jahr." },
    { sr: "Moj poslodavac kaže da ne smem da radim prekovremeno.", de: "Mein Arbeitgeber sagt, dass ich keine Überstunden machen darf." },
  ],
  "Refleksivni glagoli": [
    { sr: "Ujutru se tuširam i oblačim.", de: "Morgens dusche ich mich und ziehe mich an." },
    { sr: "Vikendom se odmaramo i opuštamo.", de: "Am Wochenende ruhen wir uns aus und entspannen uns." },
    { sr: "Kako se osećaš danas?", de: "Wie fühlst du dich heute?" },
    { sr: "Ona se zdravo hrani i mnogo se kreće.", de: "Sie ernährt sich gesund und bewegt sich viel." },
    { sr: "Moram da se presvučem pre nego što izađem.", de: "Ich muss mich umziehen, bevor ich rausgehe." },
    { sr: "On se češlja, a ona se šminka.", de: "Er kämmt sich und sie schminkt sich." },
  ],
  "Ich interessiere mich für…": [
    { sr: "Interesujem se za nemački jezik.", de: "Ich interessiere mich für die deutsche Sprache." },
    { sr: "Radujem se raspustu!", de: "Ich freue mich auf den Urlaub!" },
    { sr: "On se žali na buku iz komšiluka.", de: "Er beschwert sich über den Lärm aus der Nachbarschaft." },
    { sr: "Sećaš li se prvog dana u školi?", de: "Erinnerst du dich an den ersten Schultag?" },
    { sr: "Zadovoljna sam svojim novim stanom.", de: "Ich bin zufrieden mit meiner neuen Wohnung." },
    { sr: "Ona se raduje poklonu i priča o putovanju.", de: "Sie freut sich über das Geschenk und erzählt von der Reise." },
  ],
  "Fußball": [
    { sr: "Koja ekipa je pobedila?", de: "Welche Mannschaft hat gewonnen?" },
    { sr: "Savezna liga je najpopularnija liga u Nemačkoj.", de: "Die Bundesliga ist die beliebteste Liga in Deutschland." },
    { sr: "Sudija je svirao kraj utakmice.", de: "Der Schiedsrichter hat das Spiel abgepfiffen." },
    { sr: "U kom klubu on igra?", de: "In welchem Verein spielt er?" },
    { sr: "Stadion je pun - ima 50.000 gledalaca.", de: "Das Stadion ist voll - es gibt 50.000 Zuschauer." },
    { sr: "Izgubili smo 2:1, ali smo dali jedan gol.", de: "Wir haben 2:1 verloren, aber wir haben ein Tor geschossen." },
  ],
  "Worauf, darauf": [
    { sr: "Na šta čekaš? - Na autobus.", de: "Worauf wartest du? - Auf den Bus." },
    { sr: "Na šta se žališ? - Na buku.", de: "Worüber beschwerst du dich? - Über den Lärm." },
    { sr: "Čime si zadovoljan? - Svojom ocenom.", de: "Womit bist du zufrieden? - Mit meiner Note." },
    { sr: "Ne mogu da se odreknem kafe.", de: "Ich kann nicht auf Kaffee verzichten." },
    { sr: "Torta se sastoji od brašna, šećera i jaja.", de: "Die Torte besteht aus Mehl, Zucker und Eiern." },
    { sr: "Za šta se interesuješ? - Za sport.", de: "Wofür interessierst du dich? - Für Sport." },
  ],
  "Modalni glagoli u prošlosti": [
    { sr: "Kao dete nisam smela da izlazim sama.", de: "Als Kind durfte ich nicht alleine ausgehen." },
    { sr: "Hteo sam da naučim nemački, ali nisam mogao da nađem kurs.", de: "Ich wollte Deutsch lernen, aber ich konnte keinen Kurs finden." },
    { sr: "Morala sam da radim do deset sati uveče.", de: "Ich musste bis zehn Uhr abends arbeiten." },
    { sr: "Trebalo je da pozovem lekara.", de: "Ich sollte den Arzt anrufen." },
    { sr: "Ovde se ne sme pušiti.", de: "Hier darf man nicht rauchen." },
    { sr: "Da li si mogao da razumeš sve?", de: "Konntest du alles verstehen?" },
  ],
  "Schule - Deutschlandlabor": [
    { sr: "U Nemačkoj deca idu u osnovnu školu sa šest godina.", de: "In Deutschland gehen die Kinder mit sechs Jahren in die Grundschule." },
    { sr: "Posle osnovne škole, on je otišao u gimnaziju.", de: "Nach der Grundschule ist er aufs Gymnasium gegangen." },
    { sr: "U Nemačkoj postoji obavezno školovanje.", de: "In Deutschland gibt es die Schulpflicht." },
    { sr: "Moje dete ide u produženi boravak posle nastave.", de: "Mein Kind geht nach dem Unterricht in den Hort." },
    { sr: "Deca dobijaju školsku torbu sa slatkišima prvog dana.", de: "Die Kinder bekommen am ersten Tag eine Schultüte mit Süßigkeiten." },
    { sr: "Sledeće nedelje idemo na školski izlet.", de: "Nächste Woche gehen wir auf Klassenfahrt." },
  ],
  "Ausbildung in Deutschland": [
    { sr: "Obuka u Nemačkoj traje obično tri godine.", de: "Die Ausbildung in Deutschland dauert normalerweise drei Jahre." },
    { sr: "On je učenik u jednoj firmi i ide u stručnu školu.", de: "Er ist Azubi in einem Betrieb und geht in die Berufsschule." },
    { sr: "Posle studija želim da radim u Nemačkoj.", de: "Nach dem Studium möchte ich in Deutschland arbeiten." },
    { sr: "Obuka je kombinacija prakse u firmi i škole.", de: "Die Ausbildung ist eine Kombination aus Praxis im Betrieb und Schule." },
    { sr: "Mnogi mladi u Nemačkoj biraju obuku umesto studija.", de: "Viele junge Leute in Deutschland machen eine Ausbildung und kein Studium." },
  ],
};

/** Vraća fiksne rečenice za naslov lekcije, ili null ako ih nema. */
export function getFixedTranslations(lessonTitle: string): FixedSentence[] | null {
  return FIXED_TRANSLATIONS[lessonTitle] ?? null;
}
