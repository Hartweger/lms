import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckoutForm from "./CheckoutForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("title")
    .eq("slug", slug)
    .eq("is_purchasable", true)
    .single();
  if (!course) return { title: "Kupovina — Hartweger" };
  return {
    title: `Kupovina: ${course.title} — Hartweger`,
    robots: { index: false },
  };
}

export default async function KupovinaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, slug, price, paypal_price_eur, description, category")
    .eq("slug", slug)
    .eq("is_purchasable", true)
    .single();

  if (!course) notFound();

  // Prepoznaj ulogovanog kupca — prepuni i zaključaj email da se pristup
  // ne dodeli na pogrešan nalog (rizik pri ručnom unosu drugog emaila).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let initialEmail = "";
  let initialName = "";
  if (user) {
    initialEmail = user.email ?? "";
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    initialName = profile?.full_name ?? "";
  }

  return (
    <section className="bg-gradient-to-b from-plava-light/40 to-white min-h-screen">
      <div className="max-w-xl mx-auto px-4 py-10 md:py-16">
        <h1 className="font-montserrat font-bold text-2xl md:text-3xl text-gray-900 mb-2">
          Kupovina
        </h1>
        <p className="text-gray-500 mb-8">
          {course.title}
        </p>

        <CheckoutForm
          courseSlug={course.slug}
          courseTitle={course.title}
          priceRsd={course.price}
          priceEur={course.paypal_price_eur}
          initialEmail={initialEmail}
          initialName={initialName}
          isLoggedIn={!!user}
        />
      </div>
    </section>
  );
}
