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

export default function BadgeBlock({ module, category, pruefung }: BadgeSection) {
  const mainBg = category ? categoryStyles[category] : "bg-plava";
  const mainText = category
    ? (module ? `${module} · ${categoryLabels[category]}` : categoryLabels[category])
    : module;

  return (
    <span className="inline-flex items-center gap-2 flex-wrap">
      <span className={`inline-block text-white text-xs font-bold px-3 py-1 rounded-full ${mainBg}`}>
        {mainText}
      </span>
      {pruefung && (
        <span className="inline-block text-white text-xs font-bold px-3 py-1 rounded-full bg-gray-900">
          🎯 Prüfung
        </span>
      )}
    </span>
  );
}
