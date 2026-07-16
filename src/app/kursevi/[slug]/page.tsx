import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Course } from "@/lib/types";
import PriceCard from "@/components/product/PriceCard";
import ProductFeatures from "@/components/product/ProductFeatures";
import ProductFaq from "@/components/product/ProductFaq";
import { fetchRaspored, type GrupaRaspored } from "@/lib/raspored";
import { SLUG_TO_NIVO as slugToNivo } from "@/lib/course-nivo";
import InteresForm from "./InteresForm";
import BuyButton from "@/components/BuyButton";
import PixelViewContent from "@/components/PixelViewContent";
import { productStrings, formatMoney, type Lang } from "@/lib/product-i18n";
import { priceTiersFromVariants, type Variant } from "@/lib/individual-pricing";

/* ─── Preduslovi po nivou ─── */
const preduslov: Record<string, string> = {
  "A1.2": "Završen A1.1 nivo ili ekvivalentno znanje",
  "A2.1": "Završen A1 nivo ili ekvivalentno znanje",
  "A2.2": "Završen A2.1 nivo ili ekvivalentno znanje",
  "B1.1": "Završen A2 nivo ili ekvivalentno znanje",
  "B1.2": "Završen B1.1 nivo ili ekvivalentno znanje",
  "B2.1": "Završen B1 nivo ili ekvivalentno znanje",
  "B2.2": "Završen B2.1 nivo ili ekvivalentno znanje",
  "C1.1": "Završen B2 nivo ili ekvivalentno znanje",
  "C1.2": "Završen C1.1 nivo ili ekvivalentno znanje",
};

const courseFallbacks: Record<string, { marketing_description: string; features: string[] }> = {
  "grupni-kurs-nemackog-jezika-a1-1": {
    marketing_description:
      "Nikada niste učili nemački - ili ste pokušali, ali niste daleko stigli? Ovaj kurs je napravljen za taj prvi korak. Za 7 nedelja naučićete da se predstavite, postavljate pitanja i vodite prve kratke razgovore na nemačkom.",
    features: [
      "Živa online nastava 2× nedeljno u grupi od 3-6 polaznika",
      "7 modula sa video lekcijama, testovima i završnim ispitom",
      "Interaktivne vežbe i beleške dostupne 24/7",
      "Pristup materijalima godinu dana i sertifikat po uspehu",
    ],
  },
  "grupni-kurs-nemackog-jezika-a1-2-2": {
    marketing_description:
      "Savladali ste osnove - sad je vreme da ih povežete. Na A1.2 proširujete rečnik, učvršćujete gramatiku i počinjete da se snalazite u svakodnevnim situacijama: u prodavnici, kod lekara, na poslu.",
    features: [
      "Živa online nastava 2× nedeljno u grupi od 3-6 polaznika",
      "7 modula sa video lekcijama, testovima i završnim ispitom",
      "Pristup beleškama i vežbama u sopstvenom tempu",
      "Sertifikat po završetku kursa",
    ],
  },
  "grupni-kurs-nemackog-jezika-a2": {
    marketing_description:
      "Razumete dosta, ali kad treba da progovorite - zastanete? A2.1 je tu da prekinete tu blokadu. Učite da pričate o sebi, porodici, poslu i svakodnevnim situacijama bez prevođenja u glavi.",
    features: [
      "Online nastava 2× nedeljno u maloj grupi",
      "7 modula sa video lekcijama i interaktivnim vežbama",
      "Vežbanje govora, slušanja, pisanja i čitanja",
      "Pristup materijalima godinu dana i sertifikat",
    ],
  },
  "grupni-kurs-nemackog-jezika-a2-2": {
    marketing_description:
      "Na A2.2 vaš nemački postaje funkcionalan. Razumete glavne teme razgovora, pišete poruke i mejlove, i sve ređe tražite pomoć na engleskom ili srpskom.",
    features: [
      "2 časa nedeljno sa profesorkom u grupi od 3-6 polaznika",
      "7 modula sa video lekcijama, testovima i završnim ispitom",
      "Zadatke radite kad vam odgovara i prateći materijale",
      "Sertifikat po položenom završnom ispitu",
    ],
  },
  "grupni-kurs-nemackog-jezika-b1-1-2": {
    marketing_description:
      "B1 je nivo koji traže poslodavci i ambasade. Na B1.1 učite da izražavate mišljenje, argumentujete i razumete složenije tekstove - sve što vam treba za posao ili ispit.",
    features: [
      "Online nastava 2× nedeljno u grupi od 3-6 polaznika",
      "7 modula sa video lekcijama, testovima i završnim ispitom",
      "Pripremu za B1 situacije na poslu, u školi i u svakodnevnom životu",
      "Pristup materijalima godinu dana i sertifikat",
    ],
  },
  "grupni-kurs-nemackog-b1-2": {
    marketing_description:
      "Poslednji korak do B1 sertifikata. Na B1.2 savladavate kompleksnu gramatiku, vežbate pisanje i govor na ispitnom nivou i pripremate se za Goethe B1 ispit.",
    features: [
      "Živa online nastava 2× nedeljno u grupi od 3-6 polaznika",
      "7 modula sa video lekcijama na platformi",
      "Test posle svake lekcije i završni ispit",
      "Interaktivne vežbe umesto klasičnog domaćeg",
      "Pristup materijalima godinu dana i sertifikat",
    ],
  },
  "individualni-kurs-nemackog-jezika-b1-2": {
    marketing_description:
      "Individualni B1.2 kurs za pripremu na ispit: fokus na tvoje slabosti, pisanje, govor i konjunktiv II uz personalizovanu podršku.",
    features: [
      "Privatni časovi 1 na 1 sa profesorkom po dogovoru",
      "Fleksibilan tempo i plan lekcija prilagođen tebi",
      "Teme: spojene i relativne rečenice, konjunktiv II, pasiv i pisanje eseja",
      "Simulacija ispita i sertifikat po uspehu",
    ],
  },
  "grupni-kurs-b2-1": {
    marketing_description:
      "Na B2.1 prelazite sa „snalaženja“ na tečnu komunikaciju. Diskutujete o apstraktnim temama, razumete autentične tekstove i koristite složene jezičke strukture.",
    features: [
      "Online nastava 2× nedeljno u grupi od 3-6 polaznika",
      "7 modula sa video lekcijama, testovima i završnim ispitom",
      "Vežbanje napredne gramatike i poslovnog jezika",
      "Pristup materijalima godinu dana i sertifikat",
    ],
  },
  "grupni-kurs-b2-2": {
    marketing_description:
      "Završni korak do B2 nivoa. Usavršavate pisanje eseja, argumentovani govor i razumevanje kompleksnih tekstova - kompletna priprema za Goethe B2 ispit.",
    features: [
      "2 časa nedeljno u maloj grupi za intenzivnu konverzaciju",
      "7 modula sa video lekcijama, testovima i završnim ispitom",
      "Pripremu za B2 ispit i profesionalnu komunikaciju",
      "Sertifikat po završetku kursa",
    ],
  },
  "grupni-kurs-c1-1": {
    marketing_description:
      "Akademski i poslovni nemački na naprednom nivou. Na C1.1 analizirate kompleksne tekstove, pišete struktuirane eseje i diskutujete sa preciznošću koja se očekuje u profesionalnom okruženju.",
    features: [
      "Online nastava 2× nedeljno u grupi od 3-6 polaznika",
      "7 modula sa video lekcijama, testovima i završnim ispitom",
      "Analizu složenih tekstova i poslovnu komunikaciju",
      "Pristup materijalima godinu dana i sertifikat",
    ],
  },
  "grupni-kurs-c1-2": {
    marketing_description:
      "Poslednja stepenica. Na C1.2 dovodite nemački do nivoa koji se traži na univerzitetima i u korporacijama - kompletna priprema za Goethe C1 ispit.",
    features: [
      "2 časa nedeljno u maloj grupi za naprednu konverzaciju",
      "7 modula sa video lekcijama, testovima i završnim ispitom",
      "Pripremu za C1 ispit, akademske eseje i poslovne prezentacije",
      "Sertifikat po završetku kursa",
    ],
  },
};

// Dodatne sekcije po slug-u (raspored tema, za koga) - za kurseve kojima ne
// odgovara standardni grupni layout (npr. konverzacijski).
const courseExtras: Record<string, { topics?: string[]; audience?: string[] }> = {
  "grupni-konverzacijski-kurs-nemackog-b1": {
    topics: [
      "Icebreaker Plauderstunde - upoznavanje + kako kurs funkcioniše",
      "Hobby, Beruf & Alltag",
      "Familie, Feste & Erziehung",
      "Stadt- und Landleben",
      "Arbeit & Karriere",
      "Reisen & Urlaub",
      "Umwelt & Umweltschutz",
      "Internet & Digitalisierung",
      "Hoffnungen & Erwartungen + Fazit",
    ],
    audience: [
      "Za sve koji su završili B1 i žele konverzacijsku praksu",
      "Za one koji razumeju nemački, ali im govor blokira",
      "Za ljude koji žive na DACH području i svakodnevno koriste nemački",
      "Za sve koji žele strukturirano učenje u toploj, opuštenoj atmosferi",
    ],
  },
};

function formatPrice(price: number): string {
  return price.toLocaleString("de-DE");
}

const categoryConfig: Record<string, { label: string; color: string; bg: string }> = {
  video: { label: "Video kurs", color: "text-red-600", bg: "bg-red-50" },
  paket: { label: "Paket", color: "text-gray-900", bg: "bg-gray-100" },
  grupni: { label: "Grupni kurs", color: "text-[#0AB3D7]", bg: "bg-sky-50" },
  individualni: { label: "Individualni", color: "text-blue-700", bg: "bg-blue-50" },
  mesecni: { label: "Mesečni paket", color: "text-purple-700", bg: "bg-purple-50" },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("title, description, thumbnail_url, price")
    .eq("slug", slug)
    .eq("is_purchasable", true)
    .single();
  if (!course) return { title: "Kurs nije pronađen - Hartweger" };
  // Kursevi (za sada) nemaju svoje slike → fallback na brend og sliku,
  // inače mreže pri deljenju zgrabe logo i iseku ga ružno.
  const ogImage = course.thumbnail_url
    ? { url: course.thumbnail_url, alt: course.title }
    : { url: "/og/share.png", width: 1200, height: 630, alt: "Hartweger - Škola nemačkog jezika" };
  return {
    title: `${course.title} - Hartweger`,
    description: course.description,
    openGraph: {
      title: `${course.title} - Hartweger`,
      description: course.description,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${course.title} - Hartweger`,
      description: course.description,
      images: [ogImage.url],
    },
  };
}

export default async function KursDetaljiPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select("*").eq("slug", slug).eq("is_purchasable", true).single();
  if (!data) notFound();

  const course = data as Course;
  const category = course.category || "video";
  const lang = (course.lang === "en" ? "en" : "sr") as Lang;
  const en = lang === "en";
  const t = productStrings(lang);
  const heroPrimary = en
    ? formatMoney(course.paypal_price_eur ?? 0, "EUR")
    : formatMoney(course.price, "RSD");
  const courseFallback = courseFallbacks[slug];
  const marketingDescription = course.marketing_description || courseFallback?.marketing_description || course.description;
  const paragraphs = marketingDescription.split("\n").filter((p: string) => p.trim());
  const features: string[] = course.features ?? courseFallback?.features ?? [];
  const cat = categoryConfig[category] || categoryConfig.video;
  const isVariable = category === "individualni" || category === "mesecni";

  // Cena zavisi od profesorke (npr. 37.000 tim / 42.500 Nataša) - kupci to moraju
  // videti VEĆ OVDE, ne tek u checkoutu: skrivena razlika pravi napuštene/duple
  // porudžbine (kupac se vraća sa bankovne strane da "istraži" cenu).
  let priceTiers: { price: number; names: string[] }[] = [];
  // „Profesorku biraš..." ima smisla samo kad izbor stvarno postoji (FSP i FIDE
  // imaju jednu profesorku - checkout tamo i ne nudi listu).
  let hasProfessorChoice = false;
  if (isVariable) {
    // Service-role kao na /kupovina: RLS na user_profiles skriva imena profesorki
    // od anon klijenta (join vraća professor=null). U HTML idu samo ime+cena.
    const admin = createAdminClient();
    const { data: vdata } = await admin
      .from("product_variants")
      .select("id, professor_id, package_type, price, paypal_price_eur, professor:professor_id(id, full_name)")
      .eq("course_id", course.id)
      .eq("is_active", true);
    const variants = (vdata ?? []).map((v) => ({
      ...v,
      professor: Array.isArray(v.professor) ? v.professor[0] ?? null : v.professor,
    })) as Variant[];
    priceTiers = priceTiersFromVariants(variants);
    hasProfessorChoice = new Set(variants.map((v) => v.professor_id).filter(Boolean)).size > 1;
  }

  const ctaLabel = en ? t.ctaBuy : (
    category === "grupni" ? "Prijavi se" :
    category === "individualni" || category === "mesecni" ? "Kupi" :
    category === "paket" ? "Kupi paket" : "Kupi kurs"
  );

  const featuresTitle = en ? t.featuresTitle : (
    category === "grupni" ? "Šta dobijaš upisom?" :
    category === "individualni" ? "Šta uključuje kurs?" :
    category === "mesecni" ? "Šta uključuje paket?" :
    category === "paket" ? "Šta dobijaš u paketu?" : "Šta dobijaš upisom?"
  );

  // Number of individual sessions by level
  const brojTermina: Record<string, number> = {
    "A1.1": 7, "A1.2": 7,
    "A2.1": 10, "A2.2": 10,
    "B1.1": 10, "B1.2": 10,
    "B2.1": 10,
  };
  // Override for specific slugs
  const slugTermini: Record<string, number> = {
    "fsp-individualni": 5,
  };
  const nivo = slugToNivo[slug] || null;
  const termini = slugTermini[slug] || (nivo ? brojTermina[nivo] : null);

  // Fetch raspored for grupni courses
  let grupa: GrupaRaspored | null = null;
  if (category === "grupni") {
    const nivo = slugToNivo[slug];
    if (nivo) {
      const raspored = await fetchRaspored();
      grupa = raspored.find((g) => g.nivo === nivo) || null;
    }
  }

  // Related products (same category, different slug)
  const { data: related } = await supabase
    .from("courses").select("title, slug, price, paypal_price_eur, category")
    .eq("is_purchasable", true).eq("category", category).eq("lang", lang).neq("slug", slug)
    .order("price", { ascending: true }).limit(3);

  return (
    <>
      {/* Meta Pixel - ViewContent na stranici proizvoda */}
      <PixelViewContent contentId={course.slug} contentName={course.title} value={course.price} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Course",
            name: course.title,
            description: course.description,
            url: `https://www.hartweger.rs/kursevi/${slug}`,
            ...(course.thumbnail_url && { image: course.thumbnail_url }),
            teaches: "Nemački jezik",
            provider: {
              "@type": "EducationalOrganization",
              name: "Centar za nemački jezik Hartweger",
              url: "https://www.hartweger.rs",
            },
            ...(slugToNivo[slug] && { educationalLevel: slugToNivo[slug] }),
            inLanguage: "de",
            offers: {
              "@type": "Offer",
              price: course.price,
              priceCurrency: "RSD",
              availability: "https://schema.org/InStock",
              url: `https://www.hartweger.rs/kursevi/${slug}`,
              category: "Paid",
            },
            hasCourseInstance: {
              "@type": "CourseInstance",
              courseMode: "online",
              inLanguage: "de",
              courseWorkload: category === "grupni" || category === "individualni" ? "PT1H30M" : "PT10H",
              ...(termini && { courseSchedule: { "@type": "Schedule", repeatCount: termini } }),
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Početna", item: "https://www.hartweger.rs" },
              { "@type": "ListItem", position: 2, name: "Kursevi", item: "https://www.hartweger.rs/kursevi" },
              { "@type": "ListItem", position: 3, name: course.title },
            ],
          }),
        }}
      />
      {/* ─── Hero ─── */}
      <section className="bg-gradient-to-b from-plava-light/60 to-white">
        <div className="max-w-6xl mx-auto px-4 pt-6 pb-12 md:pb-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
            <Link href="/" className="hover:text-plava">{t.breadcrumbHome}</Link>
            <span>/</span>
            <Link href="/kursevi" className="hover:text-plava">{t.breadcrumbCourses}</Link>
            <span>/</span>
            <span className="text-gray-600 truncate">{course.title}</span>
          </nav>

          <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-start">
            {/* Left - Content */}
            <div className="flex-1 min-w-0">
              {/* Badge */}
              <span className={`inline-block text-xs font-bold tracking-wide uppercase px-3 py-1 rounded-full mb-4 ${cat.color} ${cat.bg}`}>
                {en ? t.categoryLabel : cat.label}
              </span>

              <h1 className="font-montserrat font-bold text-3xl md:text-4xl lg:text-[2.6rem] text-gray-900 leading-tight mb-4">
                {course.title}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                <span className="text-amber-400">★★★★★</span>
                <span>{t.ratingText}</span>
              </div>

              {/* ─── Preduslov ─── */}
              {(() => {
                const nivo = slugToNivo[slug];
                const uslov = nivo ? preduslov[nivo] : null;
                if (!uslov) return null;
                return (
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 mb-6 text-[15px]">
                    <span className="text-amber-500 mt-0.5">⚠️</span>
                    <div>
                      <span className="font-semibold text-gray-800">Preduslov: </span>
                      <span className="text-gray-600">{uslov}</span>
                      <span className="text-gray-400"> · </span>
                      <Link href="/besplatno-testiranje" className="text-plava hover:underline font-medium">Niste sigurni? Uradite besplatno testiranje</Link>
                    </div>
                  </div>
                );
              })()}

              {/* ─── GRUPNI: Live info block from Google Sheets ─── */}
              {category === "grupni" && grupa && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8 space-y-2.5">
                  <div className="flex items-center gap-3 text-[15px]">
                    <span className="text-green-500">🟢</span>
                    <span className="text-gray-700"><strong>Sledeći termin:</strong> {grupa.pocetak}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[15px]">
                    <span>👩‍🏫</span>
                    <span className="text-gray-600"><strong>Profesorka:</strong> {grupa.prof}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[15px]">
                    <span>🕐</span>
                    <span className="text-gray-600"><strong>Termini:</strong> {grupa.dani}, {grupa.sat}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[15px]">
                    <span>⏱️</span>
                    <span className="text-gray-600"><strong>Trajanje:</strong> {grupa.trajanje} nedelja</span>
                  </div>
                  <div className="flex items-center gap-3 text-[15px]">
                    <span>👥</span>
                    {grupa.full ? (
                      <span className="text-red-600 font-bold">Popunjeno - nema slobodnih mesta</span>
                    ) : (
                      <span className="text-gray-600"><strong>Slobodnih mesta:</strong> {grupa.slobodnih}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[15px]">
                    <span>💻</span>
                    <span className="text-gray-600">Online nastava - Google Meet</span>
                  </div>
                </div>
              )}
              {category === "grupni" && !grupa && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8 space-y-2.5">
                  <div className="flex items-center gap-3 text-[15px]">
                    <span>👥</span>
                    <span className="text-gray-600">Male grupe: 3-6 polaznika</span>
                  </div>
                  <div className="flex items-center gap-3 text-[15px]">
                    <span>💻</span>
                    <span className="text-gray-600">Online nastava - Google Meet</span>
                  </div>
                  <div className="flex items-center gap-3 text-[15px]">
                    <span>📩</span>
                    <span className="text-gray-600">Kontaktirajte nas za sledeći termin</span>
                  </div>
                </div>
              )}

              {/* ─── INDIVIDUALNI: Key info ─── */}
              {(category === "individualni" || category === "mesecni") && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8 space-y-2.5 text-[15px]">
                  {termini && (
                    <p className="text-gray-700"><strong>{termini} termina po 60 minuta</strong> - nastava 1:1 sa profesorkom</p>
                  )}
                  {!termini && category === "individualni" && (
                    <p className="text-gray-700"><strong>Nastava 1-na-1</strong> sa profesorkom</p>
                  )}
                  {en ? (
                    <>
                      <p className="text-gray-700"><strong>{t.oneOnOneInEnglish}</strong></p>
                      {hasProfessorChoice && <p className="text-gray-600">{t.chooseProfessorLine}</p>}
                    </>
                  ) : (
                    hasProfessorChoice && (
                      priceTiers.length > 1 ? (
                        <div className="space-y-1">
                          <p className="text-gray-700 font-medium">Profesorku biraš pri kupovini - cena zavisi od izbora:</p>
                          {priceTiers.map((tier) => (
                            <p key={tier.price} className="text-gray-600">
                              {tier.names.length > 2 ? "Profesorke iz našeg tima" : tier.names.join(" / ")} - <strong>{formatPrice(tier.price)} din</strong>
                            </p>
                          ))}
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-600">{t.chooseProfessorLine}</p>
                          {category === "mesecni" && (
                            <p className="text-gray-600">Cena zavisi od izabranog paketa i profesorke - tačan iznos vidiš pre plaćanja.</p>
                          )}
                        </>
                      )
                    )
                  )}
                  <p className="text-gray-600">{t.bookYourTimeLine}</p>
                  {category === "mesecni" && (
                    <p className="text-gray-500">{t.noVideoCertLine}</p>
                  )}
                </div>
              )}

              {/* ─── VIDEO: Quick stats ─── */}
              {(category === "video" || category === "paket") && (
                <div className="flex flex-wrap gap-3 mb-8">
                  <span className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-plava" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                    Tvoj tempo
                  </span>
                  <span className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-plava" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    Pristup godinu dana
                  </span>
                  <span className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-plava" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Sertifikat
                  </span>
                </div>
              )}

              {/* Marketing description */}
              <div className="space-y-4 text-gray-600 text-[16px] leading-[1.75] mb-8">
                {paragraphs.map((p: string, i: number) => (
                  <p key={i}>{p}</p>
                ))}
              </div>

              {/* Features */}
              <ProductFeatures features={features} title={featuresTitle} />

              {/* Raspored tema + Za koga (po slug-u) */}
              {courseExtras[slug]?.topics && (
                <div className="mt-10">
                  <h2 className="font-montserrat font-bold text-xl text-gray-900 mb-4">Raspored tema</h2>
                  <ol className="space-y-2.5">
                    {courseExtras[slug].topics!.map((t, i) => (
                      <li key={i} className="flex items-start gap-3 text-[15px] text-gray-700">
                        <span className="flex-shrink-0 w-6 h-6 mt-0.5 rounded-full bg-plava-light text-plava font-bold text-xs flex items-center justify-center">{i + 1}</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {courseExtras[slug]?.audience && (
                <div className="mt-10">
                  <h2 className="font-montserrat font-bold text-xl text-gray-900 mb-4">Za koga je ovaj kurs?</h2>
                  <ul className="space-y-2">
                    {courseExtras[slug].audience!.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-[15px] text-gray-700">
                        <span className="text-plava mt-0.5">✓</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* FAQ */}
              <ProductFaq category={category} slug={slug} lang={lang} />
            </div>

            {/* Right - Price card (hidden on mobile, sticky bar instead) */}
            <div className="hidden lg:block lg:w-[360px] flex-shrink-0">
              {category === "grupni" && grupa?.full ? (
                <div className="border border-gray-200 rounded-xl p-6 text-center space-y-4">
                  <p className="text-red-600 font-bold text-lg">Popunjeno</p>
                  <p className="text-gray-600 text-sm">Nema slobodnih mesta u trenutnom terminu. Ostavi mejl pa te obaveštavamo čim otvorimo sledeći.</p>
                  <div className="flex justify-center">
                    <InteresForm nivo={grupa.nivo} />
                  </div>
                </div>
              ) : (
                <PriceCard
                  price={course.price}
                  priceEur={course.paypal_price_eur}
                  slug={course.slug}
                  ctaLabel={ctaLabel}
                  isVariable={isVariable}
                  title={course.title}
                  lang={lang}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className="py-14 px-4 bg-plava-light">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 mb-3">
            {t.bottomTitle}
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            {t.bottomSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {category === "grupni" && grupa?.full ? (
              <InteresForm nivo={grupa.nivo} />
            ) : (
              <BuyButton
                slug={course.slug}
                contentId={course.slug}
                contentName={course.title}
                value={course.price}
                className="bg-[#F78687] hover:bg-[#e06060] text-white font-bold text-lg py-4 px-10 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-[#F78687]/20"
              >
                {ctaLabel} - {isVariable ? t.pricePrefixFrom : ""}{heroPrimary}
              </BuyButton>
            )}
            <Link href="/besplatno-testiranje" className="text-plava font-semibold hover:underline text-[15px]">
              {t.freeTestLink}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Related ─── */}
      {related && related.length > 0 && (
        <section className="py-14 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-montserrat font-bold text-xl text-gray-900 mb-8 text-center">
              {t.relatedTitle}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {(related as Course[]).map((r) => {
                const rCat = categoryConfig[r.category || "video"] || categoryConfig.video;
                return (
                  <Link key={r.slug} href={`/kursevi/${r.slug}`} className="group border border-gray-200 rounded-xl p-5 hover:border-plava hover:shadow-md transition-all">
                    <span className={`inline-block text-[11px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full mb-3 ${rCat.color} ${rCat.bg}`}>{rCat.label}</span>
                    <h3 className="font-bold text-gray-900 group-hover:text-plava transition-colors mb-2 text-[15px]">{r.title}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-gray-900">{en && r.paypal_price_eur != null ? formatMoney(r.paypal_price_eur, "EUR") : formatMoney(r.price, "RSD")}</span>
                      {!en && r.paypal_price_eur && <span className="text-xs text-[#F78687] font-bold">≈ {r.paypal_price_eur}€</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
      {/* ─── Mobile sticky CTA bar ─── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-3 lg:hidden z-50 safe-bottom">
        {category === "grupni" && grupa?.full ? (
          <div className="flex items-center justify-between gap-3 w-full">
            <p className="text-red-600 font-bold text-[15px]">Popunjeno</p>
            <InteresForm nivo={grupa.nivo} />
          </div>
        ) : (
          <>
            <div>
              <p className="font-bold text-gray-900 text-lg leading-tight">
                {isVariable && t.pricePrefixFrom}{heroPrimary}
              </p>
              {en ? (
                <p className="text-[#F78687] text-xs font-bold">{formatMoney(course.price, "RSD")}</p>
              ) : (
                course.paypal_price_eur && (
                  <p className="text-[#F78687] text-xs font-bold">≈ {course.paypal_price_eur}€</p>
                )
              )}
            </div>
            <BuyButton
              slug={course.slug}
              contentId={course.slug}
              contentName={course.title}
              value={course.price}
              className="bg-[#F78687] hover:bg-[#e06060] text-white font-bold py-3 px-6 rounded-xl text-[15px] whitespace-nowrap"
            >
              {ctaLabel}
            </BuyButton>
          </>
        )}
      </div>
      {/* Spacer for mobile sticky bar */}
      <div className="h-20 lg:hidden" />
    </>
  );
}
