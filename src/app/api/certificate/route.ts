import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAndIssueCertificate } from "@/lib/certificate-check";

/**
 * Izdavanje sertifikata za Modelltest - server-side. Per-modul: SVAKI modul (Lesen, Hören,
 * Schreiben) mora ≥60%. Schreiben (eseji) mora prvo da oceni profesorka. Idempotentno (user+course).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { lessonId?: string; courseId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const { lessonId, courseId } = body;
  if (!lessonId || !courseId) {
    return NextResponse.json({ error: "Missing lessonId or courseId" }, { status: 400 });
  }

  const admin = createAdminClient();
  const result = await checkAndIssueCertificate(admin, user.id, lessonId, courseId);
  if (result.reason === "mismatch") {
    return NextResponse.json({ error: "Lesson/course mismatch" }, { status: 400 });
  }
  return NextResponse.json(result);
}
