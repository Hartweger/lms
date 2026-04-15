"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Question {
  id: string;
  level: string;
  question: string;
  options: string[];
  correct_answer: number;
  order_index: number;
}

function getRecommendedLevel(score: number, total: number): string {
  const percent = (score / total) * 100;
  if (percent < 25) return "A1";
  if (percent < 50) return "A2";
  if (percent < 70) return "B1";
  if (percent < 90) return "B2";
  return "C1";
}

export default function TestNivoa() {
  const supabase = createClient();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("placement_test_questions").select("*").order("order_index");
      if (data) setQuestions(data as Question[]);
      setLoading(false);
    };
    load();
  }, [supabase]);

  const handleAnswer = (optionIndex: number) => {
    const question = questions[currentIndex];
    setAnswers({ ...answers, [question.id]: optionIndex });
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      const finalAnswers = { ...answers, [question.id]: optionIndex };
      let correct = 0;
      questions.forEach((q) => { if (finalAnswers[q.id] === q.correct_answer) correct++; });
      setScore(correct);
      const recommended = getRecommendedLevel(correct, questions.length);
      setLevel(recommended);
      setFinished(true);
      supabase.from("placement_test_results").insert({
        score: correct, total_questions: questions.length, recommended_level: recommended,
      });
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Učitavanje testa...</p></div>;
  if (questions.length === 0) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Test nije još postavljen.</p></div>;

  if (finished) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl font-bold text-plava mb-4">{level}</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Vaš preporučeni nivo</h1>
          <p className="text-gray-500 mb-2">Tačnih odgovora: {score} od {questions.length}</p>
          <p className="text-gray-400 text-sm mb-8">Preporučujemo da počnete sa nivoom {level}.</p>
          <Link href="/" className="inline-block bg-plava text-white px-8 py-3 rounded-lg hover:bg-plava-dark transition-colors">
            Pogledajte kurseve za nivo {level}
          </Link>
        </div>
      </div>
    );
  }

  const question = questions[currentIndex];
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold text-gray-900">Test nivoa</h1>
        <span className="text-sm text-gray-400">{currentIndex + 1} / {questions.length}</span>
      </div>
      <div className="bg-gray-100 rounded-full h-2 mb-8 overflow-hidden">
        <div className="bg-plava h-full rounded-full transition-all duration-300" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <p className="text-lg font-medium text-gray-900 mb-6">{question.question}</p>
        <div className="space-y-3">
          {question.options.map((option, i) => (
            <button key={i} onClick={() => handleAnswer(i)}
              className="w-full text-left px-5 py-4 border-2 border-gray-100 rounded-xl hover:border-plava hover:bg-plava-light transition-colors text-gray-700">
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
