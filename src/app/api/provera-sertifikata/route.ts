import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Javna provera sertifikata. Ime vlasnika je u user_profiles (RLS dozvoljava
// samo sopstveni profil/admin), pa browser/anon ne može da ga pročita —
// čitamo service-role klijentom na serveru i vraćamo samo ime+kurs+datum.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = (searchParams.get("id") || "").trim();
  if (!id) return NextResponse.json({ valid: false });

  const supabase = createAdminClient();

  const { data: cert } = await supabase
    .from("certificates")
    .select("user_id, course_id, issued_at")
    .eq("id", id)
    .single();

  if (!cert) return NextResponse.json({ valid: false });

  const [{ data: profile }, { data: course }] = await Promise.all([
    supabase.from("user_profiles").select("full_name").eq("id", cert.user_id).single(),
    supabase.from("courses").select("title").eq("id", cert.course_id).single(),
  ]);

  const date = new Date(cert.issued_at).toLocaleDateString("sr-Latn-RS", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return NextResponse.json({
    valid: true,
    name: profile?.full_name || "Student",
    course: course?.title || "Kurs",
    date,
  });
}
