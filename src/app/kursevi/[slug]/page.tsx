import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Course } from "@/lib/types";

function formatPrice(price: number): string {
  return price.toLocaleString("de-DE");
}

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
  const description = course.marketing_description || course.description;
  const features: string[] = course.features ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link
        href="/kursevi"
        className="text-sm text-plava hover:underline mb-6 inline-block"
      >
        ← Svi kursevi
      </Link>

      <div className="grid md:grid-cols-3 gap-10">
        <div className="md:col-span-2">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-6">
            {course.title}
          </h1>

          <div className="prose prose-gray max-w-none mb-8">
            {description.split("\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {features.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-heading font-bold text-gray-900 mb-4">
                Šta uključuje
              </h2>
              <ul className="space-y-2">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-plava mt-0.5 shrink-0">✓</span>
                    <span className="text-gray-700">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="md:col-span-1">
          <div className="border border-gray-200 rounded-2xl p-6 sticky top-24">
            {course.thumbnail_url && (
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="w-full rounded-xl mb-4"
              />
            )}

            <div className="text-center mb-6">
              <p className="text-3xl font-bold text-gray-900">
                {isVariable && "od "}
                {formatPrice(course.price)} din
              </p>
              {course.paypal_price_eur && (
                <p className="text-sm text-gray-500 mt-1">
                  ~ {course.paypal_price_eur}€
                </p>
              )}
            </div>

            <Link
              href={`/kupovina/${course.slug}`}
              className="block w-full text-center bg-koral hover:bg-koral-dark text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              Kupi kurs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
