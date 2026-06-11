import { createClient } from "@/lib/supabase/server";
import FaqAccordion from "@/components/FaqAccordion";
import Link from "next/link";
import type { FaqItem } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Česta pitanja — Hartweger",
  description: "Odgovori na najčešća pitanja o kursevima nemačkog jezika, plaćanju, pristupu platformi i sertifikatima.",
  openGraph: {
    images: [{ url: "/og/share.png", width: 1200, height: 630, alt: "Hartweger — Škola nemačkog jezika" }],
    title: "Česta pitanja — Hartweger",
    description: "Odgovori na najčešća pitanja o kursevima nemačkog jezika, plaćanju, pristupu platformi i sertifikatima.",
  },
};

// Redosled i nazivi sekcija — prati put kupca (pre → posle kupovine).
const CATEGORY_ORDER: { value: string; label: string }[] = [
  { value: "pre-kupovine", label: "Pre kupovine" },
  { value: "nakon-kupovine", label: "Nakon kupovine" },
];

// Markdown linkove [tekst](url) sklanja na čist tekst za JSON-LD schema (SEO).
function stripLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
}

export default async function FaqPage() {
  const supabase = await createClient();

  const { data: items } = await supabase
    .from("faq_items")
    .select("*")
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  const faqItems = (items ?? []) as FaqItem[];

  // Grupiši po kategoriji, preskoči prazne sekcije.
  const groups = CATEGORY_ORDER
    .map((c) => ({ ...c, items: faqItems.filter((i) => i.category === c.value) }))
    .filter((g) => g.items.length > 0);

  // Pitanja sa nepoznatom kategorijom idu u "Ostalo" da se ništa ne izgubi.
  const known = new Set(CATEGORY_ORDER.map((c) => c.value));
  const otherItems = faqItems.filter((i) => !known.has(i.category));
  if (otherItems.length > 0) {
    groups.push({ value: "ostalo", label: "Ostalo", items: otherItems });
  }

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
                text: stripLinks(item.answer),
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

          {groups.length > 1 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {groups.map((g) => (
                <a
                  key={g.value}
                  href={`#${g.value}`}
                  className="rounded-full border border-plava/30 bg-white px-4 py-1.5 text-sm font-medium text-plava hover:bg-plava hover:text-white transition-colors"
                >
                  {g.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {groups.length === 0 ? (
            <p className="text-gray-500">Nema pitanja za prikaz.</p>
          ) : (
            <div className="space-y-12">
              {groups.map((g) => (
                <div key={g.value} id={g.value} className="scroll-mt-24">
                  <h2 className="font-montserrat font-bold text-xl md:text-2xl text-gray-900 mb-4">
                    {g.label}
                  </h2>
                  <FaqAccordion items={g.items} />
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 bg-gray-50 rounded-xl p-6 text-center">
            <p className="text-gray-600 mb-4">Ne vidiš odgovor na svoje pitanje?</p>
            <Link
              href="/kontakt"
              className="inline-block bg-plava text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-plava-dark transition-colors"
            >
              Piši nam
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
