import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { markLessonCompleted } from "./lesson-complete";

type Row = { user_id: string; lesson_id: string; completed: boolean; completed_at: string };

/** Mini imitacija supabase klijenta nad tabelom lesson_progress. */
function fakeClient(rows: Row[], opts: { upsertError?: boolean } = {}) {
  const upserts: Row[] = [];
  const builder = (current: Row[]) => ({
    select: () => builder(current),
    eq: (col: keyof Row, val: unknown) => builder(current.filter((r) => r[col] === val)),
    maybeSingle: () => Promise.resolve({ data: current[0] ?? null, error: null }),
  });
  const client = {
    from: () => ({
      ...builder(rows),
      upsert: (row: Row) => {
        if (!opts.upsertError) upserts.push(row);
        return Promise.resolve({ error: opts.upsertError ? { message: "boom" } : null });
      },
    }),
  } as unknown as SupabaseClient;
  return { client, upserts };
}

const U = "user-1";
const L = "lesson-1";

describe("markLessonCompleted", () => {
  it("upisuje završetak kad reda nema", async () => {
    const { client, upserts } = fakeClient([]);
    expect(await markLessonCompleted(client, U, L)).toBe(true);
    expect(upserts).toHaveLength(1);
    expect(upserts[0]).toMatchObject({ user_id: U, lesson_id: L, completed: true });
  });

  it("ne dira već završenu lekciju - datum završetka ostaje originalan", async () => {
    const { client, upserts } = fakeClient([
      { user_id: U, lesson_id: L, completed: true, completed_at: "2026-06-23T17:36:00Z" },
    ]);
    expect(await markLessonCompleted(client, U, L)).toBe(true);
    expect(upserts).toHaveLength(0);
  });

  it("dopunjuje red koji postoji ali nije završen", async () => {
    const { client, upserts } = fakeClient([
      { user_id: U, lesson_id: L, completed: false, completed_at: "" },
    ]);
    expect(await markLessonCompleted(client, U, L)).toBe(true);
    expect(upserts).toHaveLength(1);
  });

  it("bez lessonId ne radi ništa", async () => {
    const { client, upserts } = fakeClient([]);
    expect(await markLessonCompleted(client, U, null)).toBe(false);
    expect(upserts).toHaveLength(0);
  });

  it("vraća false kad upis padne - napredak vežbe je već sačuvan, dugme u lekciji ostaje", async () => {
    const { client } = fakeClient([], { upsertError: true });
    expect(await markLessonCompleted(client, U, L)).toBe(false);
  });
});
