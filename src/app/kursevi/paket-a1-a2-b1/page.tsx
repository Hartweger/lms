import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Video paket A1 + A2 + B1 - Hartweger",
  description: "Kompletna putanja od nule do B1. 150+ video lekcija, testovi, PDF materijali, WhatsApp podrška i 3 sertifikata - sve u jednom paketu za 249€.",
  openGraph: {
    images: [{ url: "/og/share.png", width: 1200, height: 630, alt: "Hartweger - Škola nemačkog jezika" }],
    title: "Video paket A1 + A2 + B1 - Hartweger",
    description: "Kompletna putanja od nule do B1. 150+ video lekcija, testovi, PDF materijali i 3 sertifikata.",
  },
};

export default function PaketA1B1Page() {
  return (
    <>
      {/* ─── Hero ─── */}
      <section className="bg-gradient-to-b from-[#f0fbfd] to-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-16 md:pb-20">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            {/* Text */}
            <div className="flex-1 text-center lg:text-left">
              <span className="inline-block bg-gray-900 text-white text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-5">
                Najpopularniji paket
              </span>
              <h1 className="font-montserrat font-bold text-4xl md:text-5xl lg:text-[3.2rem] text-gray-900 leading-[1.12] mb-5">
                Od početnika do B1 nivoa -{" "}
                <span className="text-[#0AB3D7]">kompletna transformacija</span>
              </h1>
              <p className="text-gray-500 text-lg md:text-xl mb-4 max-w-xl mx-auto lg:mx-0">
                150+ video lekcija · Interaktivne vežbe · Priručnici · Sertifikat
              </p>
              <div className="mb-8">
                <Link
                  href="/kupovina/paket-a1-a2-b1"
                  className="inline-block bg-[#F78687] hover:bg-[#e06060] text-white font-bold text-lg py-4 px-10 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-[#F78687]/25"
                >
                  Upiši se - 29.133 din
                </Link>
                <p className="text-sm text-gray-400 mt-2">≈ 249€ · plaćanje na rate dostupno</p>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm">
                <div className="text-center">
                  <p className="font-bold text-xl text-gray-900">4.000+</p>
                  <p className="text-gray-400">polaznika</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-xl text-gray-900">20+</p>
                  <p className="text-gray-400">god. iskustva</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-xl text-gray-900 flex items-center gap-1 justify-center">5.0 <span className="text-amber-400">★</span></p>
                  <p className="text-gray-400">Google ocena</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-xl text-gray-900">150+</p>
                  <p className="text-gray-400">video lekcija</p>
                </div>
              </div>
            </div>

            {/* Photo */}
            <div className="flex-shrink-0 w-full max-w-[380px] lg:w-[400px]">
              <Image
                src="/images/natasa-laptop.jpg"
                alt="Nataša Hartweger"
                className="rounded-2xl shadow-xl w-full"
                width={600}
                height={400}
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="bg-white rounded-xl shadow-md px-5 py-3 -mt-6 mx-6 relative z-10">
                <p className="font-bold text-gray-900 text-sm">Nataša Hartweger</p>
                <p className="text-gray-400 text-xs italic">&ldquo;Iza svakog kursa stojim ja lično - svojim imenom, firmom i podrškom.&rdquo;</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Prepoznaješ li se? ─── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 text-center mb-12">
            Prepoznaješ li se?
          </h2>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Problems */}
            <div className="space-y-4">
              {[
                "Nemački mi treba za posao, ali ne znam odakle da počnem",
                "Probala sam aplikacije ali ne mogu da progovorim",
                "Bojim se da ću kupiti kurs i nikad ga završiti",
                "Da li online kurs može da zameni pravu školu?",
              ].map((p, i) => (
                <div key={i} className="flex items-start gap-3 bg-red-50/60 rounded-xl p-4">
                  <span className="text-red-400 font-bold text-lg mt-0.5">✗</span>
                  <span className="text-gray-600 text-[15px]">{p}</span>
                </div>
              ))}
            </div>

            {/* Solutions */}
            <div className="space-y-4">
              {[
                { title: "Jasan plan od prvog dana", desc: "Tačno znaš šta radiš svaki dan. Nema lutanja - pratim te od A1 do B1." },
                { title: "Jezik koji se stvarno koristi", desc: "Ne učiš iz udžbenika iz 2005. Učiš jezik koji ćeš čuti na poslu, u prodavnici, kod lekara." },
                { title: "Nisi sam/sama", desc: "WhatsApp grupa, AI asistent, direktna podrška - ovo nije aplikacija, ovo je škola." },
                { title: "Završićeš jer je sistem napravljen za to", desc: "Kratke lekcije, 11 tipova vežbi, speak vežbe, flashcards - napredak koji vidiš." },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-3 bg-green-50/60 rounded-xl p-4">
                  <span className="text-green-500 font-bold text-lg mt-0.5">✓</span>
                  <div>
                    <p className="font-bold text-gray-900 text-[15px]">{s.title}</p>
                    <p className="text-gray-500 text-sm mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-10">
            <Link
              href="/kupovina/paket-a1-a2-b1"
              className="inline-block bg-[#0AB3D7] hover:bg-[#089ab9] text-white font-bold py-3.5 px-8 rounded-xl transition-all"
            >
              Upiši se i kreni danas
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Šta sve dobijaš ─── */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 text-center mb-3">
            Kompletan put od A1 do B1
          </h2>
          <p className="text-gray-400 text-center mb-10">Sve što ti treba na jednom mestu</p>

          {/* 3 Level cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
            {[
              { level: "A1", label: "Početni", color: "bg-sky-100 text-sky-700", lessons: "50+" },
              { level: "A2", label: "Elementarni", color: "bg-sky-50 text-sky-800", lessons: "50+" },
              { level: "B1", label: "Srednji", color: "bg-amber-50 text-amber-700", lessons: "50+" },
            ].map((l) => (
              <div key={l.level} className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
                <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 ${l.color}`}>
                  {l.level}
                </span>
                <h3 className="font-bold text-gray-900 text-lg mb-1">{l.label} nivo</h3>
                <p className="text-gray-400 text-sm">{l.lessons} lekcija</p>
              </div>
            ))}
          </div>

          {/* 8 Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: "🎬", title: "150+ video lekcija", desc: "Predavanja sa prof. Natašom - gramatika, izgovor i vokabular" },
              { icon: "🃏", title: "Flashcard kartice", desc: "Interaktivne kartice za učenje reči - okreni, pomešaj, vežbaj u oba smera" },
              { icon: "🎤", title: "Speak vežbe", desc: "Govori na nemačkom i dobij ocenu izgovora u realnom vremenu" },
              { icon: "💬", title: "Dijalozi sa AI asistentom", desc: "Vežbaj razgovor u realnim situacijama - restoran, lekar, posao" },
              { icon: "📝", title: "11 tipova vežbi", desc: "Kvizovi, dopuni, spoji parove, složi rečenicu, diktat, kategorije i više" },
              { icon: "📖", title: "Priručnici za svaki nivo", desc: "Kompletni priručnici sa vokabularom, dijalozima i vežbama" },
              { icon: "🔊", title: "Slušaj i uči", desc: "Svaka reč i rečenica ima audio - klikni i čuj pravi izgovor" },
              { icon: "🏆", title: "3 sertifikata", desc: "Hartweger sertifikat za svaki nivo po završetku testova" },
            ].map((b, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-2">
                <span className="text-2xl">{b.icon}</span>
                <h3 className="font-bold text-gray-900 text-[15px]">{b.title}</h3>
                <p className="text-gray-500 text-sm">{b.desc}</p>
              </div>
            ))}
          </div>

          {/* Extra row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-5">
            <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4">
              <span className="text-2xl flex-shrink-0">💬</span>
              <div>
                <h3 className="font-bold text-gray-900 text-[15px] mb-1">WhatsApp grupa + podrška</h3>
                <p className="text-gray-500 text-sm">Pitaj kad zapneš - Nataša i tim odgovaraju</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4">
              <span className="text-2xl flex-shrink-0">📅</span>
              <div>
                <h3 className="font-bold text-gray-900 text-[15px] mb-1">12 meseci pristupa</h3>
                <p className="text-gray-500 text-sm">Učiš svojim tempom - vrati se na lekciju kad god zatreba</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4">
              <span className="text-2xl flex-shrink-0">🤖</span>
              <div>
                <h3 className="font-bold text-gray-900 text-[15px] mb-1">AI alati za učenje</h3>
                <p className="text-gray-500 text-sm">AI prevod, AI dijalog i NaKI asistent - uvek u koraku sa vremenom</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Metoda poređenje ─── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 text-center mb-3">
            Metoda koja prati stvaran život, ne udžbenike
          </h2>
          <p className="text-gray-400 text-center mb-10">20+ godina iskustva pretvoreno u sistem koji radi</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Classical */}
            <div className="bg-red-50/50 rounded-2xl p-6">
              <h3 className="font-bold text-red-400 text-sm uppercase tracking-wide mb-4">❌ Klasičan pristup</h3>
              <ul className="space-y-3 text-gray-500 text-[15px]">
                <li className="flex items-start gap-2"><span className="text-red-300 mt-1">✗</span> Udžbenici iz 2005.</li>
                <li className="flex items-start gap-2"><span className="text-red-300 mt-1">✗</span> Gramatika bez konteksta</li>
                <li className="flex items-start gap-2"><span className="text-red-300 mt-1">✗</span> Učiš sam, nemaš kome da se obratiš</li>
                <li className="flex items-start gap-2"><span className="text-red-300 mt-1">✗</span> Isti tempo za sve</li>
              </ul>
            </div>
            {/* Hartweger */}
            <div className="bg-green-50/50 rounded-2xl p-6">
              <h3 className="font-bold text-green-600 text-sm uppercase tracking-wide mb-4">✓ Hartweger metoda</h3>
              <ul className="space-y-3 text-gray-600 text-[15px]">
                <li className="flex items-start gap-2"><span className="text-green-500 mt-1">✓</span> Jezik iz svakodnevnog života</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-1">✓</span> Gramatika kroz praktične primere</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-1">✓</span> Podrška - pitaj kad zapneš</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-1">✓</span> Tvoj tempo, tvoj raspored</li>
                <li className="flex items-start gap-2"><span className="text-green-500 mt-1">✓</span> AI dijalog, speak vežbe, flashcards</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonijali ─── */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 text-center mb-3">
            4.000+ polaznika je prošlo ovaj put
          </h2>
          <p className="text-gray-400 text-center mb-10">Evo šta kažu oni koji su završili</p>

          {/* Google rating */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-sm border border-gray-100">
              <span className="text-amber-400 text-lg">★★★★★</span>
              <span className="font-bold text-gray-900">5.0</span>
              <span className="text-gray-400 text-sm">Google recenzije · 300+ ocena</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Milena Grbić", text: "Položila sam A1 nivo lako zahvaljujući kursu... sa 54 godine položih iz prvog puta." },
              { name: "Kristina Ilić", text: "Prezadovoljna sam oba puta... potpuno prilagođeni mom tempu i potrebama." },
              { name: "Vanja Brkan", text: "Učenje nemačkog jezika mi više nije samo obaveza, već i pravo uživanje." },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="text-amber-400 text-sm mb-3">★★★★★</div>
                <p className="text-gray-600 text-[15px] leading-relaxed mb-4 italic">&ldquo;{t.text}&rdquo;</p>
                <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                <p className="text-gray-400 text-xs">Google recenzija</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Koliko košta ─── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 text-center mb-10">
            Koliko zapravo košta nemački?
          </h2>

          {/* Price comparison */}
          <div className="space-y-3 mb-10">
            {[
              { label: "1:1 časovi (A1-B1)", sublabel: "Individualna nastava", price: "preko 1.000€", muted: true },
              { label: "Učenje u grupi (A1-B1)", sublabel: "Grupni kursevi", price: "preko 700€", muted: true },
              { label: "Pojedinačno na hartweger.rs", sublabel: "3 × 99€", price: "297€", muted: true },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-5 py-4">
                <div>
                  <p className="text-gray-500 text-[15px]">{row.label}</p>
                  <p className="text-gray-400 text-xs">{row.sublabel}</p>
                </div>
                <p className="text-gray-400 font-semibold line-through">{row.price}</p>
              </div>
            ))}
            {/* THE PAKET */}
            <div className="flex items-center justify-between bg-[#0AB3D7]/[.08] border-2 border-[#0AB3D7] rounded-xl px-5 py-5">
              <div>
                <p className="font-bold text-gray-900 text-[17px]">Hartweger paket A1-B1</p>
                <p className="text-[#0AB3D7] text-sm font-medium">Sve uključeno + podrška</p>
              </div>
              <p className="font-bold text-2xl text-[#0AB3D7]">249€</p>
            </div>
          </div>

          {/* What's included */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-10">
            <p className="font-bold text-gray-900 mb-4">U cenu je uključeno:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                "150+ video lekcija (A1+A2+B1)",
                "Priručnici sa dijalozima i vokabularom",
                "11 tipova interaktivnih vežbi",
                "Flashcard kartice i speak vežbe",
                "AI dijalog i AI prevod",
                "WhatsApp podrška",
                "3 sertifikata",
                "12 meseci pristupa",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 text-[15px]">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  <span className="text-gray-600">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/kupovina/paket-a1-a2-b1"
              className="inline-block bg-[#F78687] hover:bg-[#e06060] text-white font-bold text-lg py-4 px-10 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-[#F78687]/25"
            >
              Upiši se - 29.133 din
            </Link>
            <p className="text-sm text-gray-400 mt-2.5">≈ 249€ · plaćanje na rate preko Banca Intesa</p>
            <div className="flex items-center justify-center gap-5 mt-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">🔒 Sigurno plaćanje</span>
              <span>💳 Visa / MC / AmEx</span>
              <span>🏦 Rate Intesa</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Ko stoji iza ovoga ─── */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 text-center mb-10">
            Ko stoji iza ovoga
          </h2>

          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <Image
                src="/images/IMG_6264.jpg"
                alt="Nataša Hartweger"
                className="w-[180px] h-[220px] object-cover rounded-2xl shadow-lg"
                width={400}
                height={500}
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-montserrat font-bold text-xl text-gray-900 mb-1">Nataša Hartweger</h3>
              <p className="text-[#0AB3D7] text-sm font-medium mb-4">Profesorka nemačkog · Preduzetnica · Edukatorka</p>
              <div className="space-y-3 text-gray-600 text-[15px] leading-relaxed">
                <p>
                  Ovo nije aplikacija koju je napravio neko koga ne možeš da kontaktiraš. Iza svakog kursa, svake lekcije i svakog odgovora na tvoje pitanje stojim ja - lično, svojom firmom i 20+ godina iskustva u nastavi nemačkog jezika.
                </p>
                <p>
                  Radim sa polaznicima svaki dan. Pratim svaki komentar, svako pitanje u WhatsApp grupi, svaki napredak.
                </p>
              </div>
              <div className="flex gap-4 mt-5">
                <div className="bg-white rounded-lg px-4 py-2 border border-gray-100 text-center">
                  <p className="font-bold text-gray-900 text-sm">65K+</p>
                  <p className="text-gray-400 text-xs">Instagram</p>
                </div>
                <div className="bg-white rounded-lg px-4 py-2 border border-gray-100 text-center">
                  <p className="font-bold text-gray-900 text-sm">35K+</p>
                  <p className="text-gray-400 text-xs">TikTok</p>
                </div>
                <div className="bg-white rounded-lg px-4 py-2 border border-gray-100 text-center">
                  <p className="font-bold text-gray-900 text-sm">21K+</p>
                  <p className="text-gray-400 text-xs">YouTube</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 border-l-4 border-[#0AB3D7] bg-white rounded-r-xl px-6 py-4">
            <p className="text-gray-600 italic text-[15px]">
              &ldquo;Kad se upišeš, ne kupuješ samo kurs - dobijaš mene, moj tim i moju posvećenost da naučiš nemački.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 text-center mb-3">
            Česta pitanja
          </h2>
          <p className="text-gray-400 text-center mb-10">Imaš pitanje? Verovatno imamo odgovor</p>

          <div className="space-y-6">
            {[
              { q: "Da li mogu stvarno da naučim online?", a: "Da. 4.000+ polaznika je dokaz. Ključ je struktura - svaka lekcija ima jasan cilj, test za proveru i podršku kad zapneš. Nisi sam/sama." },
              { q: "Koliko vremena dnevno treba?", a: "Preporučujemo 30-60 minuta dnevno, ali učiš svojim tempom. Imaš 12 meseci pristupa - nema pritiska." },
              { q: "Šta ako ne završim za 12 meseci?", a: "12 meseci je više nego dovoljno za sva tri nivoa. Većina polaznika završi ranije. Ako ti treba više, možeš produžiti pristup po 50% manjoj ceni." },
              { q: "Šta posle B1?", a: "Posle B1 možeš da nastaviš sa individualnim časovima ili grupnim kursevima. Ovo nije kraj puta - ovo je početak." },
              { q: "Da li dobijem sertifikat?", a: "Da, dobijaš Hartweger sertifikat za svaki nivo - ukupno 3 sertifikata (A1, A2, B1) po završetku testova." },
              { q: "Kako funkcioniše plaćanje na rate?", a: "Plaćanje na rate moguće je isključivo karticama Banca Intesa (do 6 rata). Jednokratno možeš platiti bilo kojom karticom, uplatom na račun ili PayPal-om." },
              { q: "Mogu li da učim sa telefona?", a: "Da! Imamo aplikaciju - šaljemo ti link, instaliraš za sekund, bez Google ili Apple prodavnice. Radi i na tabletu i računaru." },
            ].map((item, i) => (
              <div key={i} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                <h3 className="font-bold text-gray-900 text-[16px] mb-2">{item.q}</h3>
                <p className="text-gray-500 text-[15px] leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-16 px-4 bg-plava-light">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 mb-3">
            Nemaš razloga da čekaš
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Sve je tu. Plan, lekcije, podrška, sertifikati. Jedino što fali si ti.
          </p>
          <Link
            href="/kupovina/paket-a1-a2-b1"
            className="inline-block bg-[#F78687] hover:bg-[#e06060] text-white font-bold text-lg py-4 px-10 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-[#F78687]/25"
          >
            Upiši se - 29.133 din
          </Link>
          <p className="text-sm text-gray-400 mt-2.5">≈ 249€ · plaćanje na rate dostupno</p>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-400">
            <span>✓ 150+ lekcija</span>
            <span>✓ Lična podrška</span>
            <span>✓ 3 sertifikata</span>
          </div>
        </div>
      </section>
      {/* ─── Mobile sticky CTA bar ─── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-3 lg:hidden z-50 safe-bottom">
        <div>
          <p className="font-bold text-gray-900 text-lg leading-tight">29.133 din</p>
          <p className="text-[#F78687] text-xs font-bold">≈ 249€</p>
        </div>
        <Link
          href="/kupovina/paket-a1-a2-b1"
          className="bg-[#F78687] hover:bg-[#e06060] text-white font-bold py-3 px-6 rounded-xl text-[15px] whitespace-nowrap"
        >
          Upiši se
        </Link>
      </div>
      <div className="h-20 lg:hidden" />
    </>
  );
}
