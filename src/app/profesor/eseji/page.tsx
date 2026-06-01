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

export default function ProfesorEseji() {
  const supabase = createClient();
  const [essays, setEssays] = useState<EssayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "reviewed" | "published" | "all">("pending");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [profFeedback, setProfFeedback] = useState("");
  const [profScore, setProfScore] = useState(3);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get assigned student IDs
      const { data: assignments } = await supabase
        .from("professor_students")
        .select("student_id")
        .eq("professor_id", user.id);

      const studentIds = [...new Set(assignments?.map((a: { student_id: string }) => a.student_id) ?? [])];

      if (studentIds.length === 0) {
        setEssays([]);
        setLoading(false);
        return;
      }

      // Fetch essays only from assigned students
      let query = supabase
        .from("essay_submissions")
        .select("*, user_profiles(full_name, email), lessons(title), exercises(title)")
        .in("user_id", studentIds)
        .order("submitted_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data } = await query;
      setEssays((data as EssayRow[]) || []);
      setLoading(false);
    };
    load();
  }, [filter, supabase]);

  const startReview = (essay: EssayRow) => {
    setEditingId(essay.id);
    setProfFeedback(essay.professor_feedback || essay.ai_feedback || "");
    setProfScore(essay.professor_score || essay.ai_score || 3);
  };

  const publishEssay = async (essayId: string) => {
    setSaving(true);
    const { error } = await supabase.from("essay_submissions").update({
      professor_feedback: profFeedback,
      professor_score: profScore,
      status: "published",
      reviewed_at: new Date().toISOString(),
    }).eq("id", essayId);

    if (error) {
      alert("Greška pri čuvanju: " + error.message);
      setSaving(false);
      return;
    }

    setEssays(essays.map(e =>
      e.id === essayId
        ? { ...e, professor_feedback: profFeedback, professor_score: profScore, status: "published" as const, reviewed_at: new Date().toISOString() }
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

  if (loading) return <div className="text-gray-400">Učitavanje...</div>;

  return (
    <div>
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
              <span className={`text-xs px-2 py-1 rounded-full ${statusColors[essay.status]}`}>
                {statusLabels[essay.status]}
              </span>
            </div>

            <p className="text-xs text-gray-400 mb-3">
              {essay.lessons?.title} — {essay.exercises?.title}
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
                        {c.explanation && <span className="text-gray-400"> — {c.explanation}</span>}
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
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Ocena:</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onClick={() => setProfScore(s)}
                        className={`w-10 h-10 rounded-lg text-sm font-bold ${
                          profScore === s
                            ? "bg-plava text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
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
                  Profesor (ocena: {essay.professor_score}/5):
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
