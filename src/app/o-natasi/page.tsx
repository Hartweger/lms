import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "O Nataši — Hartweger škola nemačkog jezika",
  description: "Upoznajte Natašu Hartweger — profesorku nemačkog jezika, osnivačicu Hartweger Centra i autorku VoKuM metode.",
  openGraph: {
    title: "O Nataši — Hartweger škola nemačkog jezika",
    description: "Upoznajte Natašu Hartweger — profesorku nemačkog jezika, osnivačicu Hartweger Centra i autorku VoKuM metode.",
    images: [{ url: "/og/o-natasi.jpg", alt: "Nataša Hartweger" }],
  },
};

export default function ONatasiPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-plava-light to-white py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16">
          <div className="flex-shrink-0">
            <img
              src="/images/IMG_6264.jpg"
              alt="Nataša Hartweger"
              className="rounded-2xl shadow-lg max-w-xs md:max-w-sm w-full"
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="font-montserrat font-bold text-3xl md:text-5xl text-gray-900 mb-4">
              Nataša Hartweger
            </h1>
            <p className="text-plava font-semibold text-lg mb-6">
              Dobrodošli na stranicu o meni!
            </p>
            <p className="text-gray-600 text-lg leading-relaxed">
              Završila sam germanistiku i dugo radila u gimnaziji. Napisala sam nekoliko priručnika za planiranje i organizovanje nastave, objavila više naučnih radova i vodila seminare u zemlji i inostranstvu o nastavi i korišćenju tehnologije u učionici.
            </p>
          </div>
        </div>
      </section>

      {/* Bio sections */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto prose prose-lg text-gray-700">
          <h2 className="font-montserrat font-bold text-2xl text-gray-900">Kvalifikacije</h2>
          <p>
            Licencirani sam ispitivač za Gete (Goethe) i TELC ispite, kao i sudski tumač za nemački jezik. Vodila sam brojne seminare u zemlji i inostranstvu o metodici nastave i integraciji mobilnih uređaja u nastavu.
          </p>

          <h2 className="font-montserrat font-bold text-2xl text-gray-900 mt-10">Osnivanje Hartweger Centra</h2>
          <p>
            Hartweger Centar sam osnovala 2016. godine. Od marketinga, ljudskih resursa, finansija, IT odeljenja do menadžmenta — sve sam radila sama. Poslednjih 10 godina intenzivno se bavim digitalnim marketingom, što mi je pomoglo da školu podignem na novi nivo.
          </p>
          <p>
            Danas Hartweger Centar ima oko 300 učenika, 20 profesora i preko 30.000 pratilaca na društvenim mrežama.
          </p>

          <h2 className="font-montserrat font-bold text-2xl text-gray-900 mt-10">Više od škole</h2>
          <p>
            Pored nastave, aktivno se bavim sportom — istrčala sam nekoliko polumaratona, a sledeći cilj je maraton. Praktikujem zdrav životni stil jer verujem da su telo i um podjednako važni za uspešno učenje.
          </p>
        </div>
      </section>

      {/* Team photo */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 mb-8">
            Tim Hartweger
          </h2>
          <img
            src="https://www.hartweger.rs/wp-content/uploads/2021/02/natasa-hartweger-i-tim-hartweger.jpg"
            alt="Nataša Hartweger i tim"
            className="rounded-2xl shadow-lg w-full max-w-2xl mx-auto"
          />
          <p className="text-gray-600 mt-6 max-w-xl mx-auto">
            Hartweger Centar danas čini tim od 20 profesora koji sa istom strašću i posvećenošću pomažu polaznicima da progovore nemački.
          </p>
        </div>
      </section>

      {/* Vizija 2045 */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 mb-8">
            Vizija 2045
          </h2>
          <blockquote className="text-gray-600 text-lg md:text-xl italic leading-relaxed border-l-4 border-plava pl-6 text-left">
            &ldquo;Niko ne zna šta donosi budućnost... Šta god da tada bude u trendu, znam šta nikada ne izlazi iz mode: Posvećenost i čista, neuprljana emocija. To je HARTWEGER.&rdquo;
          </blockquote>
        </div>
      </section>

      {/* Misija + CTA */}
      <section className="py-12 px-4 bg-plava-light">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gray-500 text-lg italic mb-8">
            Svako može da nauči nemački jezik. Baš svako. Osim onih koji nisu nikada počeli.
          </p>
          <Link
            href="/kursevi"
            className="inline-block bg-koral text-white px-8 py-3 rounded-xl font-semibold hover:bg-koral-dark transition-colors"
          >
            Pogledaj kurseve
          </Link>
        </div>
      </section>
    </>
  );
}
