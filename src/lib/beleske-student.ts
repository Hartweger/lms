/**
 * Čitanje beleški i ličnih setova reči za POLAZNIKA - direktno preko createAdminClient()
 * uz ručno filtriranje po userId (isti obrazac kao src/app/api/student/account/route.ts).
 *
 * Serverska komponenta NE zove sopstveni API preko fetch - stranice (/beleske, /beleske/[id],
 * /moje-reci) pozivaju ove funkcije direktno. Nikakva /api/student/beleske ruta ne postoji.
 *
 * Vlasništvo: polaznik sme da vidi SAMO svoju belešku/set. Individualno: lanac
 * class_notes -> individual_lessons -> individual_enrollments.user_id (ili direktno
 * student_wordsets.individual_enrollment_id -> user_id). Grupno: class_notes -> group_sessions
 * -> group_enrollments (AKTIVAN upis tog polaznika u grupu; set reči preko student_wordsets.group_id).
 * Individualno NE gleda istek pristupa - beleška ostaje dostupna i posle isteka kursa
 * (vidi 109_class_notes.sql); grupno važi dok je upis aktivan (storno/izbacivanje gasi pristup).
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

/** Grupe u kojima polaznik ima AKTIVAN upis (storno i izbacivanje su 'cancelled'). */
async function ownedGroupIds(admin: Admin, userId: string): Promise<string[]> {
  const { data } = await admin.from("group_enrollments").select("group_id").eq("user_id", userId).eq("status", "active");
  return (data ?? []).map((r) => r.group_id as string);
}

/** Beleške sa individualnih časova, preko SVIH individualnih upisa polaznika. */
async function listIndividualNotes(admin: Admin, userId: string): Promise<StudentNoteListItem[]> {
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

  return (noteRows ?? []).map((n) => {
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
}

/** Beleške sa časova grupa u kojima polaznik ima aktivan upis. */
async function listGroupNotes(admin: Admin, userId: string): Promise<StudentNoteListItem[]> {
  const groupIds = await ownedGroupIds(admin, userId);
  if (groupIds.length === 0) return [];
  const { data: sessionRows } = await admin
    .from("group_sessions").select("id, session_date").in("group_id", groupIds);
  const sessionIds = (sessionRows ?? []).map((r) => r.id as string);
  if (sessionIds.length === 0) return [];
  const dateById = new Map(sessionRows!.map((r) => [r.id as string, r.session_date as string]));

  const { data: noteRows } = await admin
    .from("class_notes")
    .select("id, group_session_id, content, professor:professor_id(full_name)")
    .in("group_session_id", sessionIds);
  const noteIds = (noteRows ?? []).map((r) => r.id as string);
  const withWords = new Set<string>();
  if (noteIds.length) {
    const { data: ws } = await admin.from("student_wordsets").select("note_id").in("note_id", noteIds);
    for (const w of ws ?? []) if (w.note_id) withWords.add(w.note_id as string);
  }
  return (noteRows ?? []).map((n) => {
    const content = sanitizeNoteContent(n.content);
    const prof = one<{ full_name: string | null }>(n.professor as never);
    return {
      id: n.id as string,
      lessonDate: dateById.get(n.group_session_id as string) ?? "",
      professorName: prof?.full_name ?? null,
      preview: notePreview(content),
      hasWords: withWords.has(n.id as string),
    };
  });
}

/**
 * Lista beleški polaznika, najnovija prva - individualne (preko SVIH upisa, npr. završen A2
 * paket pa kupljen B1) i grupne (aktivni upisi u grupe), sortirane zajedno po datumu.
 */
export async function listStudentNotes(userId: string): Promise<StudentNoteListItem[]> {
  const admin = createAdminClient();
  const [ind, grp] = await Promise.all([listIndividualNotes(admin, userId), listGroupNotes(admin, userId)]);
  return [...ind, ...grp].sort((a, b) => b.lessonDate.localeCompare(a.lessonDate));
}

/**
 * Jedna beleška - ili null ako ne postoji ili ne pripada ovom polazniku. Individualna:
 * enrollment.user_id === userId. Grupna: polaznik ima AKTIVAN upis u grupu te sesije.
 * `notFound()` u stranici zavisi od ovog null-a, pa provera vlasništva MORA biti stvarna.
 */
export async function getStudentNote(userId: string, noteId: string): Promise<StudentNoteDetail | null> {
  const admin = createAdminClient();

  const { data: note } = await admin
    .from("class_notes")
    .select("id, individual_lesson_id, group_session_id, content, professor:professor_id(full_name)")
    .eq("id", noteId)
    .maybeSingle();
  if (!note) return null;

  let lessonDate: string;
  if (note.individual_lesson_id) {
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
    lessonDate = lesson.lesson_date as string;
  } else if (note.group_session_id) {
    const { data: session } = await admin
      .from("group_sessions").select("session_date, group_id").eq("id", note.group_session_id).maybeSingle();
    if (!session) return null;
    const groupIds = await ownedGroupIds(admin, userId);
    if (!groupIds.includes(session.group_id as string)) return null; // nije njegova grupa -> 404
    lessonDate = session.session_date as string;
  } else {
    return null;
  }

  const { data: wordset } = await admin
    .from("student_wordsets")
    .select("id")
    .eq("note_id", note.id)
    .maybeSingle();

  const prof = one<{ full_name: string | null }>(note.professor as never);
  return {
    id: note.id as string,
    lessonDate,
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
 * individual_enrollment_id / group_id, ne preko note_id, jer je to cela svrha "preživljavanja" seta.
 *
 * Stavke se čitaju paginirano sa .range() - Supabase PostgREST tiho seče svaki upit na 1000
 * redova (db-max-rows, bez greške, .limit() ne pomaže - vidi reference_supabase_max_rows_1000).
 * Polaznik sa dugom istorijom (više paketa kroz godine, svaki čas ~10-30 reči) realno može
 * preći 1000 stavki, pa jedna .in() strana ne bi bila dovoljna.
 */
export async function listStudentWordsets(userId: string): Promise<StudentWordset[]> {
  const admin = createAdminClient();

  const [enrollIds, groupIds] = await Promise.all([ownedEnrollmentIds(admin, userId), ownedGroupIds(admin, userId)]);
  if (enrollIds.length === 0 && groupIds.length === 0) return [];
  // uuid-ovi dolaze iz baze, pa su bezbedni za .or() filter.
  const ors = [
    enrollIds.length ? `individual_enrollment_id.in.(${enrollIds.join(",")})` : null,
    groupIds.length ? `group_id.in.(${groupIds.join(",")})` : null,
  ].filter(Boolean).join(",");
  const { data: setRows } = await admin
    .from("student_wordsets")
    .select("id, title, lesson_date")
    .or(ors)
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
