"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LessonProgressTracker({
  lessonId,
  lessonsToMark,
}: {
  lessonId: string;
  lessonsToMark: string[];
}) {
  useEffect(() => {
    if (lessonsToMark.length === 0) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: { id: string } | null } }) => {
      if (!user) return;
      supabase
        .from("lesson_progress")
        .upsert(
          lessonsToMark.map((lid) => ({
            user_id: user.id,
            lesson_id: lid,
            completed: true,
            completed_at: new Date().toISOString(),
          })),
          { onConflict: "user_id,lesson_id" }
        )
        .then(({ error }: { error: unknown }) => {
          if (error) return;
          // dodela srca za svaku završenu lekciju
          for (let i = 0; i < lessonsToMark.length; i++) {
            fetch("/api/hearts/award", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reason: "lesson_complete" }),
            }).catch(() => {});
          }
        });
    });
  }, [lessonId, lessonsToMark]);

  return null;
}
