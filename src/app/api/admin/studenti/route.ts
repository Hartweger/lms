import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { data: studentData } = await admin
    .from("user_profiles")
    .select("id, full_name, email, created_at")
    .eq("role", "student")
    .order("created_at", { ascending: false });

  const { data: courseData } = await admin.from("courses").select("id, title");

  const { data: accessData } = await admin
    .from("course_access")
    .select("user_id, course_id, expires_at");

  // Get last activity per user from lesson_progress
  const { data: progressData } = await admin
    .from("lesson_progress")
    .select("user_id, completed_at")
    .eq("completed", true)
    .order("completed_at", { ascending: false });

  // Get last activity from exercise_attempts
  const { data: attemptData } = await admin
    .from("exercise_attempts")
    .select("user_id, completed_at")
    .order("completed_at", { ascending: false });

  // Build last activity map
  const lastActivityMap = new Map<string, string>();
  for (const p of progressData ?? []) {
    if (p.completed_at && (!lastActivityMap.has(p.user_id) || p.completed_at > lastActivityMap.get(p.user_id)!)) {
      lastActivityMap.set(p.user_id, p.completed_at);
    }
  }
  for (const a of attemptData ?? []) {
    if (a.completed_at && (!lastActivityMap.has(a.user_id) || a.completed_at > lastActivityMap.get(a.user_id)!)) {
      lastActivityMap.set(a.user_id, a.completed_at);
    }
  }

  const accessByUser = new Map<string, { course_id: string; expires_at: string | null }[]>();
  for (const a of accessData ?? []) {
    const list = accessByUser.get(a.user_id) ?? [];
    list.push({ course_id: a.course_id, expires_at: a.expires_at });
    accessByUser.set(a.user_id, list);
  }

  // Get last_sign_in_at from auth
  const { data: { users: authUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const signInMap = new Map<string, string | null>();
  for (const u of authUsers) {
    signInMap.set(u.id, u.last_sign_in_at ?? null);
  }

  const students = (studentData ?? []).map((s: { id: string; full_name: string | null; email: string; created_at: string }) => ({
    id: s.id,
    full_name: s.full_name,
    email: s.email,
    created_at: s.created_at,
    courseAccess: accessByUser.get(s.id) ?? [],
    lastActivity: lastActivityMap.get(s.id) ?? null,
    lastSignIn: signInMap.get(s.id) ?? null,
  }));

  return NextResponse.json({ students, courses: courseData ?? [] });
}
