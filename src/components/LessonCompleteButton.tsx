"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LessonCompleteButton({
  lessonId,
  initialCompleted,
  willCompleteLevel,
  levelComplete,
  prevLessonId,
  nextLessonId,
}: {
  lessonId: string;
  initialCompleted: boolean;
  /** true ako baš ova lekcija zatvara ceo nivo */
  willCompleteLevel: boolean;
  /** true ako je nivo već bio kompletan pri učitavanju */
  levelComplete: boolean;
  prevLessonId?: string | null;
  nextLessonId?: string | null;
}) {
  const router = useRouter();
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
    if (willCompleteLevel) {
      setJustFinishedLevel(true);
      setSaving(false);
      return; // ostani na strani da se vidi čestitka
    }
    if (nextLessonId) {
      router.push(`/lekcija/${nextLessonId}`); // saving ostaje true dok traje navigacija
      return;
    }
    setSaving(false);
  };

  const prevClasses =
    "flex-1 text-center py-3 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors";
  const nextClasses =
    "flex-1 text-center py-3 bg-plava text-white rounded-lg text-sm font-bold hover:bg-plava-dark transition-colors";

  const PrevLink = prevLessonId ? (
    <Link href={`/lekcija/${prevLessonId}`} className={prevClasses}>
      ← Prethodna
    </Link>
  ) : (
    <div className="flex-1" />
  );

  const showCongrats = justFinishedLevel || (completed && levelComplete);

  if (showCongrats) {
    return (
      <div className="mt-8">
        <div className="bg-plava-light rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <p className="text-lg font-bold text-plava mb-1">Čestitamo! Završio/la si ceo nivo!</p>
          <p className="text-sm text-gray-600">
            Sjajan posao — istrajao/la si do kraja. Sada uvežbaj kroz Prüfungstraining lekcije i
            pripremi se za ispit. Ponosni smo na tebe! 💪
          </p>
        </div>
        {prevLessonId && (
          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
            {PrevLink}
            <div className="flex-1" />
          </div>
        )}
      </div>
    );
  }

  // Već završena (ponovni dolazak) — oznaka + navigacija, bez ponovnog „završavanja"
  if (completed) {
    return (
      <div className="mt-8">
        <div className="flex items-center justify-center gap-2 text-green-600 font-medium mb-4">
          <span className="text-xl">✓</span> Lekcija završena
        </div>
        <div className="flex gap-3 pt-6 border-t border-gray-100">
          {PrevLink}
          {nextLessonId ? (
            <Link href={`/lekcija/${nextLessonId}`} className={nextClasses}>
              Sledeća →
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </div>
    );
  }

  // Nije završena — jedno glavno dugme: „Završi i nastavi →" (ili „Završi lekciju" na kraju)
  return (
    <div className="mt-8 flex gap-3 pt-6 border-t border-gray-100">
      {PrevLink}
      <button
        onClick={markComplete}
        disabled={saving}
        className="flex-1 bg-plava text-white py-3 rounded-lg font-bold hover:bg-plava-dark transition-colors disabled:opacity-50"
      >
        {saving ? "Čuvam..." : nextLessonId ? "Završi i nastavi →" : "Završi lekciju"}
      </button>
    </div>
  );
}
