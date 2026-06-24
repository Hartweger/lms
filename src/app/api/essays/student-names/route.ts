// Vrati imena/mejlove učenika za zadate id-jeve (service-role, zaobilazi RLS).
// Razlog: RLS na user_profiles ne dozvoljava profesoru da čita tuđe profile →
// imena u /profesor/eseji bi bila "Nepoznat".
// Staff-only: admin sme sva imena; profesor samo svojih dodeljenih učenika.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin" && profile?.role !== "professor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { ids } = await request.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ names: {} });
  }

  // Profesor sme samo imena svojih dodeljenih učenika.
  let allowedIds: string[] = ids;
  if (profile.role === "professor") {
    const { data: links } = await admin
      .from("professor_students")
      .select("student_id")
      .eq("professor_id", user.id)
      .in("student_id", ids);
    const own = new Set((links ?? []).map((l) => l.student_id as string));
    allowedIds = ids.filter((id: string) => own.has(id));
  }

  if (allowedIds.length === 0) return NextResponse.json({ names: {} });

  const { data: profs } = await admin
    .from("user_profiles")
    .select("id, full_name, email")
    .in("id", allowedIds);

  const names: Record<string, { full_name: string; email: string }> = {};
  for (const p of profs ?? []) {
    names[p.id as string] = { full_name: (p.full_name as string) ?? "", email: (p.email as string) ?? "" };
  }
  return NextResponse.json({ names });
}
