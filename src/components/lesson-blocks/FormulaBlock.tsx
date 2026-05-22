import type { FormulaSection } from "@/lib/section-types";

export default function FormulaBlock({ content }: FormulaSection) {
  return (
    <div className="bg-plava-light border-2 border-dashed border-plava rounded-lg p-4 md:p-5 text-center font-mono text-gray-900 leading-relaxed">
      {content.split("\n").map((line, i) => (
        <span key={i}>
          {line}
          {i < content.split("\n").length - 1 && <br />}
        </span>
      ))}
    </div>
  );
}
