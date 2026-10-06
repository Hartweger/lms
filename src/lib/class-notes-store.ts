/**
 * Upis beleške i njenog seta reči - zajedničko za 1:1 (individual_lesson_id / individual_enrollment_id)
 * i grupu (group_session_id / group_id). Premešteno iz api/profesor/class-notes/route.ts bez izmene
 * ponašanja; komentari o zamkama su sačuvani tamo gde su važni.
 */
import type { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import type { NoteContent } from "@/lib/class-notes";
import { wordsetTitle, type WordsetItem } from "@/lib/wordset-derive";

type Admin = ReturnType<typeof createAdminClient>;
export type Failure = { error: string; status: number; code?: string };

/** Za šta je beleška vezana. */
export type NoteTarget =
  | { column: "individual_lesson_id"; id: string }
  | { column: "group_session_id"; id: string };

/** Čiji je set reči. */
export type WordsetOwner =
  | { individual_enrollment_id: string }
  | { group_id: string };

// Kolona cilja kao objekat - po grani, da insert ostane tipiziran (bez computed key-a i cast-a).
function targetColumns(target: NoteTarget) {
  return target.column === "individual_lesson_id"
    ? { individual_lesson_id: target.id }
    : { group_session_id: target.id };
}

// Beleška: select pa update/insert - upsert sa onConflict NE RADI jer su class_notes_*_uq
// parcijalni indeksi (where <kolona> is not null).
export async function upsertNote(
  admin: Admin,
  target: NoteTarget,
  professorId: string,
  content: NoteContent,
  contentText: string
): Promise<{ noteId: string } | Failure> {
  const findExisting = () =>
    admin.from("class_notes").select("id").eq(target.column, target.id).maybeSingle();
  const updateById = (id: string) =>
    admin
      .from("class_notes")
      .update({ content: content as unknown as Json, content_text: contentText, updated_at: new Date().toISOString() })
      .eq("id", id);

  const { data: existing, error: selectError } = await findExisting();
  if (selectError) return { error: selectError.message, status: 500 };

  if (existing) {
    const { error } = await updateById(existing.id);
    if (error) return { error: error.message, status: 500 };
    return { noteId: existing.id };
  }

  const { data: inserted, error } = await admin
    .from("class_notes")
    .insert({
      ...targetColumns(target),
      professor_id: professorId,
      content: content as unknown as Json,
      content_text: contentText,
    })
    .select("id")
    .single();
  if (!error && inserted) return { noteId: inserted.id };

  // Trka: dva istovremena PUT-a za isti čas oba prođu select (ništa nađeno), pa oba pokušaju insert -
  // jedinstveni indeks obori drugi kodom 23505 umesto da ga pusti. Umesto 500, preuzmi belešku koju
  // je konkurentski zahtev upravo napravio i ažuriraj nju (poslednje snimanje važi) - tako se za
  // isti čas nikad ne stvore dve beleške.
  if (error?.code === "23505") {
    const { data: raced } = await findExisting();
    if (raced) {
      const { error: updateError } = await updateById(raced.id);
      if (updateError) return { error: updateError.message, status: 500 };
      return { noteId: raced.id };
    }
  }
  return { error: error?.message ?? "Beleška nije mogla da se snimi", status: 500 };
}

// Set reči izveden iz WORTSCHATZ: puna zamena stavki, ili brisanje seta ako je reči nestalo.
export async function replaceWordset(
  admin: Admin,
  noteId: string,
  owner: WordsetOwner,
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
      .insert({ note_id: noteId, ...owner, title, lesson_date: date, position })
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
