// src/app/test-nivoa/components/QuizResult.tsx

import type { BlockScore, TestResult } from "../lib/scoring";
import { getRecommendation, type CourseOption } from "../lib/recommendations";

interface QuizResultProps {
  result: TestResult;
  showFull: boolean;  // false = basic, true = full (after email)
  onRequestEmail?: () => void;  // go back to email form
}

function ScoreBar({ score }: { score: BlockScore }) {
  const pct = (score.correct / score.total) * 100;
  const color = pct >= 80 ? "bg-zelena" : pct >= 40 ? "bg-narandzasta" : "bg-koral";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-600 w-12">{score.level}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-3">
        <div className={`${color} rounded-full h-3 transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm text-gray-500 w-12 text-right">{score.correct}/{score.total}</span>
    </div>
  );
}

function CourseCard({ course }: { course: CourseOption }) {
  const icons = { grupni: "👥", video: "📹", individualni: "👤" };
  return (
    <a
      href={course.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-plava hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between mb-1">
        <div>
          <span className="text-lg mr-2">{icons[course.type]}</span>
          <span className="font-semibold text-gray-900">{course.label}</span>
        </div>
        <span className="text-plava font-bold">{course.price}</span>
      </div>
      <p className="text-sm text-gray-500 ml-8">{course.subtitle}</p>
    </a>
  );
}

export default function QuizResult({ result, showFull, onRequestEmail }: QuizResultProps) {
  const rec = getRecommendation(result.recommendedLevel);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">🎯</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Tvoj nivo: {result.recommendedLevel}
        </h2>
        <p className="text-gray-600">
          {result.totalCorrect} od {result.totalQuestions} tačnih odgovora
        </p>
      </div>

      {/* Score breakdown */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">Rezultat po nivoima</h3>
        <div className="space-y-3">
          {result.scores.map((score) => (
            <ScoreBar key={score.level} score={score} />
          ))}
        </div>
      </div>

      {showFull ? (
        <>
          {/* Recommendation */}
          <div className="bg-plava-light rounded-xl p-6 mb-8 border border-plava/20">
            <h3 className="font-bold text-gray-900 text-xl mb-2">{rec.title}</h3>
            <p className="text-gray-600 mb-6">{rec.description}</p>
            <div className="space-y-3">
              {rec.courses.map((course) => (
                <CourseCard key={course.type} course={course} />
              ))}
            </div>
          </div>

          {/* Nataša's message */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-plava text-white flex items-center justify-center font-bold text-sm shrink-0">
                NH
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Nataša Hartweger</p>
                <p className="text-gray-600 text-sm">
                  Hvala ti što si odvojio/la vreme za test! Ako te bilo šta zanima o kursevima ili učenju nemačkog - slobodno mi piši na{" "}
                  <a href="mailto:info@hartweger.rs" className="text-plava hover:underline">info@hartweger.rs</a>. Rado ću pomoći.
                </p>
              </div>
            </div>
          </div>

          {/* Secondary CTA */}
          <div className="text-center">
            <a
              href="https://www.hartweger.rs/kursevi-nemackog/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-plava hover:underline font-medium"
            >
              Pogledaj sve kurseve →
            </a>
          </div>
        </>
      ) : (
        /* Blurred teaser for non-email users */
        <div className="relative">
          <div className="blur-sm pointer-events-none">
            <div className="bg-plava-light rounded-xl p-6 mb-8 border border-plava/20">
              <h3 className="font-bold text-gray-900 text-xl mb-2">Tvoja preporuka...</h3>
              <p className="text-gray-600">Detaljna analiza i preporuke kurseva sa cenama...</p>
              <div className="h-32 bg-gray-100 rounded-xl mt-4" />
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            {onRequestEmail ? (
              <button
                onClick={onRequestEmail}
                className="bg-plava text-white px-6 py-3 rounded-xl font-medium hover:bg-plava-dark transition-colors shadow-lg"
              >
                Otključaj detaljnu analizu →
              </button>
            ) : (
              <p className="text-gray-500 text-sm bg-white px-4 py-2 rounded-lg shadow">
                Unesi email da vidiš detaljnu analizu
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
