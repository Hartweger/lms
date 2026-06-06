import type { Metadata } from "next";
import Link from "next/link";
import ProfesorKartica from "@/components/ProfesorKartica";
import IndividualniPonuda from "@/components/IndividualniPonuda";
import { INDIVIDUALNI_CARDS } from "@/lib/individualni-cards";

export const metadata: Metadata = {
  title: "Individualni kursevi nemačkog jezika — Hartweger",
  description: "Individualna nastava nemačkog jezika sa sertifikovanim profesorima. Prilagođen tempo i program.",
  openGraph: {
    title: "Individualni kursevi nemačkog jezika — Hartweger",
    description: "Individualna nastava nemačkog jezika sa sertifikovanim profesorima.",
  },
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
    desc: "Nakon kupovine dobijaš link za kalendar i zakazuješ časove kad ti odgovara. Otkazivanje je moguće najkasnije 24h pre časa.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    title: "Prilagođen tempo",
    desc: "Učiš brzinom koja ti odgovara. Nema pritiska ni fiksnog trajanja — fokus je na tvom napretku.",
  },
];

const profesori = [
  { name: "Nataša Hartweger", role: "Osnivač · A1–C1", bio: "Kreator Hartweger metode. Fokus na vokabularu i komunikaciji." },
  { name: "Milica Vučić", role: "A1–C1 · spec. FSP", bio: "Sve nivoe; specijalnost FSP (medicinski nemački za lekare)." },
  { name: "Katarina Todosijević", role: "A1–C1 · spec. konverzacija", bio: "Sve nivoe; specijalnost konverzacija na B2/C1." },
  { name: "Hristina Šarčević", role: "A1–C1 · spec. ispiti", bio: "Sve nivoe; specijalnost priprema za ispite." },
  { name: "Suzana Marjanović", role: "A1–C1", bio: "Sve nivoe; fokus na konverzaciji i svakodnevnim situacijama." },
  { name: "Marija Radojković Stanojić", role: "A1–C1 · spec. ispiti", bio: "Sve nivoe; specijalnost priprema ispita i sertifikata." },
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
            Nastava 1-na-1 sa profesorkom. Prilagođen tempo, raspored i program — izaberi nivo i kreni.
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

      {/* Ponuda — iste kartice kao u katalogu */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-montserrat font-bold text-center mb-3">Izaberi kurs</h2>
          <p className="text-gray-600 text-center mb-8">
            Po nivou ili mesečni paket. Klikni na kurs, kupi — profesora i termine biraš odmah nakon uplate.
          </p>
          <IndividualniPonuda cards={INDIVIDUALNI_CARDS} />
        </div>
      </section>

      {/* Profesori */}
      <section className="py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-montserrat font-bold text-center mb-3">Naš tim</h2>
          <p className="text-gray-600 text-center mb-8">Svi profesori rade nivoe A1–C1. Profesora biraš nakon kupovine kursa.</p>
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
            <p className="text-gray-600 mt-1">Uradi besplatno testiranje i saznaj za 10 minuta.</p>
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
