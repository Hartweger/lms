import { createClient } from "@/lib/supabase/client";
import { cardId } from "./flashcard-card-id";
import type { FlashcardItem } from "./flashcard-types";

export type CardStatus = "new" | "learning" | "mastered";
export interface CardProgress { card_id: string; correct_count: number; wrong_count: number; status: CardStatus; }

/** Učitaj napredak za ceo set (jedan upit). Mapa card_id → progress. */
export async function loadSetProgress(setKey: string): Promise<Map<string, CardProgress>> {
  const sb = createClient();
  const { data } = await sb.from("flashcard_progress")
    .select("card_id,correct_count,wrong_count,status").eq("set_key", setKey);
  const map = new Map<string, CardProgress>();
  for (const r of data ?? []) map.set(r.card_id, r as CardProgress);
  return map;
}

/**
 * Zabeleži pokušaj i vrati novi status.
 * Pravilo: mastered = 2 tačna; "bar jedan kucanjem" sprovodi LearnModule (vidi Context).
 * `viaTyping` je intentionally unused ovde — orchestrator (LearnModule) primenjuje to pravilo;
 * param ostaje u potpisu da kasniji caller ne mora menjati poziv.
 */
export async function recordAttempt(
  setKey: string,
  card: FlashcardItem,
  correct: boolean,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  viaTyping: boolean,
  prev: CardProgress | undefined,
): Promise<CardProgress> {
  const sb = createClient();
  const { data: auth } = await sb.auth.getUser();
  const uid = auth.user?.id;
  const id = cardId(setKey, card.front, card.back);
  const correct_count = (prev?.correct_count ?? 0) + (correct ? 1 : 0);
  const wrong_count = (prev?.wrong_count ?? 0) + (correct ? 0 : 1);
  let status: CardStatus = "learning";
  if (correct_count >= 2) status = "mastered";
  if (!correct) status = "learning";
  const row = {
    user_id: uid,
    card_id: id,
    set_key: setKey,
    correct_count,
    wrong_count,
    status,
    last_seen_at: new Date().toISOString(),
  };
  await sb.from("flashcard_progress").upsert(row, { onConflict: "user_id,card_id" });
  return { card_id: id, correct_count, wrong_count, status };
}
