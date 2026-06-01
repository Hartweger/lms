"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LessonCompleteButton({
  lessonId,
  initialCompleted,
  willCompleteLevel,
  levelComplete,
}: {
  lessonId: string;
  initialCompleted: boolean;
  /** true ako baš ova lekcija zatvara ceo nivo */
  willCompleteLevel: boolean;
  /** true ako je nivo već bio kompletan pri učitavanju */
  levelComplete: boolean;
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [saving, setSaving] = useState(false);
  const [justFinishedLevel, setJustFinishedLevel] = useState(false);

  const markComplete = async () => {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("lesson_progress").upsert(
        { user_id: user.id, lesson_id: lessonId, completed: true, completed_at: new Date().toISOString() },
        { onConflict: "user_id,lesson_id" }
      );
    }
    setCompleted(true);
    if (willCompleteLevel) setJustFinishedLevel(true);
    setSaving(false);
  };

  const showCongrats = justFinishedLevel || (completed && levelComplete);

  if (showCongrats) {
    return (
      <div className="mt-8 bg-plava-light rounded-2xl p-6 text-center">
        <div className="text-3xl mb-2">🎉</div>
        <p className="text-lg font-bold text-plava mb-1">Čestitamo! Završio/la si ceo nivo!</p>
        <p className="text-sm text-gray-600">
          Sjajan posao — istrajao/la si do kraja. Sada uvežbaj kroz Prüfungstraining lekcije i
          pripremi se za ispit. Ponosni smo na tebe! 💪
        </p>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="mt-8 flex items-center justify-center gap-2 text-green-600 font-medium">
        <span className="text-xl">✓</span> Lekcija završena
      </div>
    );
  }

  return (
    <div className="mt-8 text-center">
      <button
        onClick={markComplete}
        disabled={saving}
        className="bg-plava text-white px-8 py-3 rounded-lg font-bold hover:bg-plava-dark transition-colors disabled:opacity-50"
      >
        {saving ? "Čuvam..." : "Završi lekciju"}
      </button>
    </div>
  );
}
