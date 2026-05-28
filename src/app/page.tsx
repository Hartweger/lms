import type { Metadata } from "next";
import Link from "next/link";
import GoogleRecenzije from "@/components/GoogleRecenzije";

export const metadata: Metadata = {
  title: "Hartweger — Online škola nemačkog jezika",
  description:
    "Nauči nemački koji ćeš stvarno koristiti. VoKuM metoda — video kursevi, grupni kursevi i individualni časovi sa Natašom Hartweger.",
};

export default function Pocetna() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-plava-light/50 to-white overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center">
          {/* Text */}
          <div className="flex-1 text-center md:text-left px-4 py-16 md:py-24">
            <span className="inline-block bg-plava text-white text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-5">
              Online škola nemačkog jezika
            </span>
            <h1 className="font-montserrat font-bold text-4xl md:text-5xl lg:text-[3.4rem] text-gray-900 mb-5 leading-[1.15]">
              Nauči nemački koji ćeš stvarno koristiti
            </h1>
            <p className="text-gray-600 text-lg md:text-xl mb-3 max-w-lg">
              Razvila sam VoKuM metodu uz pomoć koje je već više hiljada ljudi progovorilo.
            </p>
            <p className="text-gray-400 text-base mb-8 max-w-lg">
              VoKabular, KomUnikacija i Motivacija — tri stvari koje zaista prave razliku.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start mb-8">
              <Link
                href="/kursevi"
                className="text-center bg-koral text-white px-8 py-3.5 rounded-full font-semibold hover:bg-koral-dark transition-colors shadow-lg shadow-koral/20"
              >
                Pogledaj kurseve
              </Link>
              <Link
                href="/besplatno-testiranje"
                className="text-center border-2 border-plava text-plava px-8 py-3.5 rounded-full font-semibold hover:bg-plava hover:text-white transition-colors"
              >
                Besplatno testiranje
              </Link>
            </div>
            {/* Stats */}
            <ul className="flex flex-wrap gap-x-6 gap-y-2 justify-center md:justify-start text-sm text-gray-500">
              <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-plava rounded-full" />100% prolaznost na ispitima</li>
              <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-plava rounded-full" />3000+ polaznika</li>
              <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-plava rounded-full" />20+ godina iskustva</li>
            </ul>
          </div>
          {/* Image */}
          <div className="relative flex-shrink-0 w-full md:w-[480px] lg:w-[540px]">
            <img
              src="https://www.hartweger.rs/wp-content/uploads/2025/06/Hartweger_Centar_Natasa_Hartweger.jpg"
              alt="Nataša Hartweger"
              className="w-full h-auto"
            />
            {/* Name card */}
            <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-xl px-5 py-3 shadow-lg">
              <p className="font-montserrat font-bold text-gray-900">Nataša Hartweger</p>
              <p className="text-gray-500 text-sm">Osnivač Hartweger centra</p>
            </div>
          </div>
        </div>
      </section>

      {/* Ko je Nataša Hartweger? */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 mb-6">
            Ko je Nataša Hartweger?
          </h2>
          <div className="space-y-4 text-gray-600 leading-relaxed">
            <p>
              <strong className="text-gray-900">Da se upoznamo:</strong><br />
              Moje ime je Nataša Hartweger, dipl. profesor nemačkog jezika sa 20 godina iskustva.
            </p>
            <p>
              Licencirani sam ispitivač Geteovih i TELC ispita. Autor sam nekoliko priručnika za nastavnike nemačkog jezika i naučnih radova. Vodila sam mnogobrojne edukacije za nastavnike nemačkog jezika u ovom delu Evrope. Pečat sudskog tumača sam stekla 2008. godine. Pre 10 godina sam osnovala HARTWEGER centar.
            </p>
            <p>
              Licence, diplome i formalno obrazovanje su važni, ali ono što donosi najveće zadovoljstvo jesu polaznici. Njihova uspešnost na ispitima, napredak u karijeri i ostvarivanje ličnih ciljeva su najbolji pokazatelji rada.
            </p>
            <p>
              Takođe, radujem se i ponosna sam na svakodnevne poruke koje dobijam od ljudi na društvenim mrežama. Zahvaljujući objavama na društvenim mrežama, mnogi su pronašli dodatnu podršku i motivaciju za učenje nemačkog jezika.
            </p>
          </div>
          <div className="mt-6">
            <Link
              href="/kontakt"
              className="inline-block bg-plava text-white px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-plava-dark transition-colors"
            >
              Piši mi!
            </Link>
          </div>
        </div>
      </section>

      {/* VoKuM metoda */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 text-center mb-12">
            Šta je najvažnije?
          </h2>
          <div className="flex flex-col md:flex-row gap-10 items-center">
            {/* Slika levo */}
            <div className="flex-shrink-0 w-full md:w-[45%]">
              <div className="relative">
                <div className="absolute -top-3 -left-3 w-full h-full bg-plava/10 rounded-2xl" />
                <img
                  src="/images/natasa-laptop.jpg"
                  alt="Nataša Hartweger"
                  className="relative rounded-2xl shadow-lg w-full object-cover"
                />
              </div>
            </div>
            {/* Kartice desno */}
            <div className="flex-1 space-y-4">
              <div className="bg-gray-50 rounded-xl p-5 md:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 border-2 border-gray-300 rounded-lg flex items-center justify-center text-gray-500 text-sm font-bold">
                    Aa
                  </div>
                  <div>
                    <h3 className="font-montserrat font-bold text-lg text-gray-900 mb-2">1. VO — Vokabular</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Sve počinje sa rečima. Dete prvo nauči reči, a zatim od njih sklapa rečenicu. Napamet naučene definicije o gramatičkim pravilima ne pomažu kada treba da kažeš da te boli glava ili želiš povišicu na poslu. Na kursu učiš razne tehnike za lakše pamćenje reči.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 md:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-gray-500">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-montserrat font-bold text-lg text-gray-900 mb-2">2. KU — Komunikacija</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Naučene reči postaju vredne kroz praktičnu komunikaciju. Učimo kroz dijaloge u realnim situacijama (restorani, apoteke, banke) i upoznajemo kulturu DACH zemalja. To čini razliku između dobre i loše komunikacije.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 md:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-gray-500">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-montserrat font-bold text-lg text-gray-900 mb-2">3. M — Motivacija</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Svakome je potrebna podrška i motivacija. Naš zajednički cilj je da uspešno progovoriš nemački jezik. Odustajanje nije opcija!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-10">
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
          <p className="text-gray-500 text-center max-w-2xl mx-auto mb-12">
            U ponudi su kursevi od nivoa A1-C1. Za svaki nivo postoje 3 različite ponude. Pogledaj sadržaj i tako ćeš najbolje odlučiti koja je najbolja za tebe.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Grupni */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-1.5 bg-plava" />
              <div className="p-8">
                <h3 className="font-montserrat font-bold text-xl text-gray-900 mb-1">Grupni kursevi</h3>
                <p className="text-plava font-medium text-sm mb-5">Uči u društvu!</p>
                <ul className="text-gray-600 text-sm space-y-2.5 mb-6">
                  <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Video lekcije dostupne 24/7</li>
                  <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Online časovi u grupi</li>
                  <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Redovan raspored i struktura</li>
                  <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Vežbanje komunikacije na času</li>
                  <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Sertifikat HARTWEGER centra</li>
                  <li className="flex items-start gap-2 text-gray-400"><span className="mt-0.5">&#10007;</span> Nema individualnih časova</li>
                </ul>
                <Link href="/grupni-kursevi" className="inline-block border-2 border-plava text-plava px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-plava hover:text-white transition-colors">
                  Počnimo odmah!
                </Link>
              </div>
            </div>
            {/* Video */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-1.5 bg-plava" />
              <div className="p-8">
                <h3 className="font-montserrat font-bold text-xl text-gray-900 mb-1">Video kursevi</h3>
                <p className="text-plava font-medium text-sm mb-5">Uči svojim tempom!</p>
                <ul className="text-gray-600 text-sm space-y-2.5 mb-6">
                  <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Video lekcije dostupne 24/7</li>
                  <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Testovi i materijali za vežbanje</li>
                  <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Saveti za učenje vokabulara</li>
                  <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Sertifikat HARTWEGER centra</li>
                  <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Podrška u WhatsApp grupi</li>
                  <li className="flex items-start gap-2 text-gray-400"><span className="mt-0.5">&#10007;</span> Nema časova uživo</li>
                </ul>
                <Link href="/kursevi" className="inline-block border-2 border-plava text-plava px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-plava hover:text-white transition-colors">
                  Počnimo odmah!
                </Link>
              </div>
            </div>
            {/* Individualni */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-1.5 bg-plava" />
              <div className="p-8">
                <h3 className="font-montserrat font-bold text-xl text-gray-900 mb-1">Individualni kursevi</h3>
                <p className="text-plava font-medium text-sm mb-5">Fokus na tvoje ciljeve</p>
                <ul className="text-gray-600 text-sm space-y-2.5 mb-6">
                  <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Online časovi 1:1 sa profesorom</li>
                  <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Program prilagođen tvom cilju</li>
                  <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Video lekcije i dodatni materijali</li>
                  <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Tempo koji odgovara samo tebi</li>
                  <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Sertifikat HARTWEGER centra</li>
                  <li className="flex items-start gap-2 text-gray-400"><span className="mt-0.5">&#10007;</span> Nema časova u grupi</li>
                </ul>
                <Link href="/individualni-kursevi" className="inline-block border-2 border-plava text-plava px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-plava hover:text-white transition-colors">
                  Počnimo odmah!
                </Link>
              </div>
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

      {/* Google recenzije — live sa Google Places API */}
      <GoogleRecenzije />

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
            Besplatno testiranje
          </Link>
        </div>
      </section>

      {/* Blog / Magazin */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="flex-shrink-0">
            <img
              src="https://www.hartweger.rs/wp-content/uploads/2026/05/Untitled-1200-x-628-px-1-1024x536.png"
              alt="Blog"
              className="rounded-2xl shadow-md w-full md:w-[400px]"
            />
          </div>
          <div>
            <p className="text-koral font-semibold text-sm mb-2">Blog, Ispiti, Magazin</p>
            <h2 className="font-montserrat font-bold text-2xl text-gray-900 mb-3">
              Gde položiti FSP — uporedna analiza svih nemačkih pokrajina (vodič za 2026)
            </h2>
            <p className="text-gray-600 mb-6">
              Dva lekara, isti FSP. Jedan plati 400 evra i prođe iz prve. Drugi plati 700 evra i padne tri puta — sa istim nivoom nemačkog. Gde položiti FSP nije slučajna...
            </p>
            <Link
              href="/gde-poloziti-fsp-pokrajine-2026"
              className="inline-block bg-plava text-white px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-plava-dark transition-colors"
            >
              Prikaži još
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
