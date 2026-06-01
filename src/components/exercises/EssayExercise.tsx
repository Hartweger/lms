"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface EssayProps {
  task: string;
  level: string;
  onAnswer: (correct: boolean) => void;
  exerciseId?: string;
  lessonId?: string;
}

interface Correction {
  original: string;
  corrected: string;
  explanation: string;
}

interface PublishedResult {
  professor_feedback: string;
  professor_score: number;
  ai_feedback: string | null;
  ai_corrections: Correction[] | null;
}

export default function EssayExercise({ task, level, onAnswer, exerciseId, lessonId }: EssayProps) {
  const supabase = createClient();
  const [text, setText] = useState("");
  const [checking, setChecking] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [published, setPublished] = useState<PublishedResult | null>(null);
  const [alreadyPending, setAlreadyPending] = useState(false);

  useEffect(() => {
    if (!exerciseId) return;
    const checkExisting = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("essay_submissions")
        .select("*")
        .eq("exercise_id", exerciseId)
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        if (data.status === "published") {
          setPublished({
            professor_feedback: data.professor_feedback,
            professor_score: data.professor_score,
            ai_feedback: data.ai_feedback,
            ai_corrections: data.ai_corrections as Correction[] | null,
          });
          onAnswer((data.professor_score || 0) >= 3);
        } else {
          setAlreadyPending(true);
        }
      }
    };
    checkExisting();
  }, [exerciseId, supabase]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setChecking(true);

    try {
      const response = await fetch("/api/check-essay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, task, level }),
      });
      const aiData = await response.json();

      if (exerciseId && lessonId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("essay_submissions").insert({
            user_id: user.id,
            exercise_id: exerciseId,
            lesson_id: lessonId,
            text,
            ai_feedback: aiData.feedback || null,
            ai_corrections: aiData.corrections || null,
            ai_score: aiData.score || null,
            status: "pending",
          });
        }
      }

      setSubmitted(true);
      onAnswer(true);
    } catch {
      if (exerciseId && lessonId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("essay_submissions").insert({
            user_id: user.id,
            exercise_id: exerciseId,
            lesson_id: lessonId,
            text,
            status: "pending",
          });
        }
      }
      setSubmitted(true);
      onAnswer(true);
    }
    setChecking(false);
  };

  const scoreLabels: Record<number, string> = {
    1: "Treba još vežbe",
    2: "Na dobrom si putu",
    3: "Dobro!",
    4: "Vrlo dobro!",
    5: "Odlično!",
  };

  const scoreColors: Record<number, string> = {
    1: "text-koral",
    2: "text-orange-500",
    3: "text-yellow-600",
    4: "text-green-500",
    5: "text-green-600",
  };

  if (published) {
    return (
      <div>
        <div className="mb-4">
          <p className="text-lg font-medium text-gray-900 mb-2">Zadatak:</p>
          <p className="text-gray-600 bg-gray-50 rounded-lg p-4 whitespace-pre-line">{task}</p>
        </div>
        <div className="mt-6 space-y-4">
          {published.professor_score && (
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-bold ${scoreColors[published.professor_score]}`}>
                {published.professor_score}/5
              </span>
              <span className={`text-sm font-medium ${scoreColors[published.professor_score]}`}>
                {scoreLabels[published.professor_score]}
              </span>
            </div>
          )}
          {published.professor_feedback && (
            <div className="bg-plava-light rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 mb-1">Komentar profesora:</p>
              <p className="text-sm text-gray-700">{published.professor_feedback}</p>
            </div>
          )}
          {published.ai_corrections && published.ai_corrections.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Ispravke:</h4>
              {published.ai_corrections.map((c, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-100 p-3">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-koral line-through">{c.original}</span>
                    <span className="text-gray-400">&rarr;</span>
                    <span className="text-green-600 font-medium">{c.corrected}</span>
                  </div>
                  {c.explanation && (
                    <p className="text-xs text-gray-400 mt-1">{c.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (submitted || alreadyPending) {
    return (
      <div>
        <div className="mb-4">
          <p className="text-lg font-medium text-gray-900 mb-2">Zadatak:</p>
          <p className="text-gray-600 bg-gray-50 rounded-lg p-4 whitespace-pre-line">{task}</p>
        </div>
        <div className="mt-6 bg-plava-light rounded-xl p-6 text-center">
          <p className="text-lg font-medium text-plava mb-2">Tvoj Schreiben je poslat na pregled</p>
          <p className="text-sm text-gray-500">Profesor će pregledati tvoj rad i dati ti povratnu informaciju. Rezultat ćeš videti ovde kada bude gotovo.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <p className="text-lg font-medium text-gray-900 mb-2">Zadatak:</p>
        <p className="text-gray-600 bg-gray-50 rounded-lg p-4 whitespace-pre-line">{task}</p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Napiši odgovor na nemačkom..."
        rows={6}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-plava focus:border-transparent resize-none text-gray-700"
      />
      <button
        onClick={handleSubmit}
        disabled={checking || submitted || !text.trim()}
        className="mt-4 bg-plava text-white px-6 py-3 rounded-lg hover:bg-plava-dark transition-colors disabled:opacity-50"
      >
        {checking ? "Šaljem..." : "Pošalji Schreiben"}
      </button>
    </div>
  );
}
