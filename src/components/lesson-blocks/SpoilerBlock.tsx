"use client";

import { useState } from "react";
import type { SpoilerSection } from "@/lib/section-types";

function SpoilerItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className="w-full text-left bg-gray-100 hover:bg-gray-200 rounded-lg p-3 md:p-4 transition-colors"
    >
      <p className="text-sm text-gray-700">{question}</p>
      {open && (
        <p className="mt-2 pt-2 border-t border-gray-300 text-green-700 font-bold text-sm">
          {answer}
        </p>
      )}
      {!open && (
        <p className="mt-1 text-xs text-gray-400">Klikni za resenje</p>
      )}
    </button>
  );
}

export default function SpoilerBlock({ title, items }: SpoilerSection) {
  return (
    <div className="border-l-4 border-koral bg-koral-light rounded-xl p-5 md:p-6">
      {title && (
        <h4 className="font-semibold text-gray-900 mb-3">{title}</h4>
      )}
      <div className="space-y-2">
        {items.map((item, i) => (
          <SpoilerItem key={i} question={item.question} answer={item.answer} />
        ))}
      </div>
    </div>
  );
}
