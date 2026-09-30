/**
 * Čitanje beleški i ličnih setova reči za POLAZNIKA - direktno preko createAdminClient()
 * uz ručno filtriranje po userId (isti obrazac kao src/app/api/student/account/route.ts).
 *
 * Serverska komponenta NE zove sopstveni API preko fetch - stranice (/beleske, /beleske/[id],
 * /moje-reci) pozivaju ove funkcije direktno. Nikakva /api/student/beleske ruta ne postoji.
 *
 * Vlasništvo: polaznik sme da vidi SAMO svoju belešku/set. Provera ide preko lanca
 * class_notes -> individual_lessons -> individual_enrollments.user_id (ili direktno
 * student_wordsets.individual_enrollment_id -> user_id), NE preko isteka pristupa -
 * beleška ostaje dostupna i posle isteka kursa (vidi 109_class_notes.sql).
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeNoteContent, notePreview, type NoteContent } from "@/lib/class-notes";
import { wordsetSetKey } from "@/lib/wordset-derive";
import type { FlashcardItem } from "@/lib/flashcard-types";

type Admin = ReturnType<typeof createAdminClient>;

function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

export interface StudentNoteListItem {
  id: string;
  lessonDate: string; // YYYY-MM-DD
  professorName: string | null;
  preview: string | null; // null = TEMA nije popunjena, prikaz ima svoju rezervnu formulaciju
  hasWords: boolean;
}

export interface StudentNoteDetail {
  id: string;
  lessonDate: string;
  professorName: string | null;
  content: NoteContent;
  wordsetId: string | null;
}

export interface StudentWordset {
  id: string;
  title: string;
  lessonDate: string;
  setKey: string;
  items: FlashcardItem[];
}

/** Svi id-jevi individualnih upisa ovog polaznika - osnova svake provere vlasništva ispod. */
async function ownedEnrollmentIds(admin: Admin, userId: string): Promise<string[]> {
  const { data } = await admin.from("individual_enrollments").select("id").eq("user_id", userId);
  return (data ?? []).map((r) => r.id as string);
}

/**
 * Lista beleški polaznika, najnovija prva, preko SVIH njegovih upisa (npr. završen A2 paket
 * pa kupljen B1 - obe grupe časova ulaze u istu listu i sortiraju se zajedno po datumu).
 */
export async function listStudentNotes(userId: string): Promise<StudentNoteListItem[]> {
  const admin = createAdminClient();

  const enrollIds = await ownedEnrollmentIds(admin, userId);
  if (enrollIds.length === 0) return [];

  const { data: lessonRows } = await admin
    .from("individual_lessons")
    .select("id, lesson_date")
    .in("enrollment_id", enrollIds);
  const lessonIds = (lessonRows ?? []).map((r) => r.id as string);
  if (lessonIds.length === 0) return [];
  const lessonDateById = new Map(lessonRows!.map((r) => [r.id as string, r.lesson_date as string]));

  const { data: noteRows } = await admin
    .from("class_notes")
    .select("id, individual_lesson_id, content, professor:professor_id(full_name)")
    .in("individual_lesson_id", lessonIds);

  const noteIds = (noteRows ?? []).map((r) => r.id as string);
  const wordsetNoteIds = new Set<string>();
  if (noteIds.length > 0) {
    const { data: wordsetRows } = await admin
      .from("student_wordsets")
      .select("note_id")
      .in("note_id", noteIds);
    for (const w of wordsetRows ?? []) {
      if (w.note_id) wordsetNoteIds.add(w.note_id as string);
    }
  }

  const items: StudentNoteListItem[] = (noteRows ?? []).map((n) => {
    const content = sanitizeNoteContent(n.content);
    const prof = one<{ full_name: string | null }>(n.professor as never);
    return {
      id: n.id as string,
      lessonDate: lessonDateById.get(n.individual_lesson_id as string) ?? "",
      professorName: prof?.full_name ?? null,
      preview: notePreview(content),
      hasWords: wordsetNoteIds.has(n.id as string),
    };
  });

  items.sort((a, b) => b.lessonDate.localeCompare(a.lessonDate));
  return items;
}

/**
 * Jedna beleška - ili null ako ne postoji, nije individualna (grupne beleške su van obima
 * ove kriške), ili ne pripada ovom polazniku. `notFound()` u stranici zavisi od ovog null-a,
 * pa provera vlasništva MORA biti stvarna (enrollment.user_id === userId), ne kozmetička.
 */
export async function getStudentNote(userId: string, noteId: string): Promise<StudentNoteDetail | null> {
  const admin = createAdminClient();

  const { data: note } = await admin
    .from("class_notes")
    .select("id, individual_lesson_id, content, professor:professor_id(full_name)")
    .eq("id", noteId)
    .maybeSingle();
  if (!note || !note.individual_lesson_id) return null;

  const { data: lesson } = await admin
    .from("individual_lessons")
    .select("id, lesson_date, enrollment_id")
    .eq("id", note.individual_lesson_id)
    .maybeSingle();
  if (!lesson) return null;

  const { data: enrollment } = await admin
    .from("individual_enrollments")
    .select("id, user_id")
    .eq("id", lesson.enrollment_id)
    .maybeSingle();
  if (!enrollment || enrollment.user_id !== userId) return null;

  const { data: wordset } = await admin
    .from("student_wordsets")
    .select("id")
    .eq("note_id", note.id)
    .maybeSingle();

  const prof = one<{ full_name: string | null }>(note.professor as never);
  return {
    id: note.id as string,
    lessonDate: lesson.lesson_date as string,
    professorName: prof?.full_name ?? null,
    content: sanitizeNoteContent(note.content),
    wordsetId: wordset?.id ?? null,
  };
}

const WORDSET_ITEMS_PAGE = 1000;

/**
 * Svi lični setovi reči polaznika, sa stavkama - najnoviji prvi.
 *
 * Setovi bez beleške (note_id je null jer je beleška obrisana posle 6 meseci - vidi
 * 109_class_notes.sql, ON DELETE SET NULL) i dalje ulaze u listu: upit ide preko
 * individual_enrollment_id, ne preko note_id, jer je to cela svrha "preživljavanja" seta.
 *
 * Stavke se čitaju paginirano sa .range() - Supabase PostgREST tiho seče svaki upit na 1000
 * redova (db-max-rows, bez greške, .limit() ne pomaže - vidi reference_supabase_max_rows_1000).
 * Polaznik sa dugom istorijom (više paketa kroz godine, svaki čas ~10-30 reči) realno može
 * preći 1000 stavki, pa jedna .in() strana ne bi bila dovoljna.
 */
export async function listStudentWordsets(userId: string): Promise<StudentWordset[]> {
  const admin = createAdminClient();

  const enrollIds = await ownedEnrollmentIds(admin, userId);
  if (enrollIds.length === 0) return [];

  const { data: setRows } = await admin
    .from("student_wordsets")
    .select("id, title, lesson_date")
    .in("individual_enrollment_id", enrollIds)
    .order("lesson_date", { ascending: false });
  const setIds = (setRows ?? []).map((r) => r.id as string);
  if (setIds.length === 0) return [];

  type ItemRow = { wordset_id: string; idx: number; front: string; back: string };
  const rawItems: ItemRow[] = [];
  for (let from = 0; ; from += WORDSET_ITEMS_PAGE) {
    const { data: page, error } = await admin
      .from("student_wordset_items")
      .select("wordset_id, idx, front, back")
      .in("wordset_id", setIds)
      .order("wordset_id", { ascending: true })
      .order("idx", { ascending: true })
      .range(from, from + WORDSET_ITEMS_PAGE - 1);
    if (error) {
      console.error("[beleske-student] čitanje reči palo:", error.message);
      break;
    }
    if (!page || page.length === 0) break;
    rawItems.push(...(page as ItemRow[]));
    if (page.length < WORDSET_ITEMS_PAGE) break;
  }

  const itemsBySet = new Map<string, FlashcardItem[]>();
  for (const it of rawItems) {
    const arr = itemsBySet.get(it.wordset_id) ?? [];
    arr.push({ front: it.front, back: it.back });
    itemsBySet.set(it.wordset_id, arr);
  }

  return (setRows ?? [])
    .map((s) => ({
      id: s.id as string,
      title: s.title as string,
      lessonDate: s.lesson_date as string,
      setKey: wordsetSetKey(s.id as string),
      items: itemsBySet.get(s.id as string) ?? [],
    }))
    .filter((s) => s.items.length > 0); // odbrambeno: pravilo je da prazan set ne postoji kao red
}
