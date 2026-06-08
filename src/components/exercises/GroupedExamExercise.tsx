"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { sanitizeHtml } from "@/lib/sanitize";
import type { Exercise, ExerciseQuestion } from "@/lib/types";

interface Props {
  exercise: Exercise;
  questions: ExerciseQuestion[];
  nextLessonId?: string | null;
  isTest?: boolean;
}

type Ctx = { title: string; type: string; content?: string; headers?: string[]; rows?: string[][] };

function ctxOf(q: ExerciseQuestion): Ctx | null {
  const o = q.options as Record<string, unknown> | null;
  if (o && typeof o === "object" && !Array.isArray(o) && o.context && typeof o.context === "object") return o.context as Ctx;
  return null;
}
function itemsOf(q: ExerciseQuestion): string[] {
  const o = q.options as Record<string, unknown> | null;
  if (o && typeof o === "object" && Array.isArray((o as { items?: unknown }).items)) return (o as { items: string[] }).items;
  return [];
}
function fmtMd(md: string): string {
  return (md || "")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");
}

export default function GroupedExamExercise({ exercise, questions, nextLessonId, isTest = false }: Props) {
  const supabase = createClient();

  // Grupiši pitanja u delove po zajedničkom tekstu (context) ili audiju
  const groups: ExerciseQuestion[][] = [];
  let lastKey: string | null = null;
  for (const q of questions) {
    const key = ctxOf(q)?.title || q.audio_url || "";
    if (key !== lastKey || groups.length === 0) { groups.push([q]); lastKey = key; }
    else groups[groups.length - 1].push(q);
  }

  const [partIdx, setPartIdx] = useState(0);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [finished, setFinished] = useState(false);
  const [ctxOpen, setCtxOpen] = useState(true);

  const part = groups[partIdx];
  const ctx = ctxOf(part[0]);
  const audio = part[0].audio_url;
  const isChecked = !!checked[partIdx];
  const allAnswered = part.every((q) => selected[q.id] !== undefined);

  const totalCorrect = () => questions.filter((q) => selected[q.id] === parseInt(q.correct_answer)).length;

  const checkPart = () => setChecked({ ...checked, [partIdx]: true });

  const next = async () => {
    if (partIdx < groups.length - 1) {
      setPartIdx(partIdx + 1);
      setCtxOpen(true);
      return;
    }
    // kraj — sačuvaj pokušaj
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("exercise_attempts").insert({
        exercise_id: exercise.id, user_id: user.id,
        score: totalCorrect(), total_questions: questions.length,
      });
    }
    setFinished(true);
  };

  if (finished) {
    const sc = totalCorrect();
    const pct = Math.round((sc / questions.length) * 100);
    const msg = pct >= 80 ? "Odlično! Spreman/na si za ovaj deo ispita." : pct >= 60 ? "Dobar rezultat — još malo vežbe i ide!" : "Nastavi da vežbaš — proći ćeš tekst/audio još jednom i biće bolje.";
    const restart = () => { setSelected({}); setChecked({}); setPartIdx(0); setCtxOpen(true); setFinished(false); };
    return (
      <div className="mt-4 bg-plava-light rounded-2xl p-8 text-center">
        <div className="text-5xl mb-3">{pct >= 60 ? "🎉" : "💪"}</div>
        <p className="text-2xl font-bold text-gray-900 mb-1">{sc} / {questions.length} tačno</p>
        <p className="text-lg font-semibold text-plava mb-2">{pct}%</p>
        <p className="text-sm text-gray-600 mb-3 max-w-md mx-auto">{msg} Rezultat je sačuvan u tvom napretku.</p>
        {isTest && (
          <p className="text-sm mb-6 max-w-md mx-auto">
            <span className={`inline-block px-3 py-1.5 rounded-lg font-medium ${pct >= 60 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
              ℹ️ Na Goethe ispitu treba <strong>60%</strong> za prolaz{pct >= 60 ? " — ti si iznad praga! ✅" : "."}
            </span>
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button onClick={restart} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-white transition-colors text-sm font-medium">↺ Pokušaj ponovo</button>
          <Link href={`/lekcija/${exercise.lesson_id}`} className="px-5 py-2.5 rounded-lg border border-plava text-plava hover:bg-white transition-colors text-sm font-semibold">← Nazad na lekciju</Link>
          {nextLessonId && (
            <Link href={`/lekcija/${nextLessonId}`} className="px-6 py-2.5 rounded-lg bg-plava text-white font-bold hover:bg-plava-dark transition-colors text-sm">Sledeća lekcija →</Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2">
        <span className="flex items-center gap-2 min-w-0">
          <span className={`text-xs px-2 py-0.5 rounded-full ${isTest ? "bg-koral-light text-koral-dark" : "bg-plava-light text-plava"}`}>{isTest ? "🎯 Test" : "✏️ Vežba"}</span>
          <span className="text-sm font-medium text-plava truncate">{exercise.title}</span>
        </span>
        <span className="text-sm text-gray-400 whitespace-nowrap">Deo {partIdx + 1} / {groups.length}</span>
      </div>

      {/* Tekst / audio dela — jednom za sva pitanja */}
      {ctx && (
        <div className="mb-6 border border-gray-200 rounded-xl overflow-hidden">
          <button onClick={() => setCtxOpen(!ctxOpen)} className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 text-left">
            <span className="text-sm font-semibold text-gray-700">{ctx.title}</span>
            <span className="text-gray-400 text-xs">{ctxOpen ? "Sakrij ▲" : "Prikaži tekst ▼"}</span>
          </button>
          {ctxOpen && (
            <div className="px-5 py-4 max-h-96 overflow-y-auto bg-white border-t border-gray-100">
              <div className="prose prose-sm prose-gray max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(`<p>${fmtMd(ctx.content || "")}</p>`) }} />
            </div>
          )}
        </div>
      )}
      {audio && (
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-2">Poslušaj audio:</p>
          <audio controls className="w-full" src={audio} preload="none" />
        </div>
      )}

      {/* Sva pitanja dela, jedno ispod drugog */}
      <div className="space-y-5">
        {part.map((q) => {
          const items = itemsOf(q);
          const correct = parseInt(q.correct_answer);
          const sel = selected[q.id];
          return (
            <div key={q.id} className="border border-gray-100 rounded-lg p-4">
              <div className="text-gray-900 mb-3" dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.question) }} />
              <div className="space-y-2">
                {items.map((opt, i) => {
                  let cls = "border-gray-200 hover:bg-gray-50";
                  if (isChecked) {
                    if (i === correct) cls = "border-green-500 bg-green-50 text-green-800";
                    else if (i === sel) cls = "border-koral bg-koral-light text-koral-dark";
                    else cls = "border-gray-200 opacity-60";
                  } else if (i === sel) cls = "border-plava bg-plava-light text-plava";
                  return (
                    <button key={i} disabled={isChecked}
                      onClick={() => setSelected({ ...selected, [q.id]: i })}
                      className={`w-full text-left px-4 py-2.5 rounded-lg border-2 text-sm transition-colors ${cls}`}>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {isChecked && sel !== correct && q.explanation && (
                <p className="text-xs text-gray-500 mt-2">{q.explanation}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Dugme: Proveri (na kraju dela) → pa Sledeći deo */}
      <div className="mt-6">
        {!isChecked ? (
          <button onClick={checkPart} disabled={!allAnswered}
            className={`px-6 py-3 rounded-lg font-bold transition-colors ${allAnswered ? "bg-plava text-white hover:bg-plava-dark" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
            Proveri Deo {partIdx + 1}
          </button>
        ) : (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">
              {part.filter((q) => selected[q.id] === parseInt(q.correct_answer)).length} / {part.length} tačno u ovom delu
            </span>
            <button onClick={next} className="px-6 py-3 rounded-lg font-bold bg-plava text-white hover:bg-plava-dark transition-colors ml-auto">
              {partIdx < groups.length - 1 ? `Sledeći deo →` : "Završi test"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
