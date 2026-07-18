"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Exercise, ExerciseQuestion } from "@/lib/types";

const typeLabels: Record<string, string> = {
  quiz: "Kviz",
  fill_blank: "Popuni prazninu",
  match_pairs: "Spoji parove",
  word_order: "Poredaj reči",
  listen_write: "Slobodan odgovor (AI)",
  dialog: "Dijalog (AI)",
  speak: "Izgovori (mikrofon)",
  millionaire: "Milioner",
};

export default function AdminVezbe() {
  const params = useParams();
  const lessonId = params.lessonId as string;
  const supabase = createClient();
  const [lesson, setLesson] = useState<{ title: string; course_id: string } | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [questions, setQuestions] = useState<Record<string, ExerciseQuestion[]>>({});
  const [loading, setLoading] = useState(true);
  const [openExercise, setOpenExercise] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: lessonData } = await supabase
        .from("lessons").select("title, course_id").eq("id", lessonId).single();
      if (lessonData) setLesson(lessonData);

      const { data: exerciseData } = await supabase
        .from("exercises").select("*").eq("lesson_id", lessonId).order("order_index");
      if (exerciseData) {
        setExercises(exerciseData as Exercise[]);
        const qMap: Record<string, ExerciseQuestion[]> = {};
        for (const ex of exerciseData) {
          const { data: qData } = await supabase
            .from("exercise_questions").select("*").eq("exercise_id", ex.id).order("order_index");
          qMap[ex.id] = (qData as ExerciseQuestion[]) || [];
        }
        setQuestions(qMap);
      }
      setLoading(false);
    };
    load();
  }, [lessonId, supabase]);

  const addExercise = async (type: string) => {
    const { data } = await supabase
      .from("exercises")
      .insert({
        lesson_id: lessonId,
        title: `Nova vežba - ${typeLabels[type]}`,
        exercise_type: type,
        order_index: exercises.length,
      })
      .select().single();
    if (data) {
      setExercises([...exercises, data as Exercise]);
      if (type === "dialog") {
        // Auto-create one question with dialog config
        const { data: qData } = await supabase
          .from("exercise_questions")
          .insert({
            exercise_id: data.id,
            question: "Dijalog",
            options: {
              scenario: "",
              ai_role: "",
              level: "A1",
              dialog_mode: "guided",
              max_turns: 6,
              goals: [""],
              intro_text: "",
              opening_message: "",
              system_prompt_extra: "",
            },
            correct_answer: "dialog",
            order_index: 0,
          })
          .select().single();
        setQuestions({ ...questions, [data.id]: qData ? [qData as ExerciseQuestion] : [] });
      } else {
        setQuestions({ ...questions, [data.id]: [] });
      }
      setOpenExercise(data.id);
    }
  };

  const deleteExercise = async (id: string) => {
    if (!confirm("Obrisati vežbu i sva pitanja?")) return;
    await supabase.from("exercises").delete().eq("id", id);
    setExercises(exercises.filter((e) => e.id !== id));
    const newQ = { ...questions };
    delete newQ[id];
    setQuestions(newQ);
  };

  const updateExerciseTitle = async (id: string, title: string) => {
    await supabase.from("exercises").update({ title }).eq("id", id);
    setExercises(exercises.map((e) => (e.id === id ? { ...e, title } : e)));
  };

  const addQuestion = async (exerciseId: string, exerciseType: string) => {
    let defaultData: Record<string, unknown> = {
      exercise_id: exerciseId,
      question: "",
      correct_answer: "",
      order_index: (questions[exerciseId] || []).length,
    };

    if (exerciseType === "quiz" || exerciseType === "millionaire") {
      defaultData.options = ["", "", "", ""];
      defaultData.correct_answer = "0";
    } else if (exerciseType === "fill_blank") {
      defaultData.question = "Er ___ nach Hause.";
      defaultData.options = ["geht", "kommt", "macht"];
      defaultData.correct_answer = "geht";
    } else if (exerciseType === "match_pairs") {
      defaultData.question = "Spoji parove";
      defaultData.options = [{ de: "", sr: "" }];
      defaultData.correct_answer = "all";
    } else if (exerciseType === "word_order") {
      defaultData.question = "Prevod rečenice";
      defaultData.options = ["Ich", "gehe"];
      defaultData.correct_answer = "Ich gehe";
    } else if (exerciseType === "speak") {
      defaultData.question = "Izgovori sledeću rečenicu naglas:";
      defaultData.options = { type: "speak" };
      defaultData.correct_answer = "";
    }

    const { data } = await supabase
      .from("exercise_questions").insert(defaultData).select().single();
    if (data) {
      setQuestions({
        ...questions,
        [exerciseId]: [...(questions[exerciseId] || []), data as ExerciseQuestion],
      });
    }
  };

  const updateQuestion = async (questionId: string, exerciseId: string, field: string, value: unknown) => {
    await supabase.from("exercise_questions").update({ [field]: value }).eq("id", questionId);
    setQuestions({
      ...questions,
      [exerciseId]: questions[exerciseId].map((q) =>
        q.id === questionId ? { ...q, [field]: value } : q
      ),
    });
  };

  const [dialogSaved, setDialogSaved] = useState(false);

  // Dialog: update local state only (no DB save until "Sačuvaj" clicked)
  const updateDialogLocal = (questionId: string, exerciseId: string, fieldName: string, fieldValue: unknown) => {
    setDialogSaved(false);
    setQuestions((prev) => ({
      ...prev,
      [exerciseId]: prev[exerciseId].map((q) => {
        if (q.id !== questionId) return q;
        const opts = (q.options as Record<string, unknown>) || {};
        return { ...q, options: { ...opts, [fieldName]: fieldValue } };
      }),
    }));
  };

  const saveDialogToDB = async (questionId: string, exerciseId: string) => {
    const q = questions[exerciseId]?.find((q) => q.id === questionId);
    if (!q) return;
    const { error } = await supabase.from("exercise_questions").update({ options: q.options }).eq("id", questionId);
    if (error) {
      alert("Greška pri čuvanju: " + error.message);
    } else {
      setDialogSaved(true);
      setTimeout(() => setDialogSaved(false), 2000);
    }
  };

  const deleteQuestion = async (questionId: string, exerciseId: string) => {
    await supabase.from("exercise_questions").delete().eq("id", questionId);
    setQuestions({
      ...questions,
      [exerciseId]: questions[exerciseId].filter((q) => q.id !== questionId),
    });
  };

  if (loading) return <div className="p-8 text-gray-400">Učitavanje...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {lesson && (
        <Link href={`/admin/kursevi/${lesson.course_id}`} className="text-sm text-plava hover:underline mb-4 inline-block">
          ← Nazad na kurs
        </Link>
      )}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Vežbe za lekciju</h1>
      <p className="text-gray-500 mb-8">{lesson?.title}</p>

      {/* Exercise list */}
      <div className="space-y-6">
        {exercises.map((ex) => (
          <div key={ex.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Exercise header */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => setOpenExercise(openExercise === ex.id ? null : ex.id)}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs bg-plava-light text-plava px-2 py-1 rounded-full">
                  {typeLabels[ex.exercise_type]}
                </span>
                <input
                  value={ex.title}
                  onChange={(e) => updateExerciseTitle(ex.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="font-medium text-gray-900 border-none focus:outline-none focus:ring-2 focus:ring-plava rounded px-2 py-1"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{(questions[ex.id] || []).length} pitanja</span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteExercise(ex.id); }}
                  className="text-koral hover:text-koral-dark text-sm"
                >
                  Obriši
                </button>
              </div>
            </div>

            {/* Questions (expanded) */}
            {openExercise === ex.id && (
              <div className="border-t border-gray-100 p-4 space-y-4">
                {(questions[ex.id] || []).map((q, qi) => (
                  <div key={q.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs text-gray-400 font-medium">Pitanje {qi + 1}</span>
                      <button onClick={() => deleteQuestion(q.id, ex.id)} className="text-xs text-koral hover:text-koral-dark">
                        Obriši
                      </button>
                    </div>

                    {/* Quiz question editor */}
                    {(ex.exercise_type === "quiz" || ex.exercise_type === "millionaire") && (
                      <div className="space-y-3">
                        <input
                          value={q.question}
                          onChange={(e) => updateQuestion(q.id, ex.id, "question", e.target.value)}
                          placeholder="Pitanje..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava"
                        />
                        {(Array.isArray(q.options) ? q.options as string[] : ["", "", "", ""]).map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${q.id}`}
                              checked={q.correct_answer === String(oi)}
                              onChange={() => updateQuestion(q.id, ex.id, "correct_answer", String(oi))}
                            />
                            <input
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...(q.options as string[])];
                                newOpts[oi] = e.target.value;
                                updateQuestion(q.id, ex.id, "options", newOpts);
                              }}
                              placeholder={`Opcija ${oi + 1}`}
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava"
                            />
                          </div>
                        ))}
                        <input
                          value={q.explanation || ""}
                          onChange={(e) => updateQuestion(q.id, ex.id, "explanation", e.target.value)}
                          placeholder="Objašnjenje za pogrešan odgovor (opciono)"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava"
                        />
                      </div>
                    )}

                    {/* Fill blank editor */}
                    {ex.exercise_type === "fill_blank" && (
                      <div className="space-y-3">
                        <input
                          value={q.question}
                          onChange={(e) => updateQuestion(q.id, ex.id, "question", e.target.value)}
                          placeholder="Rečenica sa ___ za prazninu (npr: Er ___ nach Hause)"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava"
                        />
                        <input
                          value={(q.options as string[] || []).join(", ")}
                          onChange={(e) => updateQuestion(q.id, ex.id, "options", e.target.value.split(", ").map(s => s.trim()).filter(Boolean))}
                          placeholder="Ponuđene reči (razdvojene zarezom): geht, kommt, macht"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava"
                        />
                        <input
                          value={q.correct_answer}
                          onChange={(e) => updateQuestion(q.id, ex.id, "correct_answer", e.target.value)}
                          placeholder="Tačna reč"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava"
                        />
                        <input
                          value={q.explanation || ""}
                          onChange={(e) => updateQuestion(q.id, ex.id, "explanation", e.target.value)}
                          placeholder="Objašnjenje (opciono)"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava"
                        />
                      </div>
                    )}

                    {/* Match pairs editor */}
                    {ex.exercise_type === "match_pairs" && (
                      <div className="space-y-3">
                        {(q.options as { de: string; sr: string }[] || []).map((pair, pi) => (
                          <div key={pi} className="flex items-center gap-2">
                            <input
                              value={pair.de}
                              onChange={(e) => {
                                const newPairs = [...(q.options as { de: string; sr: string }[])];
                                newPairs[pi] = { ...newPairs[pi], de: e.target.value };
                                updateQuestion(q.id, ex.id, "options", newPairs);
                              }}
                              placeholder="Nemački"
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava"
                            />
                            <span className="text-gray-400">↔</span>
                            <input
                              value={pair.sr}
                              onChange={(e) => {
                                const newPairs = [...(q.options as { de: string; sr: string }[])];
                                newPairs[pi] = { ...newPairs[pi], sr: e.target.value };
                                updateQuestion(q.id, ex.id, "options", newPairs);
                              }}
                              placeholder="Srpski"
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava"
                            />
                            <button
                              onClick={() => {
                                const newPairs = (q.options as { de: string; sr: string }[]).filter((_, i) => i !== pi);
                                updateQuestion(q.id, ex.id, "options", newPairs);
                              }}
                              className="text-koral text-sm"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const newPairs = [...(q.options as { de: string; sr: string }[]), { de: "", sr: "" }];
                            updateQuestion(q.id, ex.id, "options", newPairs);
                          }}
                          className="text-sm text-plava hover:underline"
                        >
                          + Dodaj par
                        </button>
                      </div>
                    )}

                    {/* Word order editor */}
                    {ex.exercise_type === "word_order" && (
                      <div className="space-y-3">
                        <input
                          value={q.question}
                          onChange={(e) => updateQuestion(q.id, ex.id, "question", e.target.value)}
                          placeholder="Prevod/hint (npr: Ja idem u školu)"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava"
                        />
                        <input
                          value={(q.options as string[] || []).join(", ")}
                          onChange={(e) => updateQuestion(q.id, ex.id, "options", e.target.value.split(", ").map(s => s.trim()).filter(Boolean))}
                          placeholder="Reči (razdvojene zarezom, pomešanim redom): Schule, gehe, die, in, Ich"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava"
                        />
                        <input
                          value={q.correct_answer}
                          onChange={(e) => updateQuestion(q.id, ex.id, "correct_answer", e.target.value)}
                          placeholder="Tačan redosled: Ich gehe in die Schule"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava"
                        />
                      </div>
                    )}

                    {/* Speak exercise editor */}
                    {ex.exercise_type === "speak" && (
                      <div className="space-y-3">
                        <input
                          value={q.question}
                          onChange={(e) => updateQuestion(q.id, ex.id, "question", e.target.value)}
                          placeholder="Uputstvo (npr: Izgovori sledeću rečenicu naglas)"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava"
                        />
                        <input
                          value={q.correct_answer}
                          onChange={(e) => updateQuestion(q.id, ex.id, "correct_answer", e.target.value)}
                          placeholder="Rečenica na nemačkom (npr: Ich möchte ein Glas Wasser, bitte.)"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava"
                        />
                        <input
                          value={q.explanation || ""}
                          onChange={(e) => updateQuestion(q.id, ex.id, "explanation", e.target.value)}
                          placeholder="Objašnjenje / napomena (opciono)"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava"
                        />
                        <p className="text-xs text-gray-400">Student vidi rečenicu, može čuti izgovor, pa govori u mikrofon. Web Speech API poredi izgovor sa tekstom.</p>
                      </div>
                    )}

                    {/* Essay / free-writing editor */}
                    {ex.exercise_type === "listen_write" && (
                      <div className="space-y-3">
                        <textarea
                          value={q.question}
                          onChange={(e) => updateQuestion(q.id, ex.id, "question", e.target.value)}
                          placeholder="Zadatak za studenta (npr: Napiši 3-4 rečenice o svojoj porodici na nemačkom...)"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava resize-none"
                        />
                        <p className="text-xs text-gray-400">AI (Claude) će automatski proveriti gramatiku i dati feedback studentu na srpskom.</p>
                      </div>
                    )}

                    {/* Dialog editor */}
                    {ex.exercise_type === "dialog" && (
                      <div className="space-y-3" spellCheck={false} autoCorrect="off">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Uvod za studenta (srpski)</label>
                          <textarea
                            value={(q.options as Record<string, unknown>)?.intro_text as string || ""}
                            onChange={(e) => updateDialogLocal(q.id, ex.id, "intro_text", e.target.value)}
                            placeholder="Ti si gost u restoranu u Berlinu. Konobar te dočekuje."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava resize-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Situacija</label>
                            <input
                              value={(q.options as Record<string, unknown>)?.scenario as string || ""}
                              onChange={(e) => updateDialogLocal(q.id, ex.id, "scenario", e.target.value)}
                              placeholder="Restoran u Berlinu"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">AI uloga</label>
                            <input
                              value={(q.options as Record<string, unknown>)?.ai_role as string || ""}
                              onChange={(e) => updateDialogLocal(q.id, ex.id, "ai_role", e.target.value)}
                              placeholder="Konobar"
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Nivo</label>
                            <select
                              value={(q.options as Record<string, unknown>)?.level as string || "A1"}
                              onChange={(e) => {
                                const newLevel = e.target.value;
                                const isBasic = newLevel === "A1" || newLevel === "A2";
                                updateDialogLocal(q.id, ex.id, "level", newLevel);
                                updateDialogLocal(q.id, ex.id, "dialog_mode", isBasic ? "guided" : "free");
                                updateDialogLocal(q.id, ex.id, "max_turns", isBasic ? 6 : 8);
                              }}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava"
                            >
                              <option value="A1">A1</option>
                              <option value="A2">A2</option>
                              <option value="B1">B1</option>
                              <option value="B2">B2</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">Tip dijaloga</label>
                            <select
                              value={(q.options as Record<string, unknown>)?.dialog_mode as string || "guided"}
                              onChange={(e) => updateDialogLocal(q.id, ex.id, "dialog_mode", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava"
                            >
                              <option value="guided">Vođeni (ponuđeni odgovori)</option>
                              <option value="free">Slobodni (slobodan tekst)</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Prva poruka AI-ja (nemački)</label>
                          <textarea
                            value={(q.options as Record<string, unknown>)?.opening_message as string || ""}
                            onChange={(e) => updateDialogLocal(q.id, ex.id, "opening_message", e.target.value)}
                            placeholder="Guten Tag! Willkommen im Restaurant. Haben Sie reserviert?"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava resize-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Ciljevi za studenta</label>
                          {((q.options as Record<string, unknown>)?.goals as string[] || [""]).map((goal: string, gi: number) => (
                            <div key={gi} className="flex items-center gap-2 mb-2">
                              <span className="text-xs text-gray-400 w-5">{gi + 1}.</span>
                              <input
                                value={goal}
                                onChange={(e) => {
                                  const opts = (q.options as Record<string, unknown>) || {};
                                  const goals = [...((opts.goals as string[]) || [""])];
                                  goals[gi] = e.target.value;
                                  updateDialogLocal(q.id, ex.id, "goals", goals);
                                }}
                                placeholder="Naruči jelo i piće"
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava"
                              />
                              {((q.options as Record<string, unknown>)?.goals as string[] || []).length > 1 && (
                                <button
                                  onClick={() => {
                                    const opts = (q.options as Record<string, unknown>) || {};
                                    const goals = ((opts.goals as string[]) || []).filter((_: string, i: number) => i !== gi);
                                    updateDialogLocal(q.id, ex.id, "goals", goals);
                                  }}
                                  className="text-koral text-sm"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const opts = (q.options as Record<string, unknown>) || {};
                              const goals = [...((opts.goals as string[]) || []), ""];
                              updateDialogLocal(q.id, ex.id, "goals", goals);
                            }}
                            className="text-sm text-plava hover:underline"
                          >
                            + Dodaj cilj
                          </button>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Dodatne instrukcije za AI (opciono)</label>
                          <textarea
                            value={(q.options as Record<string, unknown>)?.system_prompt_extra as string || ""}
                            onChange={(e) => updateDialogLocal(q.id, ex.id, "system_prompt_extra", e.target.value)}
                            placeholder="Koristi samo Präsens. Meni: Schnitzel, Bratwurst, Salat."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-plava resize-none"
                          />
                        </div>
                        <button
                          onClick={() => saveDialogToDB(q.id, ex.id)}
                          className="w-full py-3 bg-plava text-white rounded-lg hover:bg-plava-dark transition-colors font-medium"
                        >
                          {dialogSaved ? "✓ Sačuvano!" : "Sačuvaj dijalog"}
                        </button>
                        <p className="text-xs text-gray-400">AI (Claude) će igrati ulogu i voditi dijalog sa studentom. Korekcije grešaka se daju na kraju.</p>
                      </div>
                    )}
                  </div>
                ))}

                {ex.exercise_type !== "dialog" && (
                  <button
                    onClick={() => addQuestion(ex.id, ex.exercise_type)}
                    className="w-full py-3 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-plava hover:text-plava transition-colors"
                  >
                    + Dodaj pitanje
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add exercise buttons */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Dodaj novu vežbu:</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(typeLabels).map(([type, label]) => (
            <button
              key={type}
              onClick={() => addExercise(type)}
              className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm text-gray-600 hover:border-plava hover:text-plava transition-colors"
            >
              + {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
