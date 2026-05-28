import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Course } from "@/lib/types";

function formatPrice(price: number): string {
  return price.toLocaleString("de-DE");
}

/* ─── Category config ─── */
const categoryConfig: Record<string, { label: string; color: string; bg: string }> = {
  video: { label: "Video kurs", color: "text-red-600", bg: "bg-red-50" },
  paket: { label: "Paket", color: "text-gray-900", bg: "bg-gray-100" },
  grupni: { label: "Grupni kurs", color: "text-[#0AB3D7]", bg: "bg-sky-50" },
  individualni: { label: "Individualni", color: "text-blue-700", bg: "bg-blue-50" },
};

/* ─── Feature icons ─── */
const featureIcons = [
  // Video/play
  <svg key="0" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><polygon points="5 3 19 12 5 21 5 3" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  // Certificate
  <svg key="1" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>,
  // Clock
  <svg key="2" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
  // Book
  <svg key="3" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
  // Chat
  <svg key="4" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>,
  // Shield
  <svg key="5" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  // Sparkle
  <svg key="6" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>,
  // Users
  <svg key="7" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="9" cy="7" r="3" /><path d="M3 20c0-4 2.7-6 6-6s6 2 6 6" /><circle cx="17" cy="9" r="2" /><path d="M21 20c0-2.5-1.5-4-4-4" /></svg>,
];

/* ─── FAQ per category ─── */
const faqByCategory: Record<string, { q: string; a: string }[]> = {
  video: [
    { q: "Šta se dešava nakon uplate?", a: "Odmah dobijate pristup svim materijalima na platformi. Potrebna vam je samo dobra volja i bilo koji uređaj sa internet konekcijom." },
    { q: "Koliko vremena treba nedeljno?", a: "To zavisi od vas. Preporučujemo 3–4 sata nedeljno za optimalan napredak, ali učite sopstvenim tempom." },
    { q: "Koliko dugo imam pristup?", a: "Pristup kursu imate godinu dana od dana kupovine. Za to vreme možete gledati lekcije neograničen broj puta." },
    { q: "Kako se plaća?", a: "Plaćanje je moguće karticom (Visa, MasterCard), uplatom na dinarski račun ili putem PayPal-a." },
  ],
  paket: [
    { q: "Šta se dešava nakon uplate?", a: "Odmah dobijate pristup svim kursevima iz paketa. Možete ih raditi bilo kojim redosledom." },
    { q: "Da li mogu da kupim kurseve pojedinačno?", a: "Da, ali paket je povoljniji. Ušteda u odnosu na pojedinačnu kupovinu je prikazana na stranici." },
    { q: "Koliko dugo imam pristup?", a: "Pristup svim kursevima u paketu imate godinu dana od dana kupovine." },
    { q: "Kako se plaća?", a: "Plaćanje je moguće karticom (Visa, MasterCard), uplatom na dinarski račun ili putem PayPal-a." },
  ],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("title, description")
    .eq("slug", slug)
    .eq("is_purchasable", true)
    .single();

  if (!course) {
    return { title: "Kurs nije pronađen — Hartweger" };
  }

  return {
    title: `${course.title} — Hartweger`,
    description: course.description,
  };
}

export default async function KursDetaljiPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", slug)
    .eq("is_purchasable", true)
    .single();

  if (!data) {
    notFound();
  }

  const course = data as Course;
  const isVariable =
    course.category === "individualni" || course.category === "mesecni";
  const paragraphs = (course.marketing_description || course.description)
    .split("\n")
    .filter((p: string) => p.trim());
  const features: string[] = course.features ?? [];
  const cat = categoryConfig[course.category || "video"] || categoryConfig.video;
  const isPackage = course.category === "paket";
  const ctaLabel = isPackage ? "Kupi paket" : course.category === "individualni" ? "Zakaži" : "Kupi kurs";
  const faq = faqByCategory[course.category || "video"] || faqByCategory.video;

  // Related products
  const { data: related } = await supabase
    .from("courses")
    .select("title, slug, price, paypal_price_eur, category")
    .eq("is_purchasable", true)
    .neq("slug", slug)
    .order("price", { ascending: false })
    .limit(3);

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
            <span className="text-gray-600">{course.title}</span>
          </nav>

          <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-start">
            {/* Left — All content */}
            <div className="flex-1 min-w-0">
              {/* Badge */}
              <span className={`inline-block text-xs font-bold tracking-wide uppercase px-3 py-1 rounded-full mb-4 ${cat.color} ${cat.bg}`}>
                {cat.label}
              </span>

              <h1 className="font-montserrat font-bold text-3xl md:text-4xl lg:text-[2.6rem] text-gray-900 leading-tight mb-5">
                {course.title}
              </h1>

              {/* Social proof mini */}
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                <div className="flex text-amber-400">
                  {"★★★★★".split("").map((s, i) => <span key={i}>{s}</span>)}
                </div>
                <span>5.0 — 300+ Google recenzija</span>
              </div>

              {/* Marketing description */}
              <div className="space-y-4 text-gray-600 text-[16px] leading-[1.75] mb-8">
                {paragraphs.map((p: string, i: number) => (
                  <p key={i}>{p}</p>
                ))}
              </div>

              {/* ─── Šta dobijaš ─── */}
              {features.length > 0 && (
                <div className="mb-8">
                  <h2 className="font-montserrat font-bold text-xl text-gray-900 mb-5">
                    Šta dobijaš {isPackage ? "u paketu" : "upisom"}?
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {features.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 bg-gray-50 rounded-xl p-4"
                      >
                        <div className="flex-shrink-0 w-9 h-9 bg-plava/10 rounded-lg flex items-center justify-center text-plava">
                          {featureIcons[i % featureIcons.length]}
                        </div>
                        <span className="text-gray-700 text-[15px] leading-relaxed pt-1.5">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── FAQ ─── */}
              <div>
                <h2 className="font-montserrat font-bold text-xl text-gray-900 mb-5">
                  Česta pitanja
                </h2>
                <div className="space-y-5">
                  {faq.map((item, i) => (
                    <div key={i} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                      <h3 className="font-bold text-gray-900 text-[15px] mb-2 flex items-start gap-2.5">
                        <span className="flex-shrink-0 w-6 h-6 bg-plava/10 rounded-md flex items-center justify-center text-plava text-xs font-bold mt-0.5">?</span>
                        {item.q}
                      </h3>
                      <p className="text-gray-500 text-[14px] leading-relaxed pl-[34px]">
                        {item.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — Price card (sticky) */}
            <div className="w-full lg:w-[360px] flex-shrink-0">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-xl shadow-gray-200/60 overflow-hidden lg:sticky lg:top-24">
                {/* Price header */}
                <div className="bg-gray-50 px-7 py-6 text-center border-b border-gray-100">
                  <p className="text-4xl font-bold text-gray-900">
                    {isVariable && "od "}
                    {formatPrice(course.price)} <span className="text-xl font-semibold text-gray-400">din</span>
                  </p>
                  {course.paypal_price_eur && (
                    <p className="text-[#F78687] font-bold text-sm mt-1.5">
                      ≈ {course.paypal_price_eur}€
                    </p>
                  )}
                </div>

                <div className="p-7">
                  {/* CTA */}
                  <Link
                    href={`/kupovina/${course.slug}`}
                    className="block w-full text-center bg-[#F78687] hover:bg-[#e06060] text-white font-bold text-lg py-4 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-[#F78687]/25"
                  >
                    {ctaLabel}
                  </Link>

                  {/* Trust signals */}
                  <div className="mt-6 space-y-3.5">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      </div>
                      Pristup odmah nakon uplate
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      </div>
                      Kartica, uplatnica ili PayPal
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      </div>
                      3000+ zadovoljnih polaznika
                    </div>
                  </div>

                  {/* Help */}
                  <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                    <p className="text-sm text-gray-400">
                      Imate pitanje?{" "}
                      <Link href="/kontakt" className="text-plava hover:underline font-medium">
                        Pišite nam
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className="py-16 px-4 bg-plava-light">
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
              {ctaLabel} — {formatPrice(course.price)} din
            </Link>
            <Link
              href="/besplatno-testiranje"
              className="text-plava font-semibold hover:underline text-[15px]"
            >
              Ili uradi besplatno testiranje →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Related products ─── */}
      {related && related.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-montserrat font-bold text-xl text-gray-900 mb-8 text-center">
              Možda će vas zanimati
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {(related as Course[]).map((r) => {
                const rCat = categoryConfig[r.category || "video"] || categoryConfig.video;
                return (
                  <Link
                    key={r.slug}
                    href={`/kursevi/${r.slug}`}
                    className="group border border-gray-200 rounded-xl p-5 hover:border-plava hover:shadow-md transition-all"
                  >
                    <span className={`inline-block text-[11px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full mb-3 ${rCat.color} ${rCat.bg}`}>
                      {rCat.label}
                    </span>
                    <h3 className="font-bold text-gray-900 group-hover:text-plava transition-colors mb-2 text-[15px]">
                      {r.title}
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-gray-900">{formatPrice(r.price)} din</span>
                      {r.paypal_price_eur && (
                        <span className="text-xs text-[#F78687] font-bold">≈ {r.paypal_price_eur}€</span>
                      )}
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
