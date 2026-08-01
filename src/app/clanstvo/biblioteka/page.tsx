// Biblioteka članstva: sve lekcije sadržajnog kursa grupisane po modulima
// (lessons.module_name - generisana kolona iz badge bloka, migracija 060).
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CLANSTVO_CONTENT_SLUG } from "@/lib/clanstvo";

export const dynamic = "force-dynamic";

export default async function Biblioteka() {
  const supabase = await createClient();
  const { data: kurs } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", CLANSTVO_CONTENT_SLUG)
    .single();

  // Kurs je is_published (migracija 073) pa RLS ne krije red od članica, ali
  // se svejedno čuvamo praznog reda umesto pada stranice.
  const { data: lekcije } = kurs
    ? await supabase
        .from("lessons")
        .select("id, title, order_index, module_name")
        .eq("course_id", kurs.id)
        .order("order_index", { ascending: true })
    : { data: null };

  const grupe = new Map<string, { id: string; title: string }[]>();
  for (const l of lekcije ?? []) {
    const modul = l.module_name || "Lekcije";
    if (!grupe.has(modul)) grupe.set(modul, []);
    grupe.get(modul)!.push(l);
  }

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-3xl font-bold text-nh-dark">Biblioteka</h1>
      {[...grupe.entries()].map(([modul, ls]) => (
        <section key={modul}>
          <h2 className="font-heading text-lg font-bold text-nh-pink">{modul}</h2>
          <ul className="mt-2 divide-y divide-nh-pink-light rounded-xl border border-nh-pink-light bg-white">
            {ls.map((l) => (
              <li key={l.id}>
                <Link href={`/lekcija/${l.id}`} className="block px-4 py-3 hover:bg-nh-pink-bg">
                  {l.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {grupe.size === 0 && <p className="text-nh-dark/60">Prve lekcije stižu uskoro.</p>}
    </div>
  );
}
