import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "admin";
}

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: profData } = await admin
    .from("user_profiles")
    .select("id, full_name, email")
    .eq("role", "professor")
    .order("full_name");

  const { data: assignData } = await admin
    .from("professor_students")
    .select("professor_id");

  const countMap = new Map<string, number>();
  for (const a of assignData ?? []) {
    countMap.set(a.professor_id, (countMap.get(a.professor_id) ?? 0) + 1);
  }

  const professors = (profData ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name ?? "",
    email: p.email,
    studentCount: countMap.get(p.id) ?? 0,
  }));

  return NextResponse.json({ professors });
}
