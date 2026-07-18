// src/app/api/hearts/award/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyAward, type Progress, type AwardInput } from "@/lib/hearts/award";

export const runtime = "nodejs";

function todayISO(): string {
  // Lokalni dan u Beogradu (stabilno preko DST-a).
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Belgrade" }).format(new Date());
}

const DEFAULT_PROGRESS: Progress = {
  total_hearts: 0, level: 1, current_streak: 0, longest_streak: 0,
  last_active_date: null, hearts_today: 0,
};

/** Validira telo i vraća tipiziran AwardInput ili null ako je nevalidno. */
function parseInput(body: unknown): AwardInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  switch (b.reason) {
    case "lesson_complete":
    case "daily_login":
    case "millionaire_win":
      return { reason: b.reason };
    case "test_pass": {
      const percent = b.percent;
      if (typeof percent !== "number" || !Number.isFinite(percent) || percent < 0 || percent > 100) return null;
      return { reason: "test_pass", percent };
    }
    case "exercise": {
      const correct = b.correct;
      if (typeof correct !== "number" || !Number.isInteger(correct) || correct < 0 || correct > 1000) return null;
      return { reason: "exercise", correct, hadStreak: Boolean(b.hadStreak) };
    }
    default:
      return null;
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const input = parseInput(rawBody);
  if (!input) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const admin = createAdminClient();

  // millionaire_win: bonus SAMO za prvi milion po vežbi. Klijent prvo upiše
  // pobednički pokušaj (score = total_questions) pa zove award - prva pobeda
  // znači tačno JEDAN takav red. Bez reda (lažiran exerciseId) ili sa više
  // (ponovljena pobeda) bonusa nema.
  if (input.reason === "millionaire_win") {
    const exerciseId = (rawBody as Record<string, unknown>).exerciseId;
    if (typeof exerciseId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(exerciseId)) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }
    const { data: attempts, error: attErr } = await admin
      .from("exercise_attempts")
      .select("score, total_questions")
      .eq("exercise_id", exerciseId)
      .eq("user_id", user.id);
    if (attErr) {
      console.error("exercise_attempts read failed", attErr);
      return NextResponse.json({ error: "Greška pri čitanju pokušaja" }, { status: 500 });
    }
    const wins = (attempts || []).filter(
      (a: { score: number; total_questions: number }) => a.score === a.total_questions
    ).length;
    if (wins !== 1) {
      return NextResponse.json({ awarded: 0, leveledUp: false, dailyGoalMet: false, progress: null });
    }
  }
  // NAPOMENA (v1): read-then-upsert nije atomičan; dve istovremene dodele mogu
  // izgubiti jednu. Prihvatljivo za v1 (gubi se par srca). TODO: RPC/optimistic lock.
  const { data: row, error: readErr } = await admin
    .from("user_progress").select("*").eq("user_id", user.id).maybeSingle();
  if (readErr) {
    console.error("user_progress read failed", readErr);
    return NextResponse.json({ error: "Greška pri čitanju napretka" }, { status: 500 });
  }

  const prev: Progress = row
    ? {
        total_hearts: row.total_hearts, level: row.level,
        current_streak: row.current_streak, longest_streak: row.longest_streak,
        last_active_date: row.last_active_date, hearts_today: row.hearts_today,
      }
    : DEFAULT_PROGRESS;

  const result = applyAward(prev, input, todayISO());

  const { error } = await admin.from("user_progress").upsert({
    user_id: user.id,
    ...result.next,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error("user_progress upsert failed", error);
    return NextResponse.json({ error: "Greška pri čuvanju napretka" }, { status: 500 });
  }

  return NextResponse.json({
    awarded: result.awarded,
    leveledUp: result.leveledUp,
    dailyGoalMet: result.dailyGoalMet,
    progress: result.next,
  });
}
