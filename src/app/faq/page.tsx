import { createClient } from "@/lib/supabase/server";
import FaqAccordion from "@/components/FaqAccordion";
import type { FaqItem } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — Često postavljena pitanja | Hartweger",
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
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-montserrat text-3xl font-bold text-gray-900 mb-8">
        Često postavljena pitanja
      </h1>

      {faqItems.length === 0 ? (
        <p className="text-gray-500">Nema pitanja za prikaz.</p>
      ) : (
        <FaqAccordion items={faqItems} />
      )}
    </main>
  );
}
