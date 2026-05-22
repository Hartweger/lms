import type { MistakesSection } from "@/lib/section-types";

export default function MistakesBlock({ items }: MistakesSection) {
  return (
    <div className="border-l-4 border-koral bg-koral-light rounded-xl p-5 md:p-6 space-y-3">
      <h4 className="font-semibold text-gray-900">Tipicne greske</h4>
      {items.map((item, i) => (
        <div key={i}>
          <p>
            <span className="line-through text-red-600 opacity-70">
              {item.wrong}
            </span>
            <span className="mx-2 text-gray-400">&rarr;</span>
            <span className="text-green-700 font-bold">{item.correct}</span>
          </p>
          {item.explanation && (
            <p className="text-xs text-gray-500 mt-1">{item.explanation}</p>
          )}
        </div>
      ))}
    </div>
  );
}
