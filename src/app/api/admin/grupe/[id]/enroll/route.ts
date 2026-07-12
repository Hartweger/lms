import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { nextExpiry } from "@/lib/groups";

// POST: dodaj polaznika po mejlu → nađi-ili-kreiraj nalog + enrollment + grant pristupa na content kurs.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;
  const { id: groupId } = await params;
  const email = (((await req.json()).email as string) || "").toLowerCase().trim();
  if (!email.includes("@")) return NextResponse.json({ error: "Neispravan mejl" }, { status: 400 });

  const { data: group } = await admin.from("groups").select("content_course_id").eq("id", groupId).single();
  if (!group) return NextResponse.json({ error: "Grupa ne postoji" }, { status: 404 });

  // find-or-create user (tiho, bez mejla)
  const { data: prof } = await admin.from("user_profiles").select("id, full_name").eq("email", email).maybeSingle();
  let uid = prof?.id as string | undefined;
  if (!uid) {
    const { data: nu, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
    if (error || !nu?.user) return NextResponse.json({ error: error?.message || "createUser pao" }, { status: 400 });
    uid = nu.user.id;
    await admin.from("user_profiles").upsert({ id: uid, email, role: "student" });
  }

  // enrollment (idempotentno); cancelled_at: null resetuje stari datum ispisa pri ponovnom upisu
  await admin.from("group_enrollments").upsert(
    { group_id: groupId, user_id: uid, status: "active", cancelled_at: null }, { onConflict: "group_id,user_id" },
  );

  // grant pristupa na sadržajni kurs (nikad ne skraćuj)
  if (group.content_course_id) {
    const { data: cur } = await admin.from("course_access")
      .select("expires_at").eq("user_id", uid).eq("course_id", group.content_course_id).maybeSingle();
    const curMs = cur?.expires_at ? new Date(cur.expires_at).getTime() : null;
    const finalExp = new Date(nextExpiry(curMs)).toISOString();
    await admin.from("course_access").upsert(
      { user_id: uid, course_id: group.content_course_id, expires_at: finalExp, source: "grupa-rucni-unos" },
      { onConflict: "user_id,course_id" },
    );
  }
  return NextResponse.json({ ok: true, user_id: uid, full_name: prof?.full_name || null });
}

// DELETE: ukloni polaznika iz grupe (pristup se NE oduzima).
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;
  const { id: groupId } = await params;
  const userId = (await req.json()).user_id as string;
  const { error } = await admin.from("group_enrollments")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("group_id", groupId).eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
