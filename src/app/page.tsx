import type { Metadata } from "next";
import Link from "next/link";
import NewsletterForma from "@/components/NewsletterForma";

export const metadata: Metadata = {
  title: "Hartweger — Online škola nemačkog jezika",
  description:
    "Nauči nemački koji ćeš stvarno koristiti. VoKuM metoda — video kursevi, grupni kursevi i individualni časovi sa Natašom Hartweger.",
};

export default function Pocetna() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-plava-light to-white py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16">
          <div className="flex-1 text-center md:text-left">
            <p className="text-plava font-semibold text-sm tracking-widest uppercase mb-3">
              Online škola nemačkog jezika
            </p>
            <h1 className="font-montserrat font-bold text-4xl md:text-5xl text-gray-900 mb-5 leading-tight">
              Nauči nemački koji ćeš stvarno koristiti
            </h1>
            <p className="text-gray-600 text-lg md:text-xl mb-4 max-w-lg">
              Razvila sam VoKuM metodu uz pomoć koje je već više hiljada ljudi progovorilo.
            </p>
            <p className="text-gray-500 text-base mb-8 max-w-lg">
              VoKabular, KomUnikacija i Motivacija — tri stvari koje zaista prave razliku.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
              <Link
                href="/kursevi"
                className="text-center bg-koral text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-koral-dark transition-colors shadow-lg shadow-koral/20"
              >
                Pogledaj kurseve
              </Link>
              <Link
                href="/besplatno-testiranje"
                className="text-center border-2 border-plava text-plava px-8 py-3.5 rounded-xl font-semibold hover:bg-plava hover:text-white transition-colors"
              >
                Besplatni test nivoa
              </Link>
            </div>
          </div>
          <div className="flex-shrink-0">
            <img
              src="https://www.hartweger.rs/wp-content/uploads/2025/06/Hartweger_Centar_Natasa_Hartweger.jpg"
              alt="Nataša Hartweger"
              className="rounded-2xl shadow-lg max-w-xs md:max-w-md w-full"
            />
          </div>
        </div>
      </section>

      {/* VoKuM metoda */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 text-center mb-4">
            VoKuM metoda
          </h2>
          <p className="text-gray-500 text-center max-w-2xl mx-auto mb-12">
            Tri stuba na kojima počiva uspešno učenje nemačkog jezika
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* VO */}
            <div className="bg-plava-light rounded-2xl p-8 text-center">
              <div className="w-14 h-14 bg-plava text-white rounded-xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                VO
              </div>
              <h3 className="font-montserrat font-bold text-xl text-gray-900 mb-3">Vokabular</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Sve počinje sa rečima. Dete prvo nauči reči, a zatim od njih sklapa rečenicu. Napamet naučene definicije o gramatičkim pravilima ne pomažu kada treba da kažeš da te boli glava ili želiš povišicu na poslu. Na kursu učiš razne tehnike za lakše pamćenje reči.
              </p>
            </div>
            {/* KU */}
            <div className="bg-plava-light rounded-2xl p-8 text-center">
              <div className="w-14 h-14 bg-plava text-white rounded-xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                KU
              </div>
              <h3 className="font-montserrat font-bold text-xl text-gray-900 mb-3">Komunikacija</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Naučene reči postaju vredne kroz praktičnu komunikaciju. Učimo kroz dijaloge u realnim situacijama (restorani, apoteke, banke) i upoznajemo kulturu DACH zemalja. To čini razliku između dobre i loše komunikacije.
              </p>
            </div>
            {/* M */}
            <div className="bg-plava-light rounded-2xl p-8 text-center">
              <div className="w-14 h-14 bg-plava text-white rounded-xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                M
              </div>
              <h3 className="font-montserrat font-bold text-xl text-gray-900 mb-3">Motivacija</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Svakome je potrebna podrška i motivacija. Naš zajednički cilj je da uspešno progovoriš nemački jezik. Odustajanje nije opcija!
              </p>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link
              href="/metodologija"
              className="text-plava font-semibold hover:underline"
            >
              Saznaj više o VoKuM metodi &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Course categories */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 text-center mb-12">
            Izaberi način učenja
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Grupni */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h3 className="font-montserrat font-bold text-xl text-gray-900 mb-2">Grupni kursevi</h3>
              <p className="text-plava font-medium text-sm mb-4">Uči u društvu!</p>
              <ul className="text-gray-600 text-sm space-y-2 mb-6">
                <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Video lekcije dostupne 24/7</li>
                <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Online časovi u grupi</li>
                <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Redovan raspored i struktura</li>
                <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Vežbanje komunikacije na času</li>
                <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Sertifikat HARTWEGER centra</li>
              </ul>
              <Link href="/grupni-kursevi" className="inline-block bg-plava text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-plava/90 transition-colors">
                Saznaj više
              </Link>
            </div>
            {/* Video */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h3 className="font-montserrat font-bold text-xl text-gray-900 mb-2">Video kursevi</h3>
              <p className="text-plava font-medium text-sm mb-4">Uči svojim tempom!</p>
              <ul className="text-gray-600 text-sm space-y-2 mb-6">
                <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Video lekcije dostupne 24/7</li>
                <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Testovi i materijali za vežbanje</li>
                <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Saveti za učenje vokabulara</li>
                <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Sertifikat HARTWEGER centra</li>
                <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Podrška u WhatsApp grupi</li>
              </ul>
              <Link href="/kursevi" className="inline-block bg-plava text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-plava/90 transition-colors">
                Saznaj više
              </Link>
            </div>
            {/* Individualni */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h3 className="font-montserrat font-bold text-xl text-gray-900 mb-2">Individualni kursevi</h3>
              <p className="text-plava font-medium text-sm mb-4">Fokus na tvoje ciljeve</p>
              <ul className="text-gray-600 text-sm space-y-2 mb-6">
                <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Online časovi 1:1 sa profesorom</li>
                <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Program prilagođen tvom cilju</li>
                <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Video lekcije i dodatni materijali</li>
                <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Tempo koji odgovara samo tebi</li>
                <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Sertifikat HARTWEGER centra</li>
              </ul>
              <Link href="/individualni-kursevi" className="inline-block bg-plava text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-plava/90 transition-colors">
                Saznaj više
              </Link>
            </div>
            {/* Za preduzetnice */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h3 className="font-montserrat font-bold text-xl text-gray-900 mb-2">Za preduzetnice</h3>
              <p className="text-plava font-medium text-sm mb-4">Resursi za preduzetnice u edukaciji</p>
              <ul className="text-gray-600 text-sm space-y-2 mb-6">
                <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Autentičan Instagram nastup</li>
                <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Meta oglašavanje</li>
                <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Kreiranje ponude</li>
                <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Digitalni alati u edukaciji</li>
                <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> AI alati u edukaciji</li>
                <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Brend strategija</li>
              </ul>
              <Link href="/za-preduzetnice" className="inline-block bg-plava text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-plava/90 transition-colors">
                Saznaj više
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof stats */}
      <section className="py-16 px-4 bg-plava text-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <p className="font-montserrat font-bold text-4xl md:text-5xl mb-2">65.000+</p>
            <p className="text-plava-light text-sm">pratilaca na Instagramu</p>
          </div>
          <div>
            <p className="font-montserrat font-bold text-4xl md:text-5xl mb-2">529.977+</p>
            <p className="text-plava-light text-sm">pregleda na YouTube-u</p>
          </div>
          <div>
            <p className="font-montserrat font-bold text-4xl md:text-5xl mb-2">3M+</p>
            <p className="text-plava-light text-sm">pregleda videa na Instagramu</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 text-center mb-12">
            Šta kažu naši polaznici
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-gray-600 text-sm leading-relaxed italic mb-4">
                &ldquo;Kao neko ko je krenuo da uči nemački od nule, preporučio bih svakome školu Hartweger. Kursevi su dobro organizovani, lekcije su zabavne, a na raspolaganju ćete dobiti i dovoljno resursa da učite samostalno. Nastavnici su izuzetno ljubazni i pozitivni. Ovde ćete dobiti još veću motivaciju za učenjem.&rdquo;
              </p>
              <p className="font-bold text-gray-900 text-sm">Nikola Stanković</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-gray-600 text-sm leading-relaxed italic mb-4">
                &ldquo;Sve pohvale za školu Hartweger, a posebno za divnu profesorku Suzanu. Odlično predaje i prijateljski je nastrojena, uvek je tu da ohrabri i pomogne, posebno ako se desi da nekad i &apos;zapne&apos;. Časovi su zanimljivi, mnogo je dobrog materijala. Zahvaljujući mojoj profesorki, časovi mi najčešće budu pravo uživanje.&rdquo;
              </p>
              <p className="font-bold text-gray-900 text-sm">Nataša Starčević</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-gray-600 text-sm leading-relaxed italic mb-4">
                &ldquo;Položila sam A1 nemački lako zahvaljujući kursu u školi Hartweger. Natašin način objašnjavanja i njena harizma su mi pomogle da se opredelim za ovu školu. Moram pohvaliti profesorku Milicu Vučić koja je izvrsni predavač i koja mi je stalno ulivala samopouzdanje. Teme su usko vezane sa temama na ispitu.&rdquo;
              </p>
              <p className="font-bold text-gray-900 text-sm">Milena Radojević</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-gray-600 text-sm leading-relaxed italic mb-4">
                &ldquo;Pohađala sam dva nivoa u Hartweger školi jezika — jedan u grupi i jedan individualno — i prezadovoljna sam oba puta! Grupna nastava je bila odlično organizovana, interaktivna i motivišuća, dok su individualni časovi bili potpuno prilagođeni mom tempu i potrebama. Profesori su izuzetno stručni, strpljivi i posvećeni svakom polazniku.&rdquo;
              </p>
              <p className="font-bold text-gray-900 text-sm">Kristina Ilić</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-gray-600 text-sm leading-relaxed italic mb-4">
                &ldquo;Zahvaljujući profesorici Katarini Todosijević, učenje nemačkog jezika mi više nije samo obaveza, već i pravo uživanje. Njena predavanja su dinamična, interaktivna i prilagođena potrebama svakog polaznika. S nestrpljenjem iščekujem svaki sledeći čas!&rdquo;
              </p>
              <p className="font-bold text-gray-900 text-sm">Vanja Brkan</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-gray-600 text-sm leading-relaxed italic mb-4">
                &ldquo;Jako sam zadovoljna ovom školom, sve je precizno, jasno i nema nepotrebnih informacija. Učenje jezika je ovde potpuno zanimljivo i zaista je ova škola pravi izbor za one koji žele da uče i da se trude. Nastavnica Nataša je predivna i velika podrška učenicima, sve lepo objasni i sa njom je predivno učiti.&rdquo;
              </p>
              <p className="font-bold text-gray-900 text-sm">Nikolina Crnobrnja</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer tagline */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gray-400 text-lg md:text-xl italic">
            Svako može da nauči nemački. Da, baš svako. Osim onih koji nikada nisu ni počeli.
          </p>
        </div>
      </section>

      {/* Test nivoa CTA bar */}
      <section className="bg-plava-light py-12 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-montserrat font-bold text-xl md:text-2xl text-gray-900">
              Ne znaš koji nivo?
            </h2>
            <p className="text-gray-600 mt-1">
              Uradi besplatni test i saznaj za 10 minuta.
            </p>
          </div>
          <Link
            href="/besplatno-testiranje"
            className="inline-block bg-plava text-white px-8 py-3 rounded-xl font-semibold hover:bg-plava/90 transition-colors whitespace-nowrap"
          >
            Besplatni test nivoa
          </Link>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 mb-3">
            Ostanite u toku
          </h2>
          <p className="text-gray-600 mb-8 max-w-lg mx-auto">
            Prijavite se na newsletter i dobijajte besplatne savete za
            učenje nemačkog, nove lekcije i posebne ponude.
          </p>
          <NewsletterForma />
        </div>
      </section>
    </>
  );
}
