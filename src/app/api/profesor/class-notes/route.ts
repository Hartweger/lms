import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeLessonStatus } from "@/lib/individual-lessons";
import { emptyNoteContent, noteToPlainText, sanitizeNoteContent } from "@/lib/class-notes";
import { deriveWordsetItems } from "@/lib/wordset-derive";
import { replaceWordset, upsertNote, type Failure } from "@/lib/class-notes-store";

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
    .select("id, professor_id, package_lessons, status")
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

// sanitizeNoteContent je sada u @/lib/class-notes - deljeno sa polaznikovim čitanjem
// (src/lib/beleske-student.ts), da se upis i čitanje ne raziđu u tumačenju zapisa.

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

// Nalazi red časa za enrollment+datum. ZATEČENO STANJE: 16 postojećih parova
// (enrollment_id, lesson_date) na živoj bazi imaju VIŠE OD JEDNOG časa istog dana (do tri - uglavnom
// stari dvostruki klikovi) - unique(enrollment_id, lesson_date) bi zato pri primeni pukao i model bi
// bio pogrešan, pa ga namerno NE dodajemo. Isto tako .maybeSingle() na takvom paru puca (PostgREST
// vrati grešku kad ima >1 red, ne prvi). Zato se determinisano vezujemo za NAJSTARIJI red
// (order po created_at + limit 1) - isti izbor u GET i PUT, da beleška uvek ide na isti čas.
async function findLessonRow(
  admin: ReturnType<typeof createAdminClient>,
  enrollmentId: string,
  date: string
): Promise<{ lesson: { id: string } | null } | Failure> {
  const { data, error } = await admin
    .from("individual_lessons")
    .select("id")
    .eq("enrollment_id", enrollmentId)
    .eq("lesson_date", date)
    .order("created_at", { ascending: true })
    .limit(1);
  if (error) return { error: error.message, status: 500 };
  return { lesson: data?.[0] ?? null };
}

// Ista granica kao POST u api/profesor/individualni-cas/route.ts: paket arhiviran ILI već popunjen
// (broj redova u individual_lessons >= package_lessons) - ne sme novi čas. Namerno preuzeto da se
// dva mesta ne razilaze.
async function canCreateLesson(
  admin: ReturnType<typeof createAdminClient>,
  enrollmentId: string,
  status: string,
  packageLessons: number
): Promise<boolean> {
  if (status === "completed") return false;
  const { count } = await admin.from("individual_lessons").select("*", { count: "exact", head: true }).eq("enrollment_id", enrollmentId);
  return (count ?? 0) < packageLessons;
}

// Nađi postojeći čas za enrollment+datum, ili ga prvi put upiši (samo ovde se čas STVARNO beleži -
// GET nikad ne piše). Ako datum još nema svoj čas, a paket je pun/arhiviran, čas se NE kreira i
// beleška se ne snima (nema na šta da se veže) - profesorka dobija 409 sa code "paket_pun".
// select-pa-insert sužava prozor za trku (dve kartice profesorke istovremeno), ali ga ne zatvara -
// zaključavanje je namerno ostavljeno za kasnije (videti napomenu u izveštaju).
async function findOrCreateLesson(
  admin: ReturnType<typeof createAdminClient>,
  enrollmentId: string,
  date: string,
  professorId: string,
  status: string,
  packageLessons: number
): Promise<{ lessonId: string } | Failure> {
  const found = await findLessonRow(admin, enrollmentId, date);
  if ("error" in found) return found;
  if (found.lesson) return { lessonId: found.lesson.id };

  if (!(await canCreateLesson(admin, enrollmentId, status, packageLessons))) {
    return {
      error: "Paket je iskorišćen - čas nije upisan. Dodaj čas u panelu ili otvori nov paket.",
      status: 409,
      code: "paket_pun",
    };
  }

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

  const found = await findLessonRow(staff.admin, enrollmentId, date);
  if ("error" in found) return NextResponse.json({ error: found.error }, { status: found.status });

  if (!found.lesson) {
    // Čas za taj datum još ne postoji - javi i da li bi uopšte smeo da se napravi, da editor u
    // sledećem zadatku može da upozori profesorku PRE nego što otkuca ceo čas.
    const canCreate = await canCreateLesson(staff.admin, enrollmentId, owned.enr.status, owned.enr.package_lessons);
    return NextResponse.json({ content: emptyNoteContent(), noteId: null, lessonId: null, canCreate });
  }
  const lesson = found.lesson;

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

  // 1. Čas - nađi ili prvi put upiši (i tek tad prebroji/ažuriraj paket). Ako paket ne postoji za
  // ovaj datum i ne sme da se napravi (pun/arhiviran), stajemo OVDE - beleška se ne snima, jer
  // nema na koji čas da se veže.
  const lessonResult = await findOrCreateLesson(admin, enrollmentId, date, professorId, owned.enr.status, owned.enr.package_lessons);
  if ("error" in lessonResult) {
    const payload: { error: string; code?: string } = { error: lessonResult.error };
    if (lessonResult.code) payload.code = lessonResult.code;
    return NextResponse.json(payload, { status: lessonResult.status });
  }
  const { lessonId } = lessonResult;

  // 2. Beleška.
  const contentText = noteToPlainText(content);
  const noteResult = await upsertNote(admin, { column: "individual_lesson_id", id: lessonId }, professorId, content, contentText);
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

  const wordsetError = await replaceWordset(admin, noteId, { individual_enrollment_id: enrollmentId }, date, position, items);
  if (wordsetError) return NextResponse.json({ error: wordsetError.error }, { status: wordsetError.status });

  return NextResponse.json({ ok: true, noteId, lessonId, words: items.length });
}
