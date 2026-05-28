import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Course } from "@/lib/types";
import PriceCard from "@/components/product/PriceCard";
import ProductFeatures from "@/components/product/ProductFeatures";
import ProductFaq from "@/components/product/ProductFaq";
import { fetchRaspored, type GrupaRaspored } from "@/lib/raspored";

/* ─── Slug → nivo mapping for grupni ─── */
const slugToNivo: Record<string, string> = {
  "grupni-kurs-nemackog-jezika-a1-1": "A1.1",
  "grupni-kurs-nemackog-jezika-a1-2-2": "A1.2",
  "grupni-kurs-nemackog-jezika-a2": "A2.1",
  "grupni-kurs-nemackog-jezika-a2-2": "A2.2",
  "grupni-kurs-nemackog-jezika-b1-1-2": "B1.1",
  "grupni-kurs-nemackog-b1-2": "B1.2",
  "grupni-kurs-b2-1": "B2.1",
  "grupni-kurs-b2-2": "B2.2",
  "individualni-kurs-nemackog-jezika-a11": "A1.1",
  "individualni-kurs-nemackog-jezika-a1-2": "A1.2",
  "individualni-kurs-nemackog-jezika-a2": "A2.1",
  "individualni-kurs-nemackog-jezika-a2-2": "A2.2",
  "individualni-kurs-nemackog-jezika-b11": "B1.1",
  "individualni-kurs-nemackog-jezika-b1-2": "B1.2",
  "individualni-kurs-nemackog-jezika-b2-1": "B2.1",
  "grupni-kurs-c1-1": "C1.1",
  "grupni-kurs-c1-2": "C1.2",
};

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
  const { data: course } = await supabase.from("courses").select("title, description").eq("slug", slug).eq("is_purchasable", true).single();
  if (!course) return { title: "Kurs nije pronađen — Hartweger" };
  return { title: `${course.title} — Hartweger`, description: course.description };
}

export default async function KursDetaljiPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select("*").eq("slug", slug).eq("is_purchasable", true).single();
  if (!data) notFound();

  const course = data as Course;
  const category = course.category || "video";
  const paragraphs = (course.marketing_description || course.description).split("\n").filter((p: string) => p.trim());
  const features: string[] = course.features ?? [];
  const cat = categoryConfig[category] || categoryConfig.video;
  const isVariable = category === "individualni" || category === "mesecni";

  const ctaLabel =
    category === "grupni" ? "Prijavi se" :
    category === "individualni" || category === "mesecni" ? "Zakaži" :
    category === "paket" ? "Kupi paket" : "Kupi kurs";

  const featuresTitle =
    category === "grupni" ? "Šta dobijaš upisom?" :
    category === "individualni" ? "Šta uključuje kurs?" :
    category === "mesecni" ? "Šta uključuje paket?" :
    category === "paket" ? "Šta dobijaš u paketu?" : "Šta dobijaš upisom?";

  // Number of individual sessions by level
  const brojTermina: Record<string, number> = {
    "A1.1": 7, "A1.2": 7,
    "A2.1": 10, "A2.2": 10,
    "B1.1": 10, "B1.2": 10,
    "B2.1": 10,
  };
  const nivo = slugToNivo[slug] || null;
  const termini = nivo ? brojTermina[nivo] : null;

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
    .eq("is_purchasable", true).eq("category", category).neq("slug", slug)
    .order("price", { ascending: true }).limit(3);

  return (
    <>
      {/* ─── Hero ─── */}
      <section className="bg-gradient-to-b from-plava-light/60 to-white">
        <div className="max-w-6xl mx-auto px-4 pt-6 pb-12 md:pb-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
            <Link href="/" className="hover:text-plava">Početna</Link>
            <span>/</span>
            <Link href="/kursevi" className="hover:text-plava">Kursevi</Link>
            <span>/</span>
            <span className="text-gray-600 truncate">{course.title}</span>
          </nav>

          <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-start">
            {/* Left — Content */}
            <div className="flex-1 min-w-0">
              {/* Badge */}
              <span className={`inline-block text-xs font-bold tracking-wide uppercase px-3 py-1 rounded-full mb-4 ${cat.color} ${cat.bg}`}>
                {cat.label}
              </span>

              <h1 className="font-montserrat font-bold text-3xl md:text-4xl lg:text-[2.6rem] text-gray-900 leading-tight mb-4">
                {course.title}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                <span className="text-amber-400">★★★★★</span>
                <span>5.0 — 300+ Google recenzija</span>
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
                    <span className="text-gray-600"><strong>Slobodnih mesta:</strong> {parseInt(grupa.maks) - parseInt(grupa.upisanih || "0")}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[15px]">
                    <span>💻</span>
                    <span className="text-gray-600">Online nastava — Google Meet</span>
                  </div>
                </div>
              )}
              {category === "grupni" && !grupa && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8 space-y-2.5">
                  <div className="flex items-center gap-3 text-[15px]">
                    <span>👥</span>
                    <span className="text-gray-600">Male grupe: 3–6 polaznika</span>
                  </div>
                  <div className="flex items-center gap-3 text-[15px]">
                    <span>💻</span>
                    <span className="text-gray-600">Online nastava — Google Meet</span>
                  </div>
                  <div className="flex items-center gap-3 text-[15px]">
                    <span>📩</span>
                    <span className="text-gray-600">Kontaktirajte nas za sledeći termin</span>
                  </div>
                </div>
              )}

              {/* ─── INDIVIDUALNI: Calendar info ─── */}
              {(category === "individualni" || category === "mesecni") && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8 space-y-2.5">
                  {termini && (
                    <div className="flex items-center gap-3 text-[15px]">
                      <span>👩‍🏫</span>
                      <span className="text-gray-700"><strong>{termini} termina po 60 minuta</strong> — nastava 1:1 sa profesorkom</span>
                    </div>
                  )}
                  {!termini && category === "individualni" && (
                    <div className="flex items-center gap-3 text-[15px]">
                      <span>👩‍🏫</span>
                      <span className="text-gray-700"><strong>Nastava 1-na-1</strong> sa profesorkom</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-[15px]">
                    <span>👩‍🏫</span>
                    <span className="text-gray-600">Birate profesorku u sledećem koraku</span>
                  </div>
                  <div className="flex items-center gap-3 text-[15px]">
                    <span>📅</span>
                    <span className="text-gray-600">Vi birate termin — dobijate Google Calendar link i zakazujete</span>
                  </div>
                  <div className="flex items-center gap-3 text-[15px]">
                    <span>🎯</span>
                    <span className="text-gray-600">Program prilagođen vašim ciljevima i tempu</span>
                  </div>
                  {category === "mesecni" && (
                    <div className="flex items-center gap-3 text-[15px]">
                      <span>ℹ️</span>
                      <span className="text-gray-500">Mesečni paket ne uključuje video lekcije ni sertifikat</span>
                    </div>
                  )}
                </div>
              )}

              {/* ─── VIDEO: Quick stats ─── */}
              {(category === "video" || category === "paket") && (
                <div className="flex flex-wrap gap-3 mb-8">
                  <span className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-plava" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                    Vaš tempo
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

              {/* FAQ */}
              <ProductFaq category={category} />
            </div>

            {/* Right — Price card */}
            <div className="w-full lg:w-[360px] flex-shrink-0">
              <PriceCard
                price={course.price}
                priceEur={course.paypal_price_eur}
                slug={course.slug}
                ctaLabel={ctaLabel}
                isVariable={isVariable}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className="py-14 px-4 bg-plava-light">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 mb-3">
            Spremi se da progovoriš nemački
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            Pridruži se grupi od 3000+ polaznika koji su već krenuli sa učenjem.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href={`/kupovina/${course.slug}`}
              className="bg-[#F78687] hover:bg-[#e06060] text-white font-bold text-lg py-4 px-10 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-[#F78687]/20"
            >
              {ctaLabel} — {isVariable ? "od " : ""}{formatPrice(course.price)} din
            </Link>
            <Link href="/besplatno-testiranje" className="text-plava font-semibold hover:underline text-[15px]">
              Ili uradi besplatno testiranje →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Related ─── */}
      {related && related.length > 0 && (
        <section className="py-14 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-montserrat font-bold text-xl text-gray-900 mb-8 text-center">
              Možda će vas zanimati
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {(related as Course[]).map((r) => {
                const rCat = categoryConfig[r.category || "video"] || categoryConfig.video;
                return (
                  <Link key={r.slug} href={`/kursevi/${r.slug}`} className="group border border-gray-200 rounded-xl p-5 hover:border-plava hover:shadow-md transition-all">
                    <span className={`inline-block text-[11px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full mb-3 ${rCat.color} ${rCat.bg}`}>{rCat.label}</span>
                    <h3 className="font-bold text-gray-900 group-hover:text-plava transition-colors mb-2 text-[15px]">{r.title}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-gray-900">{formatPrice(r.price)} din</span>
                      {r.paypal_price_eur && <span className="text-xs text-[#F78687] font-bold">≈ {r.paypal_price_eur}€</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
