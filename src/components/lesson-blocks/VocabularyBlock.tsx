"use client";

import type { VocabularySection } from "@/lib/section-types";
import SpeakButton from "@/components/SpeakButton";

export default function VocabularyBlock({ rows }: VocabularySection) {
  return (
    <div className="border-l-4 border-narandzasta bg-narandzasta-light rounded-xl p-5 md:p-6">
      <h4 className="font-semibold text-gray-900 mb-3">Vokabular</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left px-3 py-2 text-gray-500 font-medium border-b border-orange-200">
                Nemački
              </th>
              <th className="text-left px-3 py-2 text-gray-500 font-medium border-b border-orange-200">
                Prevod
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 1 ? "bg-white/50" : ""}>
                <td className="px-3 py-2 font-semibold text-gray-900">
                  <span className="inline-flex items-center gap-2">
                    {row[0]}
                    <SpeakButton text={row[0]} />
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-500 italic">{row[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
