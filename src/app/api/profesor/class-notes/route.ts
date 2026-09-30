import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import { computeLessonStatus } from "@/lib/individual-lessons";
import {
  emptyNoteContent,
  noteToPlainText,
  TEXT_SECTIONS,
  type NoteContent,
  type WortschatzRow,
} from "@/lib/class-notes";
import { deriveWordsetItems, wordsetTitle, type WordsetItem } from "@/lib/wordset-derive";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Profesor (svoje) ili admin (sve). Vraća { admin, userId, isAdmin } ili null.
// Isti obrazac kao u api/profesor/individualni-cas/route.ts.
async function requireStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("user_profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "professor" && profile?.role !== "admin") return null;
  return { admin, userId: user.id, isAdmin: profile.role === "admin" };
}

// Učita enrollment i proveri da staff sme da ga dira (admin sve, profesor samo svoje).
async function loadOwnedEnrollment(
  admin: ReturnType<typeof createAdminClient>,
  enrollmentId: string,
  userId: string,
  isAdmin: boolean
) {
  const { data: enr } = await admin
    .from("individual_enrollments")
    .select("id, professor_id, package_lessons")
    .eq("id", enrollmentId)
    .single();
  if (!enr) return { error: "Upis nije pronađen", status: 404 as const };
  if (!isAdmin && enr.professor_id !== userId) return { error: "Nije tvoj polaznik", status: 403 as const };
  return { enr };
}

// enrollmentId + date su obavezni i isto se proveravaju za GET i PUT.
function parseParams(enrollmentId: unknown, date: unknown) {
  const id = String(enrollmentId ?? "").trim();
  const d = String(date ?? "").trim();
  if (!id || !d) return { error: "enrollmentId i date su obavezni" };
  if (!DATE_RE.test(d)) return { error: "date mora biti u obliku YYYY-MM-DD" };
  return { id, date: d };
}

/**
 * Sadržaj beleške može doći iz baze (stariji/oštećen zapis) ili sa fronta (profesorkin unos) -
 * u oba slučaja ga svodimo na očekivani oblik PRE nego što uđe u noteToPlainText/deriveWordsetItems,
 * koje ne proveravaju tipove (npr. content.wortschatz.length bi pukao da wortschatz nije niz).
 * Bez ovoga bi neispravan content (null, string umesto niza...) oborio rutu u 500 bez poruke.
 */
function sanitizeNoteContent(raw: unknown): NoteContent {
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out = emptyNoteContent();
  for (const s of TEXT_SECTIONS) {
    const v = src[s.key];
    if (typeof v === "string" && v.trim().length > 0) out[s.key] = v;
  }
  const rows = Array.isArray(src.wortschatz) ? src.wortschatz : [];
  out.wortschatz = rows
    .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
    .map((r): WortschatzRow => ({ de: String(r.de ?? ""), sr: String(r.sr ?? "") }));
  return out;
}

// Prebroji časove i ažuriraj lessons_used + status na enrollmentu - isti obrazac kao
// recountLessons() u api/profesor/individualni-cas/route.ts.
async function recountLessons(admin: ReturnType<typeof createAdminClient>, enrollmentId: string, packageLessons: number) {
  const { count } = await admin.from("individual_lessons").select("*", { count: "exact", head: true }).eq("enrollment_id", enrollmentId);
  const used = count ?? 0;
  await admin.from("individual_enrollments").update({
    lessons_used: used,
    status: computeLessonStatus(used, packageLessons),
  }).eq("id", enrollmentId);
  return used;
}

type Failure = { error: string; status: number };

// Nađi individual_lessons red za enrollment+datum, ili ga napravi (samo ovde se čas STVARNO
// beleži - GET nikad ne piše). select-pa-insert sužava prozor za trku (dve kartice profesorke
// istovremeno), ali ga ne zatvara jer individual_lessons nema unique(enrollment_id, lesson_date) -
// zaključavanje je namerno ostavljeno za kasnije (videti napomenu u izveštaju).
async function findOrCreateLesson(
  admin: ReturnType<typeof createAdminClient>,
  enrollmentId: string,
  date: string,
  professorId: string,
  packageLessons: number
): Promise<{ lessonId: string } | Failure> {
  const { data: existing, error: selectError } = await admin
    .from("individual_lessons")
    .select("id")
    .eq("enrollment_id", enrollmentId)
    .eq("lesson_date", date)
    .maybeSingle();
  if (selectError) return { error: selectError.message, status: 500 };
  if (existing) return { lessonId: existing.id };

  const { data: inserted, error: insertError } = await admin
    .from("individual_lessons")
    .insert({ enrollment_id: enrollmentId, professor_id: professorId, lesson_date: date })
    .select("id")
    .single();
  if (insertError || !inserted) {
    return { error: insertError?.message ?? "Čas nije mogao da se kreira", status: 500 };
  }
  await recountLessons(admin, enrollmentId, packageLessons);
  return { lessonId: inserted.id };
}

// Beleška: select pa update/insert - upsert sa onConflict NE RADI ovde jer je
// class_notes_individual_uq parcijalan indeks (where individual_lesson_id is not null).
async function upsertNote(
  admin: ReturnType<typeof createAdminClient>,
  lessonId: string,
  professorId: string,
  content: NoteContent,
  contentText: string
): Promise<{ noteId: string } | Failure> {
  const { data: existing, error: selectError } = await admin
    .from("class_notes")
    .select("id")
    .eq("individual_lesson_id", lessonId)
    .maybeSingle();
  if (selectError) return { error: selectError.message, status: 500 };

  if (existing) {
    const { error } = await admin
      .from("class_notes")
      .update({ content: content as unknown as Json, content_text: contentText, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) return { error: error.message, status: 500 };
    return { noteId: existing.id };
  }

  const { data: inserted, error } = await admin
    .from("class_notes")
    .insert({
      individual_lesson_id: lessonId,
      professor_id: professorId,
      content: content as unknown as Json,
      content_text: contentText,
    })
    .select("id")
    .single();
  if (!error && inserted) return { noteId: inserted.id };

  // Trka: dva istovremena PUT-a za isti čas oba prođu select (ništa nađeno), pa oba pokušaju insert -
  // class_notes_individual_uq obori drugi kodom 23505 umesto da ga pusti. Umesto 500, preuzmi
  // belešku koju je konkurentski zahtev upravo napravio i ažuriraj nju (poslednje snimanje važi) -
  // tako se za isti čas nikad ne stvore dve beleške.
  if (error?.code === "23505") {
    const { data: raced } = await admin
      .from("class_notes")
      .select("id")
      .eq("individual_lesson_id", lessonId)
      .maybeSingle();
    if (raced) {
      const { error: updateError } = await admin
        .from("class_notes")
        .update({ content: content as unknown as Json, content_text: contentText, updated_at: new Date().toISOString() })
        .eq("id", raced.id);
      if (updateError) return { error: updateError.message, status: 500 };
      return { noteId: raced.id };
    }
  }
  return { error: error?.message ?? "Beleška nije mogla da se snimi", status: 500 };
}

// Set reči izveden iz WORTSCHATZ: puna zamena stavki, ili brisanje seta ako je reči nestalo.
async function replaceWordset(
  admin: ReturnType<typeof createAdminClient>,
  noteId: string,
  enrollmentId: string,
  date: string,
  position: number,
  items: WordsetItem[]
): Promise<Failure | null> {
  const { data: existing, error: selectError } = await admin
    .from("student_wordsets")
    .select("id")
    .eq("note_id", noteId)
    .maybeSingle();
  if (selectError) return { error: selectError.message, status: 500 };

  if (items.length === 0) {
    // Profesorka je obrisala sve reči - ukloni set (napredak po card_id ostaje samo istorijski,
    // items pada preko cascade FK-a).
    if (existing) {
      const { error: delItemsErr } = await admin.from("student_wordset_items").delete().eq("wordset_id", existing.id);
      if (delItemsErr) return { error: delItemsErr.message, status: 500 };
      const { error: delSetErr } = await admin.from("student_wordsets").delete().eq("id", existing.id);
      if (delSetErr) return { error: delSetErr.message, status: 500 };
    }
    return null;
  }

  const title = wordsetTitle(position, date);
  let wordsetId: string;
  if (existing) {
    const { error } = await admin
      .from("student_wordsets")
      .update({ title, lesson_date: date, position, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) return { error: error.message, status: 500 };
    wordsetId = existing.id;
  } else {
    const { data: inserted, error } = await admin
      .from("student_wordsets")
      .insert({ note_id: noteId, individual_enrollment_id: enrollmentId, title, lesson_date: date, position })
      .select("id")
      .single();
    if (error || !inserted) return { error: error?.message ?? "Set reči nije mogao da se napravi", status: 500 };
    wordsetId = inserted.id;
  }

  // Puna zamena stavki BEZ prozora u kome polaznik ostane bez ijedne reči: prvo upsert novih
  // (primarni ključ (wordset_id, idx) NIJE parcijalan pa onConflict ovde radi, za razliku od
  // class_notes/student_wordsets), pa tek onda brisanje viška sa starim idx-om koji nove reči
  // više ne pokrivaju. Da je redosled obrnut (prvo delete pa insert), pad insert-a posle
  // uspešnog delete-a bi polazniku obrisao ceo set reči.
  const { error: upsertErr } = await admin
    .from("student_wordset_items")
    .upsert(
      items.map((it) => ({ wordset_id: wordsetId, idx: it.idx, front: it.front, back: it.back })),
      { onConflict: "wordset_id,idx" }
    );
  if (upsertErr) return { error: upsertErr.message, status: 500 };

  const { error: trimErr } = await admin
    .from("student_wordset_items")
    .delete()
    .eq("wordset_id", wordsetId)
    .gte("idx", items.length);
  if (trimErr) return { error: trimErr.message, status: 500 };

  return null;
}

// GET ?enrollmentId=...&date=YYYY-MM-DD - vraća postojeću belešku ili prazan obrazac.
// Ne upisuje ništa: otvaranje beleške ne sme da potroši čas iz paketa.
export async function GET(request: Request) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const parsed = parseParams(searchParams.get("enrollmentId"), searchParams.get("date"));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { id: enrollmentId, date } = parsed;

  const owned = await loadOwnedEnrollment(staff.admin, enrollmentId, staff.userId, staff.isAdmin);
  if ("error" in owned) return NextResponse.json({ error: owned.error }, { status: owned.status });

  const { data: lesson } = await staff.admin
    .from("individual_lessons")
    .select("id")
    .eq("enrollment_id", enrollmentId)
    .eq("lesson_date", date)
    .maybeSingle();

  if (!lesson) {
    return NextResponse.json({ content: emptyNoteContent(), noteId: null, lessonId: null });
  }

  const { data: note } = await staff.admin
    .from("class_notes")
    .select("id, content")
    .eq("individual_lesson_id", lesson.id)
    .maybeSingle();

  if (!note) {
    return NextResponse.json({ content: emptyNoteContent(), noteId: null, lessonId: lesson.id });
  }

  return NextResponse.json({
    content: sanitizeNoteContent(note.content),
    noteId: note.id,
    lessonId: lesson.id,
  });
}

// PUT { enrollmentId, date, content } - snima belešku; čas i set reči se prave/ažuriraju uz nju.
export async function PUT(request: Request) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  let body: { enrollmentId?: unknown; date?: unknown; content?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neispravan JSON" }, { status: 400 });
  }

  const parsed = parseParams(body.enrollmentId, body.date);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { id: enrollmentId, date } = parsed;
  const content = sanitizeNoteContent(body.content);

  const owned = await loadOwnedEnrollment(staff.admin, enrollmentId, staff.userId, staff.isAdmin);
  if ("error" in owned) return NextResponse.json({ error: owned.error }, { status: owned.status });
  const admin = staff.admin;
  // Čas može biti nedodeljen profesorki (professor_id null na starijem upisu) - onda ga preuzima
  // ona koja baš sad snima.
  const professorId = owned.enr.professor_id ?? staff.userId;

  // 1. Čas - nađi ili prvi put upiši (i tek tad prebroji/ažuriraj paket).
  const lessonResult = await findOrCreateLesson(admin, enrollmentId, date, professorId, owned.enr.package_lessons);
  if ("error" in lessonResult) return NextResponse.json({ error: lessonResult.error }, { status: lessonResult.status });
  const { lessonId } = lessonResult;

  // 2. Beleška.
  const contentText = noteToPlainText(content);
  const noteResult = await upsertNote(admin, lessonId, professorId, content, contentText);
  if ("error" in noteResult) return NextResponse.json({ error: noteResult.error }, { status: noteResult.status });
  const { noteId } = noteResult;

  // 3. Set reči - position = redni broj ovog termina među SVIM časovima ovog upisa do danas
  // (uključujući baš ovaj, sad kad sigurno postoji). Ako profesorka naknadno unosi belešku za
  // datum iz prošlosti, ovaj račun je ispravan ZA OVAJ set (broji po datumu, ne po redosledu
  // unosa) - ali pozicije već sačuvanih kasnijih termina se retroaktivno ne pomeraju, pa mogu
  // ostati "za jedan nazad" u odnosu na pravi hronološki niz. Prihvatljivo: position je samo
  // kozmetički broj u naslovu seta ("Termin N - reči"), ne utiče na sadržaj ni napredak.
  const items = deriveWordsetItems(content.wortschatz);
  const { count: positionCount } = await admin
    .from("individual_lessons")
    .select("*", { count: "exact", head: true })
    .eq("enrollment_id", enrollmentId)
    .lte("lesson_date", date);
  const position = positionCount ?? 1;

  const wordsetError = await replaceWordset(admin, noteId, enrollmentId, date, position, items);
  if (wordsetError) return NextResponse.json({ error: wordsetError.error }, { status: wordsetError.status });

  return NextResponse.json({ ok: true, noteId, lessonId, words: items.length });
}
