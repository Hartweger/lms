import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;

  const { data: profData } = await admin
    .from("user_profiles")
    .select("id, full_name, email")
    .eq("role", "professor")
    .order("full_name");

  // Individualni studenti (professor_students)
  const { data: assignData } = await admin
    .from("professor_students")
    .select("professor_id");

  const countMap = new Map<string, number>();
  for (const a of assignData ?? []) {
    countMap.set(a.professor_id, (countMap.get(a.professor_id) ?? 0) + 1);
  }

  // Grupni studenti (groups.professor_id → group_enrollments aktivni, distinct po profesoru)
  const { data: groups } = await admin.from("groups").select("id, professor_id");
  const groupToProf = new Map<string, string>();
  for (const g of groups ?? []) if (g.professor_id) groupToProf.set(g.id, g.professor_id);
  const { data: ge } = await admin.from("group_enrollments").select("group_id, user_id").eq("status", "active");
  const groupStudents = new Map<string, Set<string>>();
  for (const e of ge ?? []) {
    const prof = groupToProf.get(e.group_id);
    if (!prof) continue;
    if (!groupStudents.has(prof)) groupStudents.set(prof, new Set());
    groupStudents.get(prof)!.add(e.user_id);
  }

  const professors = (profData ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name ?? "",
    email: p.email,
    studentCount: countMap.get(p.id) ?? 0,
    groupCount: groupStudents.get(p.id)?.size ?? 0,
  }));

  return NextResponse.json({ professors });
}
