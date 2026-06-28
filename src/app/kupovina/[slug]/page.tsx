import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutStrings } from "@/lib/product-i18n";
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
  if (!course) return { title: "Kupovina - Hartweger" };
  return {
    title: `Kupovina: ${course.title} - Hartweger`,
    robots: { index: false },
  };
}

export default async function KupovinaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ kupon?: string }>;
}) {
  const { slug } = await params;
  const { kupon } = await searchParams;
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, slug, price, paypal_price_eur, description, category, course_type, included_lessons, lang")
    .eq("slug", slug)
    .eq("is_purchasable", true)
    .single();

  if (!course) notFound();

  const lang = course.lang === "en" ? "en" : "sr";
  const ct = checkoutStrings(lang);

  // Individualni: učitaj varijacije (cene po profesorki/paketu) za izbor u formi.
  const isIndividual = course.course_type === "individual" ||
    ["individualni", "paket", "mesecni"].includes(course.category ?? "");
  let variants: Array<{ id: string; professor_id: string | null; package_type: string | null; price: number; paypal_price_eur: number | null; professor: { id: string; full_name: string } | null }> = [];
  if (isIndividual) {
    // Service-role: imena profesorki su u user_profiles (RLS dozvoljava samo
    // sopstveni profil/admin), pa anon/student join vraća professor=null →
    // prazan izbor i cena 0. Čitamo na serveru; u browser idu samo id+ime+cena
    // (NE honorar/email).
    const admin = createAdminClient();
    const { data } = await admin
      .from("product_variants")
      .select("id, professor_id, package_type, price, paypal_price_eur, professor:professor_id(id, full_name)")
      .eq("course_id", course.id)
      .eq("is_active", true);
    variants = (data ?? []).map((v) => ({ ...v, professor: Array.isArray(v.professor) ? v.professor[0] ?? null : v.professor }));
  }

  // Prepoznaj ulogovanog kupca - prepuni i zaključaj email da se pristup
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
          {ct.title}
        </h1>
        <p className="text-gray-500 mb-8">
          {course.title}
        </p>

        <CheckoutForm
          courseSlug={course.slug}
          courseTitle={course.title}
          priceRsd={course.price}
          priceEur={course.paypal_price_eur}
          variants={variants}
          includedLessons={course.included_lessons}
          lang={lang}
          initialEmail={initialEmail}
          initialName={initialName}
          isLoggedIn={!!user}
          initialCoupon={kupon ?? ""}
        />
      </div>
    </section>
  );
}
