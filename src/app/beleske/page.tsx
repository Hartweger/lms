import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listStudentNotes } from "@/lib/beleske-student";
import { formatLessonDateShort } from "@/lib/beleske-date";

// Iza prijave, ličan sadržaj po korisniku - ne sme u indeks (isti obrazac kao /nalog).
export const metadata = { title: "Beleške sa časova - Hartweger", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function BeleskePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/prijava?next=/beleske");

  const notes = await listStudentNotes(user.id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 md:py-14">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Beleške sa časova</h1>
      <p className="text-sm text-gray-500 mb-6">Ono što profesorka zapiše posle svakog časa.</p>

      {notes.length === 0 ? (
        <p className="rounded-xl border border-gray-100 bg-white p-5 text-sm text-gray-500">
          Još nema beleški. Pojaviće se posle prvog časa.
        </p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id}>
              <Link
                href={`/beleske/${n.id}`}
                className="block rounded-xl border border-gray-100 bg-white p-4 hover:border-plava-light hover:bg-plava-light/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-gray-900">{formatLessonDateShort(n.lessonDate)}</p>
                  {n.hasWords && (
                    <span className="shrink-0 rounded-full bg-ljubicasta-light px-2.5 py-0.5 text-xs font-medium text-gray-600">
                      reči
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600">{n.preview ?? "Bez opisa"}</p>
                {n.professorName && (
                  <p className="mt-1 text-xs text-gray-400">{n.professorName}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-xs text-gray-400">
        Beleške se čuvaju 6 meseci posle časa. Reči i napredak ostaju i posle toga.
      </p>
    </main>
  );
}
