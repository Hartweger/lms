import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emptyNoteContent, noteToPlainText, sanitizeNoteContent } from "@/lib/class-notes";
import { deriveWordsetItems } from "@/lib/wordset-derive";
import { pickSessionForNote, type SessionPick } from "@/lib/group-notes";
import { replaceWordset, upsertNote, type Failure } from "@/lib/class-notes-store";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
type Admin = ReturnType<typeof createAdminClient>;

// Isti obrazac kao api/profesor/class-notes/route.ts.
async function requireStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "professor" && profile?.role !== "admin") return null;
  return { admin, userId: user.id, isAdmin: profile.role === "admin" };
}

// Grupa mora biti staff-ova (admin sve, profesor samo svoju) i mora imati uključene beleške na
// platformi - inače se beleške te grupe i dalje vode u Google Doc-u.
async function loadOwnedGroup(admin: Admin, groupId: string, userId: string, isAdmin: boolean) {
  const { data: g } = await admin
    .from("groups")
    .select("id, professor_id, notes_on_platform")
    .eq("id", groupId)
    .single();
  if (!g) return { error: "Grupa nije pronađena", status: 404 as const };
  if (!isAdmin && g.professor_id !== userId) return { error: "Nije tvoja grupa", status: 403 as const };
  if (!g.notes_on_platform) {
    return { error: "Beleške ove grupe se vode u Google Doc-u.", status: 409 as const, code: "nije_na_platformi" };
  }
  return { g };
}

// groupId + date su obavezni i isto se proveravaju za GET i PUT.
function parseParams(groupId: unknown, date: unknown) {
  const id = String(groupId ?? "").trim();
  const d = String(date ?? "").trim();
  if (!id || !d) return { error: "groupId i date su obavezni" };
  if (!DATE_RE.test(d)) return { error: "date mora biti u obliku YYYY-MM-DD" };
  return { id, date: d };
}

// unique(group_id, session_date) - najviše jedan red; limit(1) umesto maybeSingle da ne pukne.
async function findSession(admin: Admin, groupId: string, date: string): Promise<Failure | SessionPick> {
  const { data, error } = await admin
    .from("group_sessions")
    .select("id, cancelled")
    .eq("group_id", groupId)
    .eq("session_date", date)
    .limit(1);
  if (error) return { error: error.message, status: 500 };
  return pickSessionForNote((data ?? []) as { id: string; cancelled: boolean }[]);
}

const OTKAZAN: Failure = {
  error: "Ovaj čas je označen kao otkazan - beleška ne može da se veže za njega.",
  status: 409,
  code: "otkazan",
};

// GET ?groupId=...&date=YYYY-MM-DD - postojeća beleška ili prazan obrazac. Ne piše ništa.
export async function GET(request: Request) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const parsed = parseParams(searchParams.get("groupId"), searchParams.get("date"));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const owned = await loadOwnedGroup(staff.admin, parsed.id, staff.userId, staff.isAdmin);
  if ("error" in owned) return NextResponse.json({ error: owned.error, code: owned.code }, { status: owned.status });

  const pick = await findSession(staff.admin, parsed.id, parsed.date);
  if ("error" in pick) return NextResponse.json({ error: pick.error }, { status: pick.status });
  if (pick.kind === "cancelled") return NextResponse.json({ error: OTKAZAN.error, code: OTKAZAN.code }, { status: 409 });
  if (pick.kind === "none") return NextResponse.json({ content: emptyNoteContent(), noteId: null, sessionId: null });

  const { data: note } = await staff.admin
    .from("class_notes")
    .select("id, content")
    .eq("group_session_id", pick.sessionId)
    .maybeSingle();
  return NextResponse.json({
    content: note ? sanitizeNoteContent(note.content) : emptyNoteContent(),
    noteId: note?.id ?? null,
    sessionId: pick.sessionId,
  });
}

// PUT { groupId, date, content } - snima belešku; sesija (ako je nema) i set reči grupe idu uz nju.
export async function PUT(request: Request) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  let body: { groupId?: unknown; date?: unknown; content?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neispravan JSON" }, { status: 400 });
  }
  const parsed = parseParams(body.groupId, body.date);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { id: groupId, date } = parsed;
  const content = sanitizeNoteContent(body.content);
  const admin = staff.admin;

  const owned = await loadOwnedGroup(admin, groupId, staff.userId, staff.isAdmin);
  if ("error" in owned) return NextResponse.json({ error: owned.error, code: owned.code }, { status: owned.status });
  // Grupa bez dodeljene profesorke - belešku i sesiju preuzima ona koja baš sad snima.
  const professorId = owned.g.professor_id ?? staff.userId;

  // 1. Sesija - nađi ili upiši 'manual' (isti upis kao „Dodaj sesiju" u grupna-sesija POST):
  // profesorka je održala čas pa ga beleži.
  let pick = await findSession(admin, groupId, date);
  if ("error" in pick) return NextResponse.json({ error: pick.error }, { status: pick.status });
  if (pick.kind === "cancelled") return NextResponse.json({ error: OTKAZAN.error, code: OTKAZAN.code }, { status: 409 });
  if (pick.kind === "none") {
    const { error } = await admin.from("group_sessions").upsert(
      { group_id: groupId, professor_id: professorId, session_date: date, source: "manual" },
      { onConflict: "group_id,session_date", ignoreDuplicates: true },
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    pick = await findSession(admin, groupId, date); // ponovo čitamo - trka sa sync-om ili drugom karticom
    if ("error" in pick) return NextResponse.json({ error: pick.error }, { status: pick.status });
    if (pick.kind === "cancelled") return NextResponse.json({ error: OTKAZAN.error, code: OTKAZAN.code }, { status: 409 });
    if (pick.kind !== "found") return NextResponse.json({ error: "Čas nije mogao da se upiše" }, { status: 500 });
  }
  const sessionId = pick.sessionId;

  // 2. Beleška.
  const noteResult = await upsertNote(
    admin, { column: "group_session_id", id: sessionId }, professorId, content, noteToPlainText(content),
  );
  if ("error" in noteResult) return NextResponse.json({ error: noteResult.error }, { status: noteResult.status });
  const { noteId } = noteResult;

  // 3. Set reči grupe - position = redni broj neotkazanih sesija do ovog datuma (kozmetički broj
  // u naslovu „Termin N", ne utiče na napredak).
  const items = deriveWordsetItems(content.wortschatz);
  const { count } = await admin
    .from("group_sessions")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId)
    .eq("cancelled", false)
    .lte("session_date", date);
  const wsError = await replaceWordset(admin, noteId, { group_id: groupId }, date, count ?? 1, items);
  if (wsError) return NextResponse.json({ error: wsError.error }, { status: wsError.status });

  return NextResponse.json({ ok: true, noteId, sessionId, words: items.length });
}
