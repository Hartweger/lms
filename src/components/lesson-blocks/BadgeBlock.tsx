import type { BadgeSection, BadgeCategory } from "@/lib/section-types";

const categoryStyles: Record<BadgeCategory, string> = {
  grammatik: "bg-plava",
  lesen: "bg-zelena",
  hoeren: "bg-ljubicasta",
  schreiben: "bg-koral",
};

const categoryLabels: Record<BadgeCategory, string> = {
  grammatik: "Gramatika",
  lesen: "Lesen",
  hoeren: "Horen",
  schreiben: "Schreiben",
};

export default function BadgeBlock({ module, category }: BadgeSection) {
  return (
    <span
      className={`inline-block text-white text-xs font-bold px-3 py-1 rounded-full ${categoryStyles[category]}`}
    >
      {module} · {categoryLabels[category]}
    </span>
  );
}
