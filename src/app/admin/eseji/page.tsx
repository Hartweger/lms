"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface EssayRow {
  id: string;
  user_id: string;
  exercise_id: string;
  lesson_id: string;
  text: string;
  ai_feedback: string | null;
  ai_corrections: { original: string; corrected: string; explanation: string }[] | null;
  ai_score: number | null;
  professor_feedback: string | null;
  professor_score: number | null;
  status: "pending" | "reviewed" | "published";
  submitted_at: string;
  reviewed_at: string | null;
  user_profiles?: { full_name: string; email: string };
  lessons?: { title: string };
  exercises?: { title: string };
}

export default function AdminEseji() {
  const supabase = createClient();
  const [essays, setEssays] = useState<EssayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "reviewed" | "published" | "all">("pending");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [profFeedback, setProfFeedback] = useState("");
  const [profScore, setProfScore] = useState(3);
  const [editCorrections, setEditCorrections] = useState<{ original: string; corrected: string; explanation: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [maxByEx, setMaxByEx] = useState<Record<string, number>>({});
  const [assignees, setAssignees] = useState<Record<string, { professorName: string }>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // NAPOMENA: nema FK veze essay_submissions->user_profiles, pa embed user_profiles(...)
      // ruši ceo upit (vraća null) - imena učenika se čitaju zasebno i spajaju ispod.
      let query = supabase
        .from("essay_submissions")
        .select("*, lessons(title), exercises(title)")
        .order("submitted_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data } = await query;
      const baseRows = (data as EssayRow[]) || [];

      // Imena/mejlovi učenika - preko admin rute (service-role).
      // RLS politika "Admins can read all profiles" je rekurzivna i tiho obori
      // direktan browser upit na user_profiles → svi bi bili "Nepoznat".
      const userIds = [...new Set(baseRows.map((r) => r.user_id))];
      const profById = new Map<string, { full_name: string; email: string }>();
      if (userIds.length > 0) {
        const res = await fetch("/api/admin/user-names", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: userIds }),
        });
        if (res.ok) {
          const { names } = (await res.json()) as { names: Record<string, { full_name: string; email: string }> };
          for (const [id, info] of Object.entries(names ?? {})) {
            profById.set(id, info);
          }
        }
      }

      const rows = baseRows.map((r) => ({ ...r, user_profiles: profById.get(r.user_id) }));
      setEssays(rows);

      // Koji esej je dodeljen profesorki (da admin zna šta profesor pregleda).
      const essayIds = rows.map((r) => r.id);
      if (essayIds.length > 0) {
        const ares = await fetch("/api/admin/essay-assignees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ essayIds }),
        });
        if (ares.ok) {
          const { assignees: a } = (await ares.json()) as { assignees: Record<string, { professorName: string }> };
          setAssignees(a ?? {});
        }
      }

      // Max bodovi po eseju (options.maxPoints, default 5).
      const exIds = [...new Set(rows.map((e) => e.exercise_id))];
      if (exIds.length) {
        const { data: eqs } = await supabase.from("exercise_questions").select("exercise_id, options").in("exercise_id", exIds);
        const m: Record<string, number> = {};
        for (const q of eqs || []) {
          const mp = (q.options as { maxPoints?: number } | null)?.maxPoints;
          if (m[q.exercise_id] === undefined) m[q.exercise_id] = typeof mp === "number" ? mp : 5;
        }
        setMaxByEx(m);
      }
      setLoading(false);
    };
    load();
  }, [filter, supabase]);

  const startReview = (essay: EssayRow) => {
    setEditingId(essay.id);
    setProfFeedback(essay.professor_feedback || essay.ai_feedback || "");
    setProfScore(essay.professor_score || essay.ai_score || 3);
    setEditCorrections((essay.ai_corrections ?? []).map((c) => ({
      original: c.original ?? "",
      corrected: c.corrected ?? "",
      explanation: c.explanation ?? "",
    })));
  };

  const updateCorrection = (i: number, field: "original" | "corrected" | "explanation", val: string) => {
    setEditCorrections((prev) => prev.map((c, idx) => (idx === i ? { ...c, [field]: val } : c)));
  };
  const removeCorrection = (i: number) => {
    setEditCorrections((prev) => prev.filter((_, idx) => idx !== i));
  };
  const addCorrection = () => {
    setEditCorrections((prev) => [...prev, { original: "", corrected: "", explanation: "" }]);
  };

  const publishEssay = async (essayId: string) => {
    setSaving(true);
    const cleanedCorrections = editCorrections.filter((c) => c.original.trim() !== "" || c.corrected.trim() !== "");
    const res = await fetch("/api/essays/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ essayId, professorFeedback: profFeedback, professorScore: profScore, corrections: cleanedCorrections }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert("Greška pri objavi: " + (j.error ?? res.status));
      setSaving(false);
      return;
    }

    setEssays(essays.map(e =>
      e.id === essayId
        ? { ...e, professor_feedback: profFeedback, professor_score: profScore, ai_corrections: cleanedCorrections, status: "published" as const, reviewed_at: new Date().toISOString() }
        : e
    ));
    setEditingId(null);
    setSaving(false);
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    reviewed: "bg-blue-100 text-blue-700",
    published: "bg-green-100 text-green-700",
  };

  const statusLabels = {
    pending: "Čeka pregled",
    reviewed: "Pregledano",
    published: "Objavljeno",
  };

  if (loading) return <div className="p-8 text-gray-400">Učitavanje...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Schreiben</h1>
      <p className="text-gray-500 mb-6">Pregled i ocenjivanje studentskih Schreiben radova</p>

      <div className="flex gap-2 mb-6">
        {(["pending", "reviewed", "published", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm ${
              filter === f
                ? "bg-plava text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "pending" ? "Čekaju pregled" : f === "reviewed" ? "Pregledano" : f === "published" ? "Objavljeno" : "Svi"}
          </button>
        ))}
      </div>

      {essays.length === 0 && (
        <p className="text-gray-400 text-center py-12">Nema radova u ovoj kategoriji.</p>
      )}

      <div className="space-y-4">
        {essays.map((essay) => (
          <div key={essay.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-medium text-gray-900">
                  {essay.user_profiles?.full_name || essay.user_profiles?.email || "Nepoznat"}
                </span>
                <span className="text-gray-400 text-sm ml-3">
                  {new Date(essay.submitted_at).toLocaleDateString("sr-Latn")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {assignees[essay.id] ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                    👩‍🏫 Profesorka: {assignees[essay.id].professorName}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                    Bez profesora (ti)
                  </span>
                )}
                <span className={`text-xs px-2 py-1 rounded-full ${statusColors[essay.status]}`}>
                  {statusLabels[essay.status]}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-3">
              {essay.lessons?.title} - {essay.exercises?.title}
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-1">Tekst studenta:</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{essay.text}</p>
            </div>

            {essay.ai_feedback && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-xs font-semibold text-blue-600 mb-1">
                  AI sugestija (ocena: {essay.ai_score}/5):
                </p>
                <p className="text-sm text-gray-700">{essay.ai_feedback}</p>
                {essay.ai_corrections && essay.ai_corrections.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {essay.ai_corrections.map((c, i) => (
                      <div key={i} className="text-xs">
                        <span className="text-koral line-through">{c.original}</span>
                        {" → "}
                        <span className="text-green-600 font-medium">{c.corrected}</span>
                        {c.explanation && <span className="text-gray-400"> - {c.explanation}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {editingId === essay.id ? (
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Tvoj komentar:</label>
                  <textarea
                    value={profFeedback}
                    onChange={(e) => setProfFeedback(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-2">
                    Ispravke (učenik ovo vidi - izmeni ili obriši pogrešne):
                  </label>
                  <div className="space-y-3">
                    {editCorrections.map((c, i) => (
                      <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            value={c.original}
                            onChange={(e) => updateCorrection(i, "original", e.target.value)}
                            placeholder="pogrešno (original)"
                            className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm text-koral focus:outline-none focus:ring-2 focus:ring-plava"
                          />
                          <span className="text-gray-400">→</span>
                          <input
                            value={c.corrected}
                            onChange={(e) => updateCorrection(i, "corrected", e.target.value)}
                            placeholder="ispravno"
                            className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-sm text-green-600 font-medium focus:outline-none focus:ring-2 focus:ring-plava"
                          />
                          <button
                            type="button"
                            onClick={() => removeCorrection(i)}
                            className="text-koral hover:bg-red-50 rounded px-2 py-1 text-sm"
                            title="Obriši ispravku"
                          >
                            ✕
                          </button>
                        </div>
                        <input
                          value={c.explanation}
                          onChange={(e) => updateCorrection(i, "explanation", e.target.value)}
                          placeholder="objašnjenje (opciono)"
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs text-gray-500 focus:outline-none focus:ring-2 focus:ring-plava"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addCorrection}
                    className="mt-2 text-sm text-plava hover:underline"
                  >
                    + Dodaj ispravku
                  </button>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">
                    Ocena (0 - {maxByEx[essay.exercise_id] ?? 5} {(maxByEx[essay.exercise_id] ?? 5) > 5 ? "Punkte" : ""}):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={maxByEx[essay.exercise_id] ?? 5}
                      value={profScore}
                      onChange={(e) => {
                        const mx = maxByEx[essay.exercise_id] ?? 5;
                        setProfScore(Math.max(0, Math.min(mx, parseInt(e.target.value) || 0)));
                      }}
                      className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava"
                    />
                    <span className="text-sm text-gray-400">/ {maxByEx[essay.exercise_id] ?? 5}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => publishEssay(essay.id)}
                    disabled={saving}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? "Čuvam..." : "Objavi studentu"}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-200"
                  >
                    Otkaži
                  </button>
                </div>
              </div>
            ) : (
              essay.status !== "published" && (
                <button
                  onClick={() => startReview(essay)}
                  className="bg-plava text-white px-4 py-2 rounded-lg text-sm hover:bg-plava-dark"
                >
                  Pregledaj i oceni
                </button>
              )
            )}

            {essay.status === "published" && essay.professor_feedback && (
              <div className="bg-green-50 rounded-lg p-4 mt-4">
                <p className="text-xs font-semibold text-green-600 mb-1">
                  Profesor (ocena: {essay.professor_score}/{maxByEx[essay.exercise_id] ?? 5}):
                </p>
                <p className="text-sm text-gray-700">{essay.professor_feedback}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
