import { createClient } from "@/lib/supabase/server";
import FaqAccordion from "@/components/FaqAccordion";
import Link from "next/link";
import type { FaqItem } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Česta pitanja — Hartweger",
  description: "Odgovori na najčešća pitanja o kursevima nemačkog jezika, plaćanju, pristupu platformi i sertifikatima.",
  openGraph: {
    title: "Česta pitanja — Hartweger",
    description: "Odgovori na najčešća pitanja o kursevima nemačkog jezika, plaćanju, pristupu platformi i sertifikatima.",
  },
};

export default async function FaqPage() {
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("faq_items")
    .select("*")
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  const faqItems = (items ?? []) as FaqItem[];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqItems.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
            })),
          }),
        }}
      />
      <section className="bg-gradient-to-b from-plava-light/60 to-white py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-montserrat font-bold text-3xl md:text-4xl text-gray-900 mb-4">
            Česta pitanja
          </h1>
          <p className="text-gray-600 text-lg">
            Odgovori na najčešća pitanja o kursevima, plaćanju i platformi.
          </p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {faqItems.length === 0 ? (
            <p className="text-gray-500">Nema pitanja za prikaz.</p>
          ) : (
            <FaqAccordion items={faqItems} />
          )}

          <div className="mt-12 bg-gray-50 rounded-xl p-6 text-center">
            <p className="text-gray-600 mb-4">Niste pronašli odgovor?</p>
            <Link
              href="/kontakt"
              className="inline-block bg-plava text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-plava-dark transition-colors"
            >
              Pišite nam
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
