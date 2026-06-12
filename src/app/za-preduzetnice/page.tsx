import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Za preduzetnice - Resursi za preduzetnice u edukaciji | Hartweger",
  description:
    "Resursi za preduzetnice u edukaciji - autentičan brend, digitalni alati, AI, oglašavanje i kreiranje ponude.",
};

export default function ZaPreduzetnicePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-plava-light to-white py-16 md:py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-montserrat font-bold text-3xl md:text-5xl text-gray-900 mb-6 leading-tight">
            Za preduzetnice u edukaciji
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed mb-4">
            Imaš znanje i iskustvo, ali ne znaš kako da od toga napraviš biznis? Nisi sama. Upravo zato sam kreirala NH Academy - program koji ti pokazuje korak po korak kako da to ostvariš.
          </p>
        </div>
      </section>

      {/* NH Academy card */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-10 bg-gray-50 rounded-2xl p-8 md:p-12 shadow-sm">
            <div className="flex-shrink-0">
              <img
                src="/images/MIN05603.jpg"
                alt="NH Academy"
                className="rounded-2xl shadow-lg w-[260px] object-cover"
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 mb-4">
                NH Academy
              </h2>
              <p className="text-gray-500 text-sm font-medium mb-3">
                12-nedeljni program za edukatore
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Program koji vodi edukatore od prve ideje do biznisa koji radi. Konkretni alati. Isprobano u praksi. Nedelju po nedelju.
              </p>
              <ul className="text-gray-600 text-sm space-y-2 mb-6">
                <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Autentičan Instagram nastup</li>
                <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Meta oglašavanje</li>
                <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Kreiranje ponude</li>
                <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Digitalni i AI alati u edukaciji</li>
                <li className="flex items-start gap-2"><span className="text-plava mt-0.5">&#10003;</span> Brend strategija</li>
              </ul>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/nh-academy"
                  className="inline-block bg-koral text-white px-8 py-3 rounded-xl font-semibold hover:bg-koral-dark transition-colors text-center"
                >
                  Saznaj više o programu
                </Link>
                <Link
                  href="/nh-academy#upis"
                  className="inline-block border-2 border-plava text-plava px-8 py-3 rounded-xl font-semibold hover:bg-plava hover:text-white transition-colors text-center"
                >
                  Rezerviši mesto
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tagline */}
      <section className="py-12 px-4 bg-plava-light">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gray-600 text-lg italic">
            Tvoje znanje zaslužuje da postane sloboda.
          </p>
        </div>
      </section>
    </>
  );
}
