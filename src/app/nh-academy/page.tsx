import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NH Academy — Program za edukatore | Hartweger",
  description:
    "NH Academy — 12-nedeljni program koji vodi edukatore od prve ideje do biznisa koji radi. Konkretni alati, isprobano u praksi.",
};

export default function NhAcademyPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-plava-light to-white py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16">
          <div className="flex-1 text-center md:text-left">
            <h1 className="font-montserrat font-bold text-3xl md:text-5xl text-gray-900 mb-4 leading-tight">
              Tvoje znanje zaslužuje da postane <span className="text-plava italic">sloboda.</span>
            </h1>
            <p className="text-gray-500 text-lg mb-4">
              14 godina da naučim. 12 nedelja da ti prenesem.
            </p>
            <p className="text-gray-600 text-base leading-relaxed mb-8">
              Program koji vodi edukatore od prve ideje do biznisa koji radi. Konkretni alati. Isprobano u praksi. Nedelju po nedelju.
            </p>
            <Link
              href="#upis"
              className="inline-block bg-koral text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-koral-dark transition-colors shadow-lg shadow-koral/20"
            >
              Rezerviši svoje mesto
            </Link>
          </div>
          <div className="flex-shrink-0">
            <img
              src="https://www.hartweger.rs/wp-content/uploads/2026/04/naslova-NH.png"
              alt="NH Academy"
              className="rounded-2xl shadow-lg max-w-xs md:max-w-md w-full"
            />
          </div>
        </div>
      </section>

      {/* Target audience */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 text-center mb-10">
            Za koga je NH Academy?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 bg-plava-light rounded-xl p-5">
              <span className="text-plava text-xl mt-0.5">&#10003;</span>
              <div>
                <p className="font-semibold text-gray-900">Nastavnici jezika</p>
                <p className="text-gray-600 text-sm">Držiš privatne časove, želiš da napraviš online kurs</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-plava-light rounded-xl p-5">
              <span className="text-plava text-xl mt-0.5">&#10003;</span>
              <div>
                <p className="font-semibold text-gray-900">Treneri i coachevi</p>
                <p className="text-gray-600 text-sm">Imaš klijente, ali samo 1-na-1</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-plava-light rounded-xl p-5">
              <span className="text-plava text-xl mt-0.5">&#10003;</span>
              <div>
                <p className="font-semibold text-gray-900">Korporativni edukatori</p>
                <p className="text-gray-600 text-sm">Predaješ u firmama, želiš svoj biznis</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-plava-light rounded-xl p-5">
              <span className="text-plava text-xl mt-0.5">&#10003;</span>
              <div>
                <p className="font-semibold text-gray-900">Instruktori i predavači</p>
                <p className="text-gray-600 text-sm">Imaš stručnost, trebaš strukturu</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-plava-light rounded-xl p-5 sm:col-span-2 sm:max-w-sm sm:mx-auto">
              <span className="text-plava text-xl mt-0.5">&#10003;</span>
              <div>
                <p className="font-semibold text-gray-900">Virtuelni asistenti</p>
                <p className="text-gray-600 text-sm">Želiš da savladaš AI alate za edukaciju</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Phases */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 text-center mb-12">
            12 nedelja. 3 faze. Tvoj biznis.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Phase 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-plava text-white rounded-xl flex items-center justify-center text-lg font-bold mb-4">
                1
              </div>
              <h3 className="font-montserrat font-bold text-lg text-gray-900 mb-1">TEMELJI</h3>
              <p className="text-plava text-sm font-medium mb-4">Nedelje 1-4</p>
              <ul className="text-gray-600 text-sm space-y-2">
                <li>&#8226; Nedelja 1: Idealni klijent i niša</li>
                <li>&#8226; Nedelja 2: Kreiranje ponude B2C + B2B</li>
                <li>&#8226; Nedelja 3: Lični brend i poruka</li>
                <li>&#8226; Nedelja 4: Oblikovanje edukacije</li>
              </ul>
            </div>
            {/* Phase 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-plava text-white rounded-xl flex items-center justify-center text-lg font-bold mb-4">
                2
              </div>
              <h3 className="font-montserrat font-bold text-lg text-gray-900 mb-1">VIDLJIVOST</h3>
              <p className="text-plava text-sm font-medium mb-4">Nedelje 5-9</p>
              <ul className="text-gray-600 text-sm space-y-2">
                <li>&#8226; Nedelja 5: Lead magneti i lista</li>
                <li>&#8226; Nedelja 6: Email kampanje</li>
                <li>&#8226; Nedelja 7: Kreativni sadržaj</li>
                <li>&#8226; Nedelja 8: TikTok, AI alati, chat platforme</li>
                <li>&#8226; Nedelja 9: Online prodaja</li>
              </ul>
            </div>
            {/* Phase 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-plava text-white rounded-xl flex items-center justify-center text-lg font-bold mb-4">
                3
              </div>
              <h3 className="font-montserrat font-bold text-lg text-gray-900 mb-1">SKALIRANJE</h3>
              <p className="text-plava text-sm font-medium mb-4">Nedelje 10-12</p>
              <ul className="text-gray-600 text-sm space-y-2">
                <li>&#8226; Nedelja 10: Meta/Facebook oglašavanje</li>
                <li>&#8226; Nedelja 11: Finansije i organizacija</li>
                <li>&#8226; Nedelja 12: Lansiranje i plan napred</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 text-center mb-10">
            Šta dobijaš?
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 bg-plava-light rounded-xl p-5">
              <span className="text-plava text-xl font-bold mt-0.5">01</span>
              <p className="text-gray-700">12 live sesija sa Natašom (90 min, sreda 19:30h)</p>
            </div>
            <div className="flex items-start gap-4 bg-plava-light rounded-xl p-5">
              <span className="text-plava text-xl font-bold mt-0.5">02</span>
              <p className="text-gray-700">Snimci svih sesija (dostupni 7 dana)</p>
            </div>
            <div className="flex items-start gap-4 bg-plava-light rounded-xl p-5">
              <span className="text-plava text-xl font-bold mt-0.5">03</span>
              <p className="text-gray-700">Zadaci na 3 nivoa: Starter, Grader, Pro</p>
            </div>
            <div className="flex items-start gap-4 bg-plava-light rounded-xl p-5">
              <span className="text-plava text-xl font-bold mt-0.5">04</span>
              <p className="text-gray-700">WhatsApp zajednica za podršku i networking</p>
            </div>
            <div className="flex items-start gap-4 bg-plava-light rounded-xl p-5">
              <span className="text-plava text-xl font-bold mt-0.5">05</span>
              <p className="text-gray-700">Template biblioteka — gotovi šabloni za odmah</p>
            </div>
            <div className="flex items-start gap-4 bg-plava-light rounded-xl p-5">
              <span className="text-plava text-xl font-bold mt-0.5">06</span>
              <p className="text-gray-700">Doživotni alumni pristup</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 text-center mb-10">
            Iskustva polaznica
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-gray-600 text-sm leading-relaxed italic mb-4">
                &ldquo;Nataša ima neverovatnu sposobnost da složene stvari pretvori u konkretne korake. Posle njenog mentoringa konačno sam znala šta da radim.&rdquo;
              </p>
              <p className="font-bold text-gray-900 text-sm">Maja J.</p>
              <p className="text-gray-400 text-xs">Vlasnica škole jezika</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-gray-600 text-sm leading-relaxed italic mb-4">
                &ldquo;Mislila sam da moram da imam sve gotovo pre nego što krenem. Naučila sam da kreneš sa onim što imaš — i gradiš u hodu.&rdquo;
              </p>
              <p className="font-bold text-gray-900 text-sm">Sofija R.</p>
              <p className="text-gray-400 text-xs">Nastavnica engleskog</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-gray-600 text-sm leading-relaxed italic mb-4">
                &ldquo;Nikad nisam mislila da mogu da naplatim znanje koje imam. Pokazala mi je kako — i zašto je to jedino pošteno prema sebi.&rdquo;
              </p>
              <p className="font-bold text-gray-900 text-sm">Ivana V.</p>
              <p className="text-gray-400 text-xs">Pedagog u OŠ</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="upis" className="py-16 px-4 bg-white">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 mb-8">
            Upiši se u NH Academy
          </h2>
          <div className="bg-gradient-to-br from-plava-light to-white rounded-2xl p-8 shadow-lg border border-plava/20">
            <p className="text-gray-500 text-sm mb-2">Generacija I — maksimalno 15 polaznika</p>
            <p className="font-montserrat font-bold text-5xl text-gray-900 mb-1">
              64.000 <span className="text-xl font-normal text-gray-500">RSD</span>
            </p>
            <p className="text-gray-400 text-sm mb-6">(~550&euro;)</p>

            <ul className="text-gray-600 text-sm space-y-3 text-left max-w-xs mx-auto mb-8">
              <li className="flex items-start gap-2">
                <span className="text-plava mt-0.5">&#10003;</span>
                6 rata preko Banca Intesa kartice
              </li>
              <li className="flex items-start gap-2">
                <span className="text-plava mt-0.5">&#10003;</span>
                Rate bez kartice — pošalji email
              </li>
              <li className="flex items-start gap-2">
                <span className="text-plava mt-0.5">&#10003;</span>
                7 dana garancija povrata novca, bez pitanja
              </li>
            </ul>

            <Link
              href="mailto:kurs@hartweger.rs?subject=NH Academy — upis"
              className="inline-block w-full bg-koral text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-koral-dark transition-colors shadow-lg shadow-koral/20"
            >
              Upiši se — 550&euro;
            </Link>
            <p className="text-gray-400 text-xs mt-4">
              Samo 15 mesta
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
