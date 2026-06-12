import type { Metadata } from "next";
import Link from "next/link";
import KontaktForma from "@/components/KontaktForma";

export const metadata: Metadata = {
  title: "Kontakt - Hartweger škola nemačkog jezika",
  description: "Pošaljite nam poruku - pitanja o kursevima, plaćanju ili saradnji.",
  openGraph: {
    title: "Kontakt - Hartweger škola nemačkog jezika",
    description: "Pošaljite nam poruku - pitanja o kursevima, plaćanju ili saradnji.",
    images: [{ url: "/og/kontakt.png", alt: "Hartweger kontakt" }],
  },
};

export default function KontaktPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-plava-light/60 to-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-montserrat font-bold text-3xl md:text-4xl text-gray-900 mb-4">
            Kontakt
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl">
            Ako nisam odgovorila na neko tvoje pitanje i imaš nedoumica, piši mi. Stojim ti na raspolaganju.
          </p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-12">
          {/* Form */}
          <div className="flex-1">
            <h2 className="font-montserrat font-bold text-xl text-gray-900 mb-6">Pošalji poruku</h2>
            <KontaktForma />
          </div>

          {/* Info sidebar */}
          <div className="lg:w-[300px] flex-shrink-0 space-y-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-3">Email</h3>
              <p className="text-gray-600 text-[15px]">info@hartweger.rs</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-3">Društvene mreže</h3>
              <div className="space-y-2.5 text-[15px]">
                <a href="https://www.instagram.com/hartweger_centar/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-plava">
                  Instagram - @hartweger_centar
                </a>
                <a href="https://www.youtube.com/@hartwegercentar" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-plava">
                  YouTube - Hartweger Centar
                </a>
                <a href="https://www.facebook.com/hartwegercentar" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-plava">
                  Facebook - @hartwegercentar
                </a>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-3">Brzi linkovi</h3>
              <div className="space-y-2 text-[15px]">
                <Link href="/faq" className="block text-plava hover:underline">Česta pitanja</Link>
                <Link href="/besplatno-testiranje" className="block text-plava hover:underline">Besplatno testiranje</Link>
                <Link href="/kursevi" className="block text-plava hover:underline">Svi kursevi</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
