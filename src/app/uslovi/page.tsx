import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Opšti uslovi poslovanja - Hartweger",
  description: "Opšti uslovi korišćenja platforme Hartweger - uslovi kupovine, pristup kursevima i pravila korišćenja.",
  openGraph: {
    images: [{ url: "/og/share.png", width: 1200, height: 630, alt: "Hartweger - Škola nemačkog jezika" }],
    title: "Opšti uslovi poslovanja - Hartweger",
    description: "Opšti uslovi korišćenja platforme Hartweger.",
  },
};

export default function UsloviPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-plava-light/60 to-white py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-montserrat font-bold text-3xl md:text-4xl text-gray-900 mb-4">
            Opšti uslovi poslovanja
          </h1>
          <p className="text-gray-500">Poslednja izmena: jul 2026.</p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto prose prose-gray max-w-none">

          <h2>1. Video kursevi</h2>
          <ul>
            <li>Pristup video lekcijama i svim materijalima na platformi traje <strong>godinu dana</strong> od dana kupovine.</li>
            <li>Po završetku kursa i ispita polaznik dobija sertifikat HARTWEGER centra.</li>
            <li>Materijali su namenjeni isključivo za ličnu upotrebu - zabranjena je redistribucija, snimanje i deljenje.</li>
          </ul>

          <h2>2. Grupni kursevi</h2>
          <ul>
            <li>Grupe broje od 3 do 6 polaznika.</li>
            <li>Za pokretanje grupe potrebno je minimum 3 polaznika. Ukoliko se ne prijavi dovoljan broj, termin se pomera i polaznik ostaje na listi.</li>
            <li>Časovi se održavaju putem Google Meet platforme.</li>
            <li>Polaznik dobija pristup video lekcijama i svim materijalima na platformi na godinu dana.</li>
          </ul>

          <h3>Otkazivanje grupnog kursa:</h3>
          <ul>
            <li>Dva dana pre početka kursa - povraćaj 100%.</li>
            <li>Prvih 15 dana od početka kursa - povraćaj 50%.</li>
            <li>Nakon 15 dana od početka kursa - bez povraćaja.</li>
          </ul>

          <h2>3. Individualni kursevi</h2>
          <ul>
            <li>Individualne časove polaznik koristi u roku od <strong>3 meseca</strong> od kupovine (6 meseci za paket A1).</li>
            <li>Termine zakazuje polaznik putem Google Calendar linka.</li>
            <li>Otkazivanje zakazanog časa moguće je najkasnije <strong>24 sata pre</strong> termina.</li>
            <li>Neiskorišćeni časovi iz mesečnog paketa se ne prenose u sledeći mesec.</li>
            <li>Pristup video lekcijama i materijalima na platformi traje godinu dana.</li>
          </ul>

          <h2>4. Plaćanje</h2>
          <ul>
            <li>Plaćanje je moguće platnom karticom (Visa, Mastercard, Maestro, DinaCard, American Express), uplatom na dinarski račun ili putem PayPal-a.</li>
            <li>Plaćanje na rate moguće je isključivo karticama Banca Intesa banke (do 6 rata).</li>
            <li>Cene su izražene u dinarima (RSD). Cene u evrima su informativnog karaktera.</li>
          </ul>

          <h3>Mesečno plaćanje (pretplata):</h3>
          <ul>
            <li>Za pojedine kurseve moguće je mesečno plaćanje: kupac pokreće niz od 12 mesečnih naplata sa iste platne kartice, u jednakim iznosima, prema ceni istaknutoj pre potvrde porudžbine.</li>
            <li>Prva naplata se vrši odmah, a svaka naredna istog dana u mesecu, dok se ne izvrši ukupno 12 naplata. Posle poslednje naplate niz prestaje sam i ništa se više ne naplaćuje.</li>
            <li>Za svaku naplatu izdaje se fiskalni račun i šalje na email kupca.</li>
            <li>Sadržaj kursa otvara se postepeno, srazmerno izvršenim naplatama: prvi nivo odmah po prvoj naplati, a poslednji najkasnije po osmoj, posle čega je ceo kurs dostupan do kraja pretplate. Redosled otvaranja istaknut je pre potvrde porudžbine.</li>
            <li>Pristup već otvorenom sadržaju traje dok traju uredne naplate i produžava se sa svakom novom.</li>
            <li><strong>Otkazivanje:</strong> kupac može da otkaže mesečno plaćanje u svakom trenutku, samostalno, u odeljku „Moj nalog" na platformi, opcijom „Otkaži mesečno plaćanje", ili slanjem zahteva na info@hartweger.rs. Otkazivanje zaustavlja sve buduće naplate. Već naplaćeni iznosi se ne vraćaju, a pristup ostaje do isteka poslednjeg plaćenog meseca.</li>
            <li>Ako naplata ne uspe (nedovoljno sredstava, istekla ili blokirana kartica), pristup se ne produžava. Kupac o tome dobija obaveštenje na email.</li>
            <li>Ukupan iznos plaćen kroz mesečno plaćanje veći je od jednokratne cene istog kursa; oba iznosa su istaknuta pre kupovine.</li>
          </ul>

          {/* Odeljci 5-12: obavezne izjave po Uputstvu za rad EPM (Banca Intesa), poglavlje 2.1.
              Tekstovi izjava su standardni bankini tekstovi (konverzija, poverljivi podaci,
              povraćaj, privatnost) - ne menjati ih bez provere sa bankom. */}
          <h2>5. Osnovni podaci o firmi</h2>
          <ul>
            <li><strong>Poslovno ime:</strong> NATAŠA HARTWEGER PR STUDIO ZA UČENJE NEMAČKOG JEZIKA I PREVOĐENJE HARTWEGER BEOGRAD (NOVI BEOGRAD)</li>
            <li><strong>Adresa sedišta:</strong> Jurija Gagarina 20, Beograd (Novi Beograd)</li>
            <li><strong>Delatnost:</strong> Ostalo obrazovanje</li>
            <li><strong>Šifra delatnosti:</strong> 8559</li>
            <li><strong>Matični broj:</strong> 63647357</li>
            <li><strong>Poreski broj (PIB):</strong> 108712117</li>
            <li><strong>Web adresa:</strong> www.hartweger.rs</li>
            <li><strong>Kontakt telefon:</strong> +381 64 615 76 61</li>
            <li><strong>Kontakt e-mail:</strong> info@hartweger.rs</li>
          </ul>

          <h2>6. Izjava o konverziji</h2>
          <p>
            Sva plaćanja biće izvršena u lokalnoj valuti Republike Srbije - dinar (RSD). Za informativni prikaz cena
            u drugim valutama koristi se srednji kurs Narodne banke Srbije. Iznos za koji će biti zadužena
            Vaša platna kartica biće izražen u Vašoj lokalnoj valuti kroz konverziju u istu po kursu koji koriste
            kartičarske organizacije, a koji nama u trenutku transakcije ne može biti poznat. Kao rezultat ove
            konverzije postoji mogućnost neznatne razlike od originalne cene navedene na našem sajtu. Hvala Vam
            na razumevanju.
          </p>

          <h2>7. Dostava - pristup kupljenom sadržaju</h2>
          <p>
            Svi proizvodi na sajtu www.hartweger.rs su digitalni sadržaji i usluge (online kursevi i časovi), pa
            fizička isporuka i troškovi dostave ne postoje. Nakon uspešnog plaćanja karticom pristup kursu se
            aktivira automatski, a kupac na svoju e-mail adresu dobija potvrdu kupovine sa pristupnim linkom za
            platformu. Kod plaćanja uplatnicom ili putem PayPal-a pristup se aktivira po evidentiranju uplate,
            o čemu kupac takođe dobija obaveštenje na e-mail. Kod grupnih i individualnih kurseva termini
            održavanja časova dogovaraju se odnosno biraju nakon kupovine, kako je opisano u odeljcima 2 i 3.
            U slučaju bilo kakvih nejasnoća ili problema sa pristupom kupac nam se može odmah obratiti na
            info@hartweger.rs.
          </p>

          <h2>8. Politika reklamacija</h2>
          <p>
            Ukoliko kupac nije zadovoljan proizvodom koji je poručio (koji mu je omogućen na korišćenje), može
            uložiti žalbu, odnosno reklamirati proizvod najkasnije 15 dana od dana početka korišćenja. Da bi se
            reklamacija uvažila, potrebno je da poručeni proizvod nije korišćen više od 10% od ukupnog sadržaja
            (odnosi se na online kurseve). Reklamacija se može prijaviti na e-mail: info@hartweger.rs.
          </p>
          <p>
            Potrebno je da reklamacija sadrži: identifikacione podatke o kupcu (ime i prezime, e-mail adresu koja
            je prijavljena prilikom porudžbine), broj porudžbine, kao i detaljan opis u čemu se sastoji reklamacija.
          </p>
          <p>
            HARTWEGER pristupa rešavanju svake reklamacije odmah po prijemu, ali u zavisnosti od sadržaja
            reklamacije i potrebe da se istraži više činilaca, krajnji rok za odgovor na reklamaciju je 7 dana od
            dana prijema reklamacije. Nakon uvažavanja reklamacije, trgovac će kupcu, ukoliko je saglasan,
            izvršiti zamenu proizvoda ili, ukoliko kupac želi povraćaj novca, izvršiti povraćaj na isti način na
            koji je izvršena uplata, u celosti iznosa koliko je proizvod plaćen.
          </p>

          <h2>9. Zaštita privatnosti korisnika</h2>
          <p>
            U ime NATAŠA HARTWEGER PR STUDIO ZA UČENJE NEMAČKOG JEZIKA I PREVOĐENJE HARTWEGER BEOGRAD (NOVI
            BEOGRAD) obavezujemo se da ćemo čuvati privatnost svih naših kupaca. Prikupljamo samo neophodne,
            osnovne podatke o kupcima/korisnicima i podatke neophodne za poslovanje i informisanje korisnika u
            skladu sa dobrim poslovnim običajima i u cilju pružanja kvalitetne usluge. Dajemo kupcima mogućnost
            izbora uključujući mogućnost odluke da li žele ili ne da se izbrišu sa mailing lista koje se koriste
            za marketinške kampanje. Svi podaci o korisnicima/kupcima se strogo čuvaju i dostupni su samo
            zaposlenima kojima su ti podaci nužni za obavljanje posla. Svi zaposleni (i poslovni partneri)
            odgovorni su za poštovanje načela zaštite privatnosti. Više detalja u{" "}
            <Link href="/politika-privatnosti" className="text-plava hover:underline">Politici privatnosti</Link>.
          </p>

          <h2>10. Zaštita poverljivih podataka o transakciji</h2>
          <p>
            Prilikom unošenja podataka o platnoj kartici, poverljive informacije se prenose putem javne mreže u
            zaštićenoj (kriptovanoj) formi upotrebom SSL protokola i PKI sistema, kao trenutno najsavremenije
            kriptografske tehnologije. Sigurnost podataka prilikom kupovine garantuje procesor platnih kartica
            Banca Intesa ad Beograd, pa se tako kompletan proces naplate obavlja na stranicama banke. Niti jednog
            trenutka podaci o platnoj kartici nisu dostupni našem sistemu.
          </p>

          <h2>11. Povraćaj sredstava</h2>
          <p>
            U slučaju vraćanja robe i povraćaja sredstava kupcu koji je prethodno platio nekom od platnih
            kartica, delimično ili u celosti, a bez obzira na razlog vraćanja, HARTWEGER je u obavezi da povraćaj
            vrši isključivo preko VISA, Master, Maestro, Amex i Dina metoda plaćanja, što znači da će banka na
            zahtev prodavca obaviti povraćaj sredstava na račun korisnika kartice.
          </p>

          <h2>12. Izjava o PDV-u</h2>
          <p>
            Trgovac NATAŠA HARTWEGER PR STUDIO ZA UČENJE NEMAČKOG JEZIKA I PREVOĐENJE HARTWEGER BEOGRAD (NOVI
            BEOGRAD) je u sistemu PDV-a. Sve cene na sajtu su izražene sa uračunatim PDV-om i nema skrivenih
            troškova.
          </p>

          <h2>13. Zaštita autorskih prava</h2>
          <p>
            Sav sadržaj na platformi (video lekcije, priručnici, vežbe, testovi) je intelektualna svojina HARTWEGER centra.
            Zabranjena je redistribucija, snimanje, kopiranje i deljenje materijala sa trećim licima.
            Kršenje ovih pravila može rezultirati ukidanjem pristupa bez povraćaja sredstava.
          </p>

          <h2>14. Kontakt</h2>
          <p>
            Za sva pitanja, reklamacije i žalbe obratite nam se na{" "}
            <Link href="/kontakt" className="text-plava hover:underline">kontakt formu</Link>{" "}
            ili putem emaila: <strong>info@hartweger.rs</strong>.
          </p>
        </div>
      </section>
    </>
  );
}
