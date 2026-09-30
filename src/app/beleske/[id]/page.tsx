import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getStudentNote } from "@/lib/beleske-student";
import { formatLessonDateLong } from "@/lib/beleske-date";
import BeleskaRenderer from "@/components/beleska/BeleskaRenderer";

interface PageProps {
  params: Promise<{ id: string }>;
}

// NEMA loading.tsx u ovom folderu (ni u src/app/beleske/) - dodavanje bi otvorilo Suspense
// granicu i notFound() bi ispod nje uvek vraćao 200 umesto 404 (trap_loading_tsx_not_found_status).
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Beleška - Hartweger`,
    robots: { index: false, follow: false },
  };
}

export default async function BeleskaStranica({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/prijava?next=/beleske/${id}`);

  const note = await getStudentNote(user.id, id);
  if (!note) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 md:py-14">
      <Link href="/beleske" className="text-sm text-plava">
        ← Sve beleške
      </Link>

      <div className="mt-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{formatLessonDateLong(note.lessonDate)}</h1>
        {note.professorName && <p className="text-sm text-gray-500 mt-1">{note.professorName}</p>}
      </div>

      <BeleskaRenderer
        content={note.content}
        wordsetHref={note.wordsetId ? `/moje-reci?set=${note.wordsetId}` : undefined}
      />
    </main>
  );
}
