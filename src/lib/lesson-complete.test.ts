import { describe, it, expect } from "vitest";
import { examLessonFullyDone, markLessonCompleted } from "./lesson-complete";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Minimalni lažni Supabase klijent: tabele u memoriji, podržava
 * select/eq/in/maybeSingle/upsert onako kako ih lesson-complete koristi.
 */
function fakeSupabase(tables: Record<string, Record<string, unknown>[]>) {
  const upserts: Record<string, unknown>[] = [];
  const from = (table: string) => {
    const filters: ((r: Record<string, unknown>) => boolean)[] = [];
    const rows = () => (tables[table] ?? []).filter((r) => filters.every((f) => f(r)));
    const builder = {
      select: () => builder,
      eq: (col: string, val: unknown) => { filters.push((r) => r[col] === val); return builder; },
      in: (col: string, vals: unknown[]) => { filters.push((r) => vals.includes(r[col])); return builder; },
      maybeSingle: async () => ({ data: rows()[0] ?? null, error: null }),
      upsert: async (row: Record<string, unknown>) => { upserts.push(row); return { error: null }; },
      then: (resolve: (v: { data: Record<string, unknown>[]; error: null }) => void) =>
        resolve({ data: rows(), error: null }),
    };
    return builder;
  };
  return { client: { from } as unknown as SupabaseClient, upserts };
}

describe("examLessonFullyDone", () => {
  it("tačno samo kad SVAKA vežba ispita ima pokušaj ili predat esej", () => {
    expect(examLessonFullyDone(["lesen", "hoeren", "schreiben"], new Set(["lesen", "hoeren", "schreiben"]))).toBe(true);
    expect(examLessonFullyDone(["lesen", "hoeren", "schreiben"], new Set(["schreiben"]))).toBe(false);
    expect(examLessonFullyDone(["lesen", "hoeren"], new Set(["lesen", "hoeren", "nesto-drugo"]))).toBe(true);
  });

  it("ispit bez vežbi se ne može zatvoriti kroz vežbu", () => {
    expect(examLessonFullyDone([], new Set())).toBe(false);
  });
});

describe("markLessonCompleted", () => {
  const user = "u1";

  it("obična lekcija: označi se posle bilo koje vežbe", async () => {
    const { client, upserts } = fakeSupabase({
      lessons: [{ id: "l1", title: "Als ob - Konjunktiv II" }],
      exercises: [{ id: "e1", lesson_id: "l1" }, { id: "e2", lesson_id: "l1" }],
      exercise_attempts: [{ user_id: user, exercise_id: "e1" }],
      essay_submissions: [],
      lesson_progress: [],
    });
    expect(await markLessonCompleted(client, user, "l1")).toBe(true);
    expect(upserts).toHaveLength(1);
    expect(upserts[0]).toMatchObject({ user_id: user, lesson_id: "l1", completed: true });
  });

  it("završni ispit: NE označava se dok nisu urađeni svi delovi (Eminin slučaj)", async () => {
    // 3 eseja predata, Lesen i Hören bez pokušaja → lekcija ostaje otvorena.
    const { client, upserts } = fakeSupabase({
      lessons: [{ id: "ispit", title: "Završni ispit B1 - Modelltest 4" }],
      exercises: [
        { id: "lesen", lesson_id: "ispit" }, { id: "hoeren", lesson_id: "ispit" },
        { id: "s1", lesson_id: "ispit" }, { id: "s2", lesson_id: "ispit" }, { id: "s3", lesson_id: "ispit" },
      ],
      exercise_attempts: [{ user_id: user, exercise_id: "s1" }, { user_id: user, exercise_id: "s2" }, { user_id: user, exercise_id: "s3" }],
      essay_submissions: [{ user_id: user, exercise_id: "s1" }, { user_id: user, exercise_id: "s2" }, { user_id: user, exercise_id: "s3" }],
      lesson_progress: [],
    });
    expect(await markLessonCompleted(client, user, "ispit")).toBe(false);
    expect(upserts).toHaveLength(0);
  });

  it("završni ispit: označi se kad i poslednji deo dobije pokušaj (esej se računa i preko predaje)", async () => {
    const { client, upserts } = fakeSupabase({
      lessons: [{ id: "ispit", title: "Modelltest A1.1" }],
      exercises: [{ id: "lesen", lesson_id: "ispit" }, { id: "schreiben", lesson_id: "ispit" }],
      exercise_attempts: [{ user_id: user, exercise_id: "lesen" }],
      essay_submissions: [{ user_id: user, exercise_id: "schreiben" }],
      lesson_progress: [],
    });
    expect(await markLessonCompleted(client, user, "ispit")).toBe(true);
    expect(upserts).toHaveLength(1);
  });

  it("gleda samo pokušaje TOG polaznika", async () => {
    const { client, upserts } = fakeSupabase({
      lessons: [{ id: "ispit", title: "Modelltest A2.1" }],
      exercises: [{ id: "lesen", lesson_id: "ispit" }, { id: "hoeren", lesson_id: "ispit" }],
      exercise_attempts: [{ user_id: user, exercise_id: "lesen" }, { user_id: "neko-drugi", exercise_id: "hoeren" }],
      essay_submissions: [],
      lesson_progress: [],
    });
    expect(await markLessonCompleted(client, user, "ispit")).toBe(false);
    expect(upserts).toHaveLength(0);
  });

  it("već završenu lekciju ne prepisuje", async () => {
    const { client, upserts } = fakeSupabase({
      lessons: [{ id: "l1", title: "Bilo šta" }],
      lesson_progress: [{ user_id: user, lesson_id: "l1", completed: true }],
    });
    expect(await markLessonCompleted(client, user, "l1")).toBe(true);
    expect(upserts).toHaveLength(0);
  });
});
