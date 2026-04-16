"use client";

import { useState } from "react";
import Link from "next/link";

interface LessonItem {
  id: string;
  title: string;
  order_index: number;
  completed: boolean;
}

interface LessonDrawerProps {
  courseTitle: string;
  lessons: LessonItem[];
  currentLessonId: string;
  totalLessons: number;
  completedCount: number;
}

export default function LessonDrawer({
  courseTitle,
  lessons,
  currentLessonId,
  totalLessons,
  completedCount,
}: LessonDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="text-plava font-bold text-sm flex items-center gap-1"
      >
        ☰ Lekcije
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-4/5 max-w-sm bg-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-bold text-base text-gray-900 truncate pr-2">
            {courseTitle}
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 text-xl p-1 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Progress */}
        <div className="px-4 py-3">
          <div className="bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-plava h-full rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            {completedCount} od {totalLessons} lekcija završeno
          </p>
        </div>

        {/* Lesson List */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 120px)" }}>
          {lessons.map((lesson, i) => {
            const isCurrent = lesson.id === currentLessonId;
            const isCompleted = lesson.completed;

            return (
              <Link
                key={lesson.id}
                href={`/lekcija/${lesson.id}`}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm border-l-4 transition-colors ${
                  isCurrent
                    ? "bg-blue-50 border-plava"
                    : isCompleted
                    ? "bg-green-50 border-l-transparent"
                    : "border-l-transparent hover:bg-gray-50"
                }`}
              >
                <span className="shrink-0">
                  {isCompleted ? (
                    <span className="text-green-500 font-bold">✓</span>
                  ) : isCurrent ? (
                    <span className="text-plava font-bold">▶</span>
                  ) : (
                    <span className="text-gray-300">○</span>
                  )}
                </span>
                <div className="min-w-0">
                  <span
                    className={`block truncate ${
                      isCurrent
                        ? "font-bold text-plava"
                        : isCompleted
                        ? "text-gray-700"
                        : "text-gray-400"
                    }`}
                  >
                    {i + 1}. {lesson.title}
                  </span>
                  {isCurrent && (
                    <span className="text-xs text-gray-400">Trenutna lekcija</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
