import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Naš tim — Hartweger škola nemačkog jezika",
  description: "Upoznaj profesorke Hartweger škole — sertifikovane profesorke nemačkog jezika sa iskustvom u online nastavi i pripremi za međunarodne ispite.",
  openGraph: {
    title: "Naš tim — Hartweger škola nemačkog jezika",
    description: "Upoznaj profesorke Hartweger škole — sertifikovane profesorke nemačkog jezika sa iskustvom u online nastavi.",
  },
};

const profesorke = [
  {
    name: "Katarina Todosijević",
    role: "Prof. nemačkog jezika",
    image: "/images/tim/katarina-todosijevic.png",
    bio: [
      "Katarina inspiraciju za podučavanje nemačkog jezika pronalazi u ljudima. Odmalena je bila okružena nemačkim jezikom kroz televiziju, što je oblikovalo njen osećaj za jezik i izgovor. Osnovne studije Germanistike završila je na Univerzitetu u Kragujevcu, a kao stipendistkinja boravila je i na Univerzitetu u Triru. Ljubav prema komunikaciji odvela je i na master studije na Ekonomskom fakultetu u Kragujevcu, dok ju je srce vratilo jeziku - do dodatnog zvanja Master filologa na Univerzitetu u Beogradu, Goethe C2 sertifikata i Švajcarske.",
      "Obožava rad na višim nivoima, individualne konverzacijske časove i pripremu za Goethe, telc, fide i ÖSD ispite. Fokusira se na praktičnu i svrsishodnu upotrebu jezika, verujući da se uz pravi pristup može savladati sve - od razlike u izgovoru između ö i ü do sigurnog korišćenja nemačkog u svakodnevnim i profesionalnim situacijama.",
      "Vrline: Naučiće te frazama koje ne stoje u udžbenicima i preporučiće dobre lokalne restorane širom južne Nemačke, jugoistočne Francuske i severne Švajcarske.",
      "Slabosti: Mršti se na das ili božemesačuvaj der Nutella, ali ne insistira da učiš članove, već reči.",
    ],
  },
  {
    name: "Milica Vučić",
    role: "Prof. nemačkog jezika",
    image: "/images/tim/milica-vucic.png",
    bio: [
      "Milica Vučić je diplomirani profesor nemačkog jezika sa iskustvom u online nastavi i radu sa odraslim polaznicima. Na časovima se fokusira na praktičnu komunikaciju, konverzaciju i pripremu za međunarodne ispite iz nemačkog jezika kao što su Goethe-Zertifikat, telc Deutsch i ÖSD Zertifikat Deutsch.",
      "Pored opšteg nemačkog jezika, bavi se i stručnim nemačkim jezikom u oblasti medicine i pripremom lekara za Fachsprachprüfung. U radu koristi praktične zadatke, konverzacione vežbe i simulacije ispita uz detaljan feedback, kako bi polaznici stekli sigurnost u komunikaciji i uspešno položili ispit.",
    ],
  },
  {
    name: "Hristina Šarčević Bulatović",
    role: "Prof. nemačkog jezika",
    image: "/images/tim/hristina-sarcevic.png",
    bio: [
      "Hristina je master filolog germanista sa višegodišnjim iskustvom. Ljubav prema nemačkom jeziku se javila u osnovnoj školi koja je kasnije prerasla u profesiju i životno opredeljenje. Za vreme osnovnih studija boravila je u Nemačkoj gde je bila praktikant u državnim ustanovama i svoje znanje je nadograđivala na Univerzitetu u Bambergu. Sfera njenih interesovanja je metodika nastave nemačkog jezika kao i upotreba informaciono-komunikacionih tehnologija u nastavi što njene časovi čini interesantnim. U nastavi koristi digitalne alate za učenje koji su inovativni i zanimljivi polaznicima.",
      "Sa njom ćeš se temeljno pripremiti za međunarodni sertifikat koji ti je neophodan, jer ima višegodišnje iskustvo u pripremi zvaničnih ispita kao što su TELC, GOETHE i ÖSD. Pre svega je fokusirana na individualnu nastavu gde je maksimalno posvećena svakom polazniku. Temeljna je, kreativna i strpljiva u radu i njen cilj je da prenese znanje i ljubav prema nemačkom jeziku.",
    ],
  },
  {
    name: "Suzana Marjanović",
    role: "Prof. nemačkog jezika",
    image: "/images/tim/suzana-marjanovic.png",
    bio: [
      "Suzana je Diplomirani profesor nemačkog jezika i književnosti, sa višegodišnjim iskustvom i radom u Nemačkoj. Kombinacijom ta dva iskustva, priprema učenike za svakodnevne situacije i pomaže im da se integrišu u društvo. Stoga se trudi da nastava metodički obuhvata sve neophodne kompetencije, ali i da pre svega bude tematski interesantna.",
      "Polazi od toga da se njena nastava prilagođava učenicima, njihovim dodatnim zahtevima i željama, zatim krenu zajedničkim putem do ostvarenja cilja. Ukoliko je tvoj cilj polaganje sertifikata, Suzana takođe ima iskustva u tome. Tako da sa tobom uvežbava upravo ono što možeš da očekuješ na polaganju.",
      "Ljubav prema ovom poslu rodila se još za vreme studija. Uspeh, ostvareni ciljevi i pozitivni komentari učenika su njena najveća motivacija.",
    ],
  },
  {
    name: "Marija Radojković Stanojić",
    role: "Prof. nemačkog jezika",
    image: "/images/tim/marija-radojkovic.png",
    bio: [
      "Marija je Master filolog germanista i od 2019. godine je deo našeg tima. Ljubav prema nemačkom jeziku i profesorskom pozivu se kod nje razvija još u gimnaziji te se kasnije na studijama u Srbiji i Nemačkoj rado posvećuje metodičkim predmetima. Odmah nakon završenih studija počinje sa radom kao profesorka i nastavlja usavršavanje na tom polju.",
      "Najveću motivaciju pronalazi u zadovoljnim učenicima, praćenju njihovog napretka i položenim zvaničnim ispitima za koje već nekoliko godina uspešno priprema polaznike. Na časovima se sa puno strpljenja i razumevanja posvećuje polazniku i njegovim ciljevima, a konverzaciju na nemačkom jeziku od samog početka učenja stavlja na prvo mesto.",
    ],
  },
  {
    name: "Danica Trnavac",
    role: "Prof. nemačkog jezika",
    image: "/images/tim/danica-trnavac.png",
    bio: [
      "Danica je profesorka nemačkog jezika koja gaji veliku strast prema predavanju i prenošenju znanja drugima. Inspiraciju za svoj poziv pronašla je u ljubavi prema putovanjima, stranim jezicima i kulturama. Njena karijera započela je radom sa decom, što joj je pomoglo da otkrije da su strpljenje, zanimljiva nastava i pozitivna atmosfera ključni faktori za uspešnost u učenju stranog jezika.",
      "Danica je uvek u potrazi za novim načinima da unapredi nastavu i prilagodi je potrebama savremenih uslova. Posebno je zainteresovana za implementaciju novih digitalnih alata koji čine nastavu dinamičnijom. Njena kreativnost i inovativnost često donose iznenađenja na časovima, čineći učenje zabavnim i interaktivnim iskustvom.",
    ],
  },
];

export default function OTimuPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-plava-light/60 to-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-montserrat font-bold text-3xl md:text-4xl text-gray-900 mb-4">
            Naš tim
          </h1>
          <p className="text-gray-600 text-lg">
            Upoznaj profesorke koje će te voditi kroz učenje nemačkog jezika — svaka sa jedinstvenim pristupom i iskustvom.
          </p>
        </div>
      </section>

      {/* Nataša — featured */}
      <section className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start bg-plava-light/20 border border-plava-light rounded-2xl p-6">
            <div className="flex-shrink-0">
              <Image
                src="/images/IMG_6264.jpg"
                alt="Nataša Hartweger"
                width={110}
                height={110}
                className="rounded-full object-cover w-28 h-28"
                priority
              />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="font-montserrat font-bold text-xl text-gray-900">
                Nataša Hartweger
              </h2>
              <p className="text-plava font-semibold text-sm mt-1">
                Osnivačica i kreator VoKuM metode
              </p>
              <p className="text-gray-600 text-sm mt-2">
                Dipl. profesor nemačkog jezika sa 20 godina iskustva. Osnovala Hartweger Centar 2016. godine.
              </p>
              <Link
                href="/o-natasi"
                className="inline-block text-plava font-semibold text-sm mt-3 hover:underline"
              >
                Saznaj više o Nataši →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Profesorke */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-montserrat font-bold text-2xl text-gray-900 text-center mb-10">
            Naše profesorke
          </h2>

          <div className="space-y-8">
            {profesorke.map((p) => (
              <div
                key={p.name}
                className="border border-gray-200 rounded-2xl overflow-hidden bg-white p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center md:items-start"
              >
                <div className="flex-shrink-0">
                  <Image
                    src={p.image}
                    alt={p.name}
                    width={140}
                    height={140}
                    className="rounded-xl object-contain bg-plava-light/30 w-32 h-32 md:w-[140px] md:h-[140px]"
                    sizes="140px"
                  />
                </div>
                <div>
                  <h3 className="font-montserrat font-bold text-lg text-gray-900">
                    {p.name}
                  </h3>
                  <p className="text-plava font-semibold text-sm mt-1 mb-3">
                    {p.role}
                  </p>
                  {p.bio.map((paragraph, i) => (
                    <p
                      key={i}
                      className="text-gray-600 text-sm leading-relaxed mt-2 first:mt-0"
                    >
                      {paragraph.startsWith("Vrline:") || paragraph.startsWith("Slabosti:") ? (
                        <>
                          <strong>{paragraph.split(":")[0]}:</strong>
                          {paragraph.substring(paragraph.indexOf(":") + 1)}
                        </>
                      ) : (
                        paragraph
                      )}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-t from-plava-light/60 to-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-montserrat font-bold text-2xl text-gray-900 mb-2">
            Spreman/na za učenje?
          </h2>
          <p className="text-gray-600 mb-6">
            Izaberi kurs koji ti odgovara i počni već danas.
          </p>
          <Link
            href="/kursevi"
            className="inline-block bg-plava text-white px-8 py-3 rounded-xl font-bold hover:bg-plava-dark transition-colors"
          >
            Pogledaj kurseve →
          </Link>
        </div>
      </section>
    </>
  );
}
