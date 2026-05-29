import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VoKuM metoda — Hartweger škola nemačkog jezika",
  description: "VoKuM metoda — Vokabular, Komunikacija i Motivacija. Saznajte kako učimo nemački u Hartweger školi.",
  openGraph: {
    title: "VoKuM metoda — Hartweger škola nemačkog jezika",
    description: "VoKuM metoda — Vokabular, Komunikacija i Motivacija.",
  },
};

export default function MetodologijaPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-plava-light to-white py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16">
          <div className="flex-1 text-center md:text-left">
            <h1 className="font-montserrat font-bold text-3xl md:text-5xl text-gray-900 mb-6 leading-tight">
              VoKuM metoda — da konačno progovoriš nemački
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed mb-4">
              VoKabular, KomUnikacija i Motivacija — tri stvari koje zaista prave razliku u učenju nemačkog jezika.
            </p>
            <p className="text-gray-500 text-base leading-relaxed">
              Razvila sam VoKuM metodu na osnovu višegodišnjeg iskustva u nastavi i rada sa hiljadama polaznika. Umesto tradicionalnog pristupa gde se gramatika uči napamet, mi učimo jezik onako kako ga deca usvajaju — prirodno, kroz reči i komunikaciju.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Image
              src="/images/natasa-laptop.jpg"
              alt="Nataša Hartweger pri radu"
              width={600}
              height={400}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="rounded-2xl shadow-lg w-[280px] md:w-[340px] object-cover"
            />
          </div>
        </div>
      </section>

      {/* 3 pillars */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto space-y-16">
          {/* VO */}
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="flex-shrink-0 w-20 h-20 bg-plava text-white rounded-2xl flex items-center justify-center text-3xl font-bold">
              VO
            </div>
            <div>
              <h2 className="font-montserrat font-bold text-2xl text-gray-900 mb-4">Vokabular</h2>
              <div className="prose prose-lg text-gray-600">
                <p>
                  Sve počinje sa rečima. Dete prvo nauči reči, a zatim od njih sklapa rečenicu. Napamet naučene definicije o gramatičkim pravilima ne pomažu kada treba da kažeš da te boli glava ili želiš povišicu na poslu.
                </p>
                <p>
                  Na kursu učiš razne tehnike za lakše pamćenje reči — od vizuelnih asocijacija, preko kontekstualnog učenja, do ponavljanja u intervalima. Cilj je da reči postanu deo tvog aktivnog rečnika, a ne da ih samo prepoznaješ u testu.
                </p>
              </div>
            </div>
          </div>

          {/* KU */}
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="flex-shrink-0 w-20 h-20 bg-plava text-white rounded-2xl flex items-center justify-center text-3xl font-bold">
              KU
            </div>
            <div>
              <h2 className="font-montserrat font-bold text-2xl text-gray-900 mb-4">Komunikacija</h2>
              <div className="prose prose-lg text-gray-600">
                <p>
                  Naučene reči postaju vredne kroz praktičnu komunikaciju. Učimo kroz dijaloge u realnim situacijama — restorani, apoteke, banke, posao — i upoznajemo kulturu DACH zemalja.
                </p>
                <p>
                  To čini razliku između dobre i loše komunikacije. Nije dovoljno znati gramatiku — treba znati kako da se snađeš u stvarnom životu, kako da vodiš razgovor, kako da izraziš mišljenje.
                </p>
              </div>
            </div>
          </div>

          {/* M */}
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="flex-shrink-0 w-20 h-20 bg-plava text-white rounded-2xl flex items-center justify-center text-3xl font-bold">
              M
            </div>
            <div>
              <h2 className="font-montserrat font-bold text-2xl text-gray-900 mb-4">Motivacija</h2>
              <div className="prose prose-lg text-gray-600">
                <p>
                  Svakome je potrebna podrška i motivacija. Naš zajednički cilj je da uspešno progovoriš nemački jezik. Odustajanje nije opcija!
                </p>
                <p>
                  Bilo da učiš sam uz video kurseve ili u grupi sa profesorom — nikada nisi prepušten sebi. Podrška zajednice, redovan feedback i jasna struktura kursa čine da ostaneš na pravom putu.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 text-center mb-10">
            Zašto VoKuM metoda funkcioniše
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 bg-white rounded-xl p-5 shadow-sm">
              <span className="text-plava text-xl mt-0.5">&#10003;</span>
              <p className="text-gray-700">Učiš jezik onako kako ga deca usvajaju — prvo reči, pa tek onda pravila</p>
            </div>
            <div className="flex items-start gap-4 bg-white rounded-xl p-5 shadow-sm">
              <span className="text-plava text-xl mt-0.5">&#10003;</span>
              <p className="text-gray-700">Komunikacija od prvog dana — ne čekaš da &ldquo;budeš spreman&rdquo;</p>
            </div>
            <div className="flex items-start gap-4 bg-white rounded-xl p-5 shadow-sm">
              <span className="text-plava text-xl mt-0.5">&#10003;</span>
              <p className="text-gray-700">Realne situacije umesto udžbeničkih primera — učiš ono što ćeš stvarno koristiti</p>
            </div>
            <div className="flex items-start gap-4 bg-white rounded-xl p-5 shadow-sm">
              <span className="text-plava text-xl mt-0.5">&#10003;</span>
              <p className="text-gray-700">Stalna motivacija i podrška — nikada nisi sam u procesu učenja</p>
            </div>
          </div>
        </div>
      </section>

      {/* Course comparison */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 text-center mb-10">
            Koji format ti odgovara?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-2xl p-6 text-center hover:border-plava transition-colors">
              <h3 className="font-montserrat font-bold text-lg text-gray-900 mb-3">Video kursevi</h3>
              <ul className="text-gray-600 text-sm space-y-2 text-left">
                <li>&#8226; Uči kad ti odgovara</li>
                <li>&#8226; Video lekcije 24/7</li>
                <li>&#8226; Testovi i vežbe</li>
                <li>&#8226; WhatsApp podrška</li>
              </ul>
            </div>
            <div className="border border-gray-200 rounded-2xl p-6 text-center hover:border-plava transition-colors">
              <h3 className="font-montserrat font-bold text-lg text-gray-900 mb-3">Grupni kursevi</h3>
              <ul className="text-gray-600 text-sm space-y-2 text-left">
                <li>&#8226; Video lekcije + časovi uživo</li>
                <li>&#8226; Komunikacija u grupi</li>
                <li>&#8226; Redovan raspored</li>
                <li>&#8226; Profesor i podrška</li>
              </ul>
            </div>
            <div className="border border-gray-200 rounded-2xl p-6 text-center hover:border-plava transition-colors">
              <h3 className="font-montserrat font-bold text-lg text-gray-900 mb-3">Individualni</h3>
              <ul className="text-gray-600 text-sm space-y-2 text-left">
                <li>&#8226; 1:1 sa profesorom</li>
                <li>&#8226; Prilagođen program</li>
                <li>&#8226; Tvoj tempo</li>
                <li>&#8226; Video lekcije uključene</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-plava-light">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 mb-4">
            Spreman/a da počneš?
          </h2>
          <p className="text-gray-600 mb-8">
            Pogledaj ponudu kurseva i izaberi format koji ti najviše odgovara.
          </p>
          <Link
            href="/kursevi"
            className="inline-block bg-koral text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-koral-dark transition-colors shadow-lg shadow-koral/20"
          >
            Pogledaj ponudu kurseva
          </Link>
        </div>
      </section>
    </>
  );
}
