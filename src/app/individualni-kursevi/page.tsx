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
    title: "Fleksibilan raspored",
    desc: "Ti biraš dane i sate. Pomeri čas kad god treba — bez penala.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.745 3.745 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
    title: "Sertifikat po završetku",
    desc: "Hartweger sertifikat sa verifikacijom — dokaz tvog napretka.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9A2.25 2.25 0 0 0 13.5 5.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
    title: "Snimljeni časovi",
    desc: "Svi časovi se snimaju. Pregledaj kad god želiš za ponavljanje.",
  },
];

const KURSEVI_PO_NIVOU = [
  { nivo: "A1.1", opis: "Početak — predstavljanje, brojevi, svakodnevne fraze", cena: "23.000" },
  { nivo: "A1.2", opis: "Prošlo vreme, kupovina, putovanje", cena: "23.000" },
  { nivo: "A2.1", opis: "Posao, zdravlje, stanovanje", cena: "33.000" },
  { nivo: "A2.2", opis: "Mediji, kultura, kompleksnije situacije", cena: "33.000" },
  { nivo: "B1.1", opis: "Argumentacija, pisanje, kompleksnija gramatika", cena: "35.000" },
  { nivo: "B1.2", opis: "Priprema za B1 ispit, slobodna konverzacija", cena: "35.000" },
  { nivo: "B2.1", opis: "Napredna gramatika, poslovni nemački", cena: "37.000" },
];

const MESECNI_PAKETI = [
  { paket: "4 časa mesečno", opis: "1 čas nedeljno — za održavanje ili spor tempo", cena: "14.000", napomena: "Nataša: 16.100" },
  { paket: "8 časova mesečno", opis: "2 časa nedeljno — standardni tempo napretka", cena: "27.500", napomena: "Nataša: 32.400" },
  { paket: "12 časova mesečno", opis: "3 časa nedeljno — intenzivan program", cena: "41.000", napomena: "Nataša: 48.300" },
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
      <section className="py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
          <h2 className="text-2xl font-montserrat font-bold text-center mb-3">Izaberi tip kursa</h2>
          <p className="text-gray-600 text-center mb-10">Dva načina — po nivou ili mesečni paketi. Profesora biraš na checkout-u.</p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Kursevi po nivou */}
            <div>
              <h3 className="text-lg font-montserrat font-bold mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-plava text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                Kurs po nivou
              </h3>
              <p className="text-sm text-gray-600 mb-4">Kompletan nivo (7-8 nedelja). Savladaj ceo nivo sistematično.</p>
              <div className="space-y-3">
                {KURSEVI_PO_NIVOU.map((k) => (
                  <div key={k.nivo} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:border-plava transition-colors">
                    <div>
                      <span className="font-bold text-gray-900">{k.nivo}</span>
                      <p className="text-xs text-gray-500 mt-0.5">{k.opis}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="font-bold text-gray-900">{k.cena} din</div>
                      <div className="text-xs text-gray-400">Nataša: +5.000</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mesečni paketi */}
            <div>
              <h3 className="text-lg font-montserrat font-bold mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-koral text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                Mesečni paketi
              </h3>
              <p className="text-sm text-gray-600 mb-4">Fleksibilno — biraš koliko časova mesečno. Idealno za održavanje ili intenzivan rad.</p>
              <div className="space-y-3">
                {MESECNI_PAKETI.map((p) => (
                  <div key={p.paket} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-koral transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-900">{p.paket}</span>
                      <span className="font-bold text-gray-900">{p.cena} din</span>
                    </div>
                    <p className="text-xs text-gray-500">{p.opis}</p>
                    <p className="text-xs text-gray-400 mt-1">{p.napomena}</p>
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
          <p className="text-gray-600 text-center mb-8">Profesora biraš prilikom kupovine kursa.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {profesori.map((prof) => (
              <ProfesorKartica key={prof.name} name={prof.name} role={prof.role} bio={prof.bio} />
            ))}
          </div>
        </div>
      </section>

      {/* Test nivoa CTA */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto bg-plava-light rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-montserrat font-bold text-gray-900">Ne znaš koji nivo?</h2>
            <p className="text-gray-600 mt-1">Uradi besplatni test i saznaj za 10 minuta.</p>
          </div>
          <Link
            href="/besplatno-testiranje"
            className="bg-plava hover:bg-plava-dark text-white font-bold py-3 px-8 rounded-xl transition-colors whitespace-nowrap"
          >
            Besplatni test nivoa
          </Link>
        </div>
      </section>
    </div>
  );
}
