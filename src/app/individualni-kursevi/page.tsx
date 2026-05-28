import type { Metadata } from "next";
import Link from "next/link";
import ProfesorKartica from "@/components/ProfesorKartica";

export const metadata: Metadata = {
  title: "Individualni kursevi nemačkog jezika — Hartweger",
  description:
    "Individualna nastava nemačkog jezika sa sertifikovanim profesorima. Prilagođen tempo i program.",
};

const BENEFITI = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a23.838 23.838 0 0 0-1.012 5.434c-.29.149-.576.304-.856.463A24.891 24.891 0 0 0 12 18.203c4.011 0 7.85-.96 11.231-2.76-.28-.158-.567-.313-.856-.462a23.84 23.84 0 0 0-1.012-5.434" />
      </svg>
    ),
    title: "Nastava 1-na-1 sa profesorkom",
    desc: "Puna pažnja posvećena tebi. Korekcija, objašnjenja i tempo prilagođeni tvom znanju.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v9.75" />
      </svg>
    ),
    title: "Zakazivanje odmah nakon uplate",
    desc: "Dobijaš link za kalendar i zakazuješ časove kad ti odgovara. Otkazivanje je moguće najkasnije 24h pre časa.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    title: "Prilagođen tempo",
    desc: "Učiš brzinom koja ti odgovara. Nema pritiska — fokus je na tvom napretku.",
  },
];

const BENEFITI_PO_NIVOU = [
  "Časovi sa profesorkom uživo (1-na-1)",
  "Video lekcije za samostalno učenje",
  "Sertifikat po završetku nivoa",
  "Otkazivanje najkasnije 24h pre časa",
];

const BENEFITI_MESECNI = [
  "Časovi sa profesorkom uživo (1-na-1)",
  "Otkazivanje najkasnije 24h pre časa",
  "Fleksibilno — biraš koliko časova mesečno",
  "Idealno za održavanje ili intenzivan rad",
];

const KURSEVI_PO_NIVOU = [
  { nivo: "A1.1", opis: "Početak — predstavljanje, brojevi, svakodnevne fraze", cena: "23.000", cenaNatasa: "28.000" },
  { nivo: "A1.2", opis: "Prošlo vreme, kupovina, putovanje", cena: "23.000", cenaNatasa: "28.000" },
  { nivo: "A2.1", opis: "Posao, zdravlje, stanovanje", cena: "33.000", cenaNatasa: "38.000" },
  { nivo: "A2.2", opis: "Mediji, kultura, kompleksnije situacije", cena: "33.000", cenaNatasa: "38.000" },
  { nivo: "B1.1", opis: "Argumentacija, pisanje, kompleksnija gramatika", cena: "35.000", cenaNatasa: "40.000" },
  { nivo: "B1.2", opis: "Priprema za B1 ispit, slobodna konverzacija", cena: "35.000", cenaNatasa: "40.000" },
  { nivo: "B2.1", opis: "Napredna gramatika, poslovni nemački", cena: "37.000", cenaNatasa: "42.000" },
];

const MESECNI_PAKETI = [
  { paket: "4 časa mesečno", opis: "1 čas nedeljno — za održavanje ili spor tempo", cena: "14.000", cenaNatasa: "16.100" },
  { paket: "8 časova mesečno", opis: "2 časa nedeljno — standardni tempo napretka", cena: "27.500", cenaNatasa: "32.400" },
  { paket: "12 časova mesečno", opis: "3 časa nedeljno — intenzivan program", cena: "41.000", cenaNatasa: "48.300" },
];

const profesori = [
  { name: "Nataša Hartweger", role: "Osnivač, A1–B1", bio: "Kreator Hartweger metode. Fokus na vokabularu i komunikaciji." },
  { name: "Milica Vučić", role: "A1–B1", bio: "Strpljiva i sistematična. Odlična za početnike." },
  { name: "Katarina Todosijević", role: "B2–C1", bio: "Specijalizovana za napredne nivoe i poslovni nemački." },
  { name: "Hristina Šarčević", role: "A1–B1", bio: "Kreativna nastava uz praktične primere." },
  { name: "Suzana Marjanović", role: "A1–A2", bio: "Fokus na konverzaciji i svakodnevnim situacijama." },
  { name: "Marija Radojković Stanojić", role: "B1–B2", bio: "Priprema za ispite i sertifikate." },
];

export default function IndividualniKurseviPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-plava-light to-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-montserrat font-bold text-gray-900 mb-4">
            Individualni kursevi nemačkog
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Nastava 1-na-1 sa profesorkom. Prilagođen tempo, raspored i program — izaberi tip kursa koji ti odgovara.
          </p>
        </div>
      </section>

      {/* Benefiti */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {BENEFITI.map((b) => (
              <div key={b.title} className="flex gap-4">
                <div className="text-plava flex-shrink-0 mt-0.5">{b.icon}</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{b.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Izaberi tip kursa */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-montserrat font-bold text-center mb-3">Prvo odaberi tip kursa</h2>
          <p className="text-gray-600 text-center mb-10">Profesora biraš u sledećem koraku.</p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Kursevi po nivou */}
            <div>
              <h3 className="text-lg font-montserrat font-bold mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-plava text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                Kurs po nivou
              </h3>
              <p className="text-sm text-gray-600 mb-3">Kompletan nivo (7-8 nedelja). Savladaj ceo nivo sistematično.</p>

              {/* Šta uključuje */}
              <ul className="mb-4 space-y-1.5">
                {BENEFITI_PO_NIVOU.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-plava mt-0.5 flex-shrink-0">&#10003;</span>
                    {b}
                  </li>
                ))}
              </ul>

              {/* Nivoi */}
              <div className="space-y-2">
                {KURSEVI_PO_NIVOU.map((k) => (
                  <div key={k.nivo} className="bg-white border border-gray-200 rounded-xl p-3 md:p-3.5 flex items-center justify-between hover:border-plava transition-colors">
                    <div className="min-w-0">
                      <span className="font-bold text-gray-900">{k.nivo}</span>
                      <p className="text-xs text-gray-500 mt-0.5">{k.opis}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <div className="font-bold text-gray-900 text-sm">{k.cena} din</div>
                      <div className="text-xs text-koral font-semibold">~ {Math.round(parseInt(k.cena.replace('.', '')) / 117)}&euro;</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mesečni paketi */}
            <div>
              <h3 className="text-lg font-montserrat font-bold mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-koral text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                Mesečni paketi
              </h3>
              <p className="text-sm text-gray-600 mb-3">Fleksibilno — biraš koliko časova mesečno.</p>

              {/* Šta uključuje */}
              <ul className="mb-4 space-y-1.5">
                {BENEFITI_MESECNI.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-koral mt-0.5 flex-shrink-0">&#10003;</span>
                    {b}
                  </li>
                ))}
              </ul>

              <div className="space-y-2">
                {MESECNI_PAKETI.map((p) => (
                  <div key={p.paket} className="bg-white border border-gray-200 rounded-xl p-3 md:p-3.5 hover:border-koral transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="font-bold text-gray-900 text-sm">{p.paket}</span>
                        <p className="text-xs text-gray-500 mt-0.5">{p.opis}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <div className="font-bold text-gray-900 text-sm">{p.cena} din</div>
                        <div className="text-xs text-koral font-semibold">~ {Math.round(parseInt(p.cena.replace('.', '')) / 117)}&euro;</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Profesori */}
      <section className="py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-montserrat font-bold text-center mb-3">Naš tim</h2>
          <p className="text-gray-600 text-center mb-8">Profesora biraš u sledećem koraku nakon odabira kursa.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {profesori.map((prof) => (
              <ProfesorKartica key={prof.name} name={prof.name} role={prof.role} bio={prof.bio} />
            ))}
          </div>
        </div>
      </section>

      {/* Test nivoa CTA */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto bg-plava-light rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-montserrat font-bold text-gray-900">Ne znaš koji nivo?</h2>
            <p className="text-gray-600 mt-1">Uradi besplatni test i saznaj za 10 minuta.</p>
          </div>
          <Link
            href="/besplatno-testiranje"
            className="bg-plava hover:bg-plava-dark text-white font-bold py-3 px-8 rounded-xl transition-colors whitespace-nowrap"
          >
            Besplatno testiranje
          </Link>
        </div>
      </section>
    </div>
  );
}
