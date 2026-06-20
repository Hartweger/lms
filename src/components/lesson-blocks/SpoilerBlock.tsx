import type { SpoilerSection } from "@/lib/section-types";

export default function SpoilerBlock({ title, items }: SpoilerSection) {
  return (
    <div className="border-l-4 border-koral bg-koral-light rounded-xl p-5 md:p-6">
      {title && (
        <h4 className="font-semibold text-gray-900 mb-3">{title}</h4>
      )}
      <div className="space-y-2">
        {items.map((item, i) => (
          <details
            key={i}
            className="bg-gray-100 rounded-lg p-3 md:p-4 cursor-pointer"
          >
            <summary className="text-sm text-gray-700 list-none">
              <p className="whitespace-pre-line">{item.question}</p>
              <p className="mt-1 text-xs text-gray-400">Klikni za rešenje</p>
            </summary>
            <p className="mt-2 pt-2 border-t border-gray-300 text-green-700 font-bold text-sm whitespace-pre-line">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
