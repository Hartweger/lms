import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function SertifikatStranica({ params }: PageProps) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: cert } = await supabase
    .from("certificates")
    .select("*")
    .eq("id", id)
    .single();

  if (!cert) notFound();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name")
    .eq("id", cert.user_id)
    .single();

  const { data: course } = await supabase
    .from("courses")
    .select("title")
    .eq("id", cert.course_id)
    .single();

  const studentName = profile?.full_name || "Student";
  const courseTitle = course?.title || "Kurs";
  const date = new Date(cert.issued_at).toLocaleDateString("sr-Latn-RS", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="bg-white rounded-xl p-8 shadow-sm">
        <div className="text-plava font-bold text-lg mb-1">HARTWEGER</div>
        <div className="text-gray-400 text-sm mb-6">Škola nemačkog jezika</div>
        <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">Sertifikat potvrđuje da je</div>
        <div className="text-2xl font-bold text-plava mb-4">{studentName}</div>
        <div className="text-gray-500 mb-1">uspešno završio/la kurs</div>
        <div className="text-xl font-bold text-gray-900 mb-6">{courseTitle}</div>
        <div className="text-sm text-gray-400 mb-4">Datum: {date}</div>
        <div className="text-xs text-gray-300">ID: {cert.id}</div>
        <Link
          href={`/api/sertifikat/${cert.id}`}
          target="_blank"
          className="inline-block mt-6 bg-plava text-white px-6 py-3 rounded-lg hover:bg-plava-dark transition-colors"
        >
          Preuzmi PDF
        </Link>
      </div>
    </div>
  );
}
