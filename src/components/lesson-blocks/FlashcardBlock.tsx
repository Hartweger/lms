import type { FlashcardSection } from "@/lib/section-types";

export default function FlashcardBlock({ items }: FlashcardSection) {
  return (
    <div className="border-2 border-ljubicasta bg-ljubicasta-light rounded-xl p-5 md:p-6 shadow-md">
      <h4 className="font-semibold text-gray-900 mb-3">Kartice</h4>
      <div className="space-y-2">
        {items.map((item, i) => (
          <details
            key={i}
            className="bg-white rounded-lg p-4 cursor-pointer shadow-sm"
          >
            <summary className="list-none font-semibold text-gray-900 text-center">
              {item.front}
            </summary>
            <p className="mt-3 pt-3 border-t border-gray-200 text-ljubicasta font-bold text-center">
              {item.back}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
