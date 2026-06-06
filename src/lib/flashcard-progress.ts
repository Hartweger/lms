import { createClient } from "@/lib/supabase/client";
import { cardId } from "./flashcard-card-id";
import type { FlashcardItem } from "./flashcard-types";

export type CardStatus = "new" | "learning" | "mastered";
export interface CardProgress { card_id: string; correct_count: number; wrong_count: number; status: CardStatus; }

/** Učitaj napredak za ceo set (jedan upit). Mapa card_id → progress. */
export async function loadSetProgress(setKey: string): Promise<Map<string, CardProgress>> {
  const sb = createClient();
  const { data, error } = await sb.from("flashcard_progress")
    .select("card_id,correct_count,wrong_count,status").eq("set_key", setKey);
  if (error) console.error("[flashcard] čitanje napretka palo:", error.message);
  const map = new Map<string, CardProgress>();
  for (const r of data ?? []) map.set(r.card_id, r as CardProgress);
  return map;
}

/**
 * Zabeleži pokušaj i vrati novi status (autoritativno — vraćeni status == upisani status).
 * Pravilo: mastered = 2 tačna. U vođenom režimu je 2. tačan UVEK kucanjem (prisećanje),
 * pa je „bar jedan kucanjem" iz spec-a ispunjeno strukturno; samostalni „samo kviz" drill
 * je svesno prepoznavanje-bazirano.
 */
export async function recordAttempt(
  setKey: string,
  card: FlashcardItem,
  correct: boolean,
  prev: CardProgress | undefined,
): Promise<CardProgress> {
  const sb = createClient();
  const { data: auth } = await sb.auth.getUser();
  const uid = auth.user?.id;
  const id = cardId(setKey, card.front, card.back);
  const correct_count = (prev?.correct_count ?? 0) + (correct ? 1 : 0);
  const wrong_count = (prev?.wrong_count ?? 0) + (correct ? 0 : 1);
  const status: CardStatus = !correct ? "learning" : correct_count >= 2 ? "mastered" : "learning";
  const result: CardProgress = { card_id: id, correct_count, wrong_count, status };
  if (!uid) { console.warn("[flashcard] nema prijavljenog korisnika — napredak se ne čuva"); return result; }
  const { error } = await sb.from("flashcard_progress").upsert(
    { user_id: uid, card_id: id, set_key: setKey, correct_count, wrong_count, status, last_seen_at: new Date().toISOString() },
    { onConflict: "user_id,card_id" });
  if (error) console.error("[flashcard] upis napretka pao:", error.message);
  return result;
}
