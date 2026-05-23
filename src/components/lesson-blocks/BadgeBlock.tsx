import type { BadgeSection, BadgeCategory } from "@/lib/section-types";

const categoryStyles: Record<BadgeCategory, string> = {
  grammatik: "bg-plava",
  lesen: "bg-zelena",
  hoeren: "bg-ljubicasta",
  schreiben: "bg-koral",
  wortschatz: "bg-narandzasta",
};

const categoryLabels: Record<BadgeCategory, string> = {
  grammatik: "Gramatika",
  lesen: "Lesen",
  hoeren: "Hören",
  schreiben: "Schreiben",
  wortschatz: "Wortschatz",
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
