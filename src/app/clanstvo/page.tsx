// Početna članstva: pozdrav + najnovije lekcije + prečica u zajednicu.
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CLANSTVO_CONTENT_SLUG } from "@/lib/clanstvo";

export const dynamic = "force-dynamic";

export default async function ClanstvoPocetna() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profil } = await supabase
    .from("user_profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const { data: kurs } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", CLANSTVO_CONTENT_SLUG)
    .single();

  // Sadržajni kurs je is_published (migracija 073), pa je vidljiv i članicama
  // (RLS "Anyone can read published courses"), ne samo adminu - ali čuvamo se
  // praznog reda umesto pada stranice (kurs!.id) ako migracija/seed izostane.
  const { data: lekcije } = kurs
    ? await supabase
        .from("lessons")
        .select("id, title, created_at")
        .eq("course_id", kurs.id)
        .order("created_at", { ascending: false })
        .limit(3)
    : { data: null };

  const ime = (profil?.full_name ?? "").split(" ")[0] || "članice";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-nh-dark">
          Dobro došla, {ime} 💗
        </h1>
        <p className="mt-1 text-nh-dark/70">
          Tvoje članstvo je aktivno. Nove lekcije stižu svakog meseca.
        </p>
      </div>

      <section>
        <h2 className="font-heading text-xl font-bold text-nh-dark">Najnovije lekcije</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {(lekcije ?? []).map((l) => (
            <Link
              key={l.id}
              href={`/lekcija/${l.id}`}
              className="rounded-xl border border-nh-pink-light bg-white p-4 hover:shadow-md"
            >
              <p className="font-semibold text-nh-dark">{l.title}</p>
            </Link>
          ))}
          {(lekcije ?? []).length === 0 && (
            <p className="text-nh-dark/60">Prve lekcije stižu uskoro.</p>
          )}
        </div>
        <Link href="/clanstvo/biblioteka" className="mt-3 inline-block text-sm font-semibold text-nh-pink">
          Cela biblioteka →
        </Link>
      </section>

      <section className="rounded-xl bg-nh-pink-bg p-6">
        <h2 className="font-heading text-xl font-bold text-nh-dark">Zajednica</h2>
        <p className="mt-1 text-nh-dark/70">
          Postavi pitanje ili podeli uspeh - Nataša odgovara svakog dana.
        </p>
        <Link
          href="/clanstvo/zajednica"
          className="mt-3 inline-block rounded-full bg-nh-pink px-5 py-2 font-semibold text-white"
        >
          Otvori chat
        </Link>
      </section>

      <section className="rounded-xl border border-nh-pink-light bg-white p-6">
        <h2 className="font-heading text-xl font-bold text-nh-dark">📱 Dodaj na početni ekran</h2>
        <p className="mt-1 text-nh-dark/70">
          Članstvo radi i kao aplikacija — dodaš ikonicu na telefon i sve ti je na jedan dodir.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm text-nh-dark/80">
          <div>
            <p className="font-semibold text-nh-dark">iPhone (Safari)</p>
            <p>
              Dugme <span className="font-semibold">Podeli</span> (kvadrat sa strelicom) →{" "}
              <span className="font-semibold">Dodaj na početni ekran</span>
            </p>
          </div>
          <div>
            <p className="font-semibold text-nh-dark">Android (Chrome)</p>
            <p>
              Meni <span className="font-semibold">⋮</span> →{" "}
              <span className="font-semibold">Dodaj na početni ekran</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
