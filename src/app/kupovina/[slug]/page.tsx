import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renewalProductSlug } from "@/lib/renewal-product";
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

  if (!course) {
    // Sadržajni kurs („nemacki-a1-1") nije u prodaji - prodaje se proizvod koji ga
    // otključava. Stari linkovi „Obnovi pristup" (127 poslatih mejlova od 10.06.2026)
    // gađaju sadržajni slug; preusmeri ih umesto da polaznik dobije 404.
    // Admin klijent: neki sadržajni kursevi su nevidljivi za anon (RLS, nepublikovani),
    // pa bi student svejedno dobio 404 umesto preusmerenja.
    const admin = createAdminClient();
    const { data: content } = await admin
      .from("courses").select("id").eq("slug", slug).maybeSingle();
    if (content) {
      const product = await renewalProductSlug(admin, content.id);
      // Postojeći kurs bez samoposlužnog proizvoda (npr. grupni C1.1) vodi na ponudu,
      // ne na 404 - polaznik je došao sa namerom da kupi, ne sme da udari u zid.
      if (!product || product === slug) redirect("/kursevi");
      redirect(`/kupovina/${product}${kupon ? `?kupon=${encodeURIComponent(kupon)}` : ""}`);
    }
    notFound();
  }

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

        {/* Program uživo (NH Academy): pred unos kartice kupac treba da vidi šta tačno
            kupuje - datume i sadržaj. Opis je oduvek bio u bazi, ali se nigde nije
            prikazivao, pa je stranica za 57.300 RSD nudila samo naziv i cenu. */}
        {course.category === "program" && course.description && (
          <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5 md:p-6">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Šta kupuješ</p>
            <p className="text-[15px] leading-relaxed text-gray-700">{course.description}</p>
            <p className="text-sm text-gray-500 mt-4">
              Ne možeš odjednom?{" "}
              <a href="mailto:info@hartweger.rs" className="text-plava underline">
                Piši nam
              </a>{" "}
              i dogovaramo rate.
            </p>
          </div>
        )}

        <CheckoutForm
          courseSlug={course.slug}
          courseTitle={course.title}
          category={course.category}
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
