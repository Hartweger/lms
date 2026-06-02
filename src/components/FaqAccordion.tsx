"use client";

import { useState } from "react";
import Link from "next/link";
import type { FaqItem } from "@/lib/types";

// Renderuje odgovor sa markdown linkovima [tekst](url):
// interne putanje (/...) idu kroz next/link, eksterne i mailto kroz <a>.
function renderAnswer(text: string) {
  const parts: React.ReactNode[] = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const [, label, href] = m;
    const cls = "text-plava font-medium hover:underline";
    if (href.startsWith("/")) {
      parts.push(<Link key={key++} href={href} className={cls}>{label}</Link>);
    } else {
      parts.push(<a key={key++} href={href} className={cls}>{label}</a>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className="border border-gray-200 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => toggle(item.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left font-medium text-gray-900 hover:bg-gray-50 transition-colors"
              aria-expanded={isOpen}
            >
              <span>{item.question}</span>
              <svg
                className={`w-5 h-5 shrink-0 ml-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {isOpen && (
              <div className="px-5 pb-4 text-gray-600 leading-relaxed">
                {renderAnswer(item.answer)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
