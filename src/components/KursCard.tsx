import Link from "next/link";

export interface KursCardData {
  badges: { label: string; color: string }[];
  title: string;
  meta: string;
  desc: string;
  price: string;
  priceEur: string;
  oldPrice?: string;
  salePrice?: string;
  salePriceEur?: string;
  saveAmount?: string;
  href: string;
  cta: string;
  level: string;
  accent?: boolean;
  freeCta?: boolean;
}

export const badgeColors: Record<string, string> = {
  a1: "bg-sky-100 text-sky-700",
  a2: "bg-sky-50 text-sky-800",
  b1: "bg-amber-50 text-amber-700",
  b2: "bg-red-50 text-red-600",
  c1: "bg-pink-50 text-pink-700",
  video: "bg-red-50 text-red-600",
  paket: "bg-gray-900 text-white",
  spec: "bg-[#F78687] text-white",
  ind: "bg-blue-50 text-blue-700",
  master: "bg-gray-900 text-white",
  gram: "bg-blue-50 text-blue-700",
  novo: "bg-[#F78687] text-white",
  sale: "bg-[#F78687] text-white",
  free: "bg-sky-100 text-[#0AB3D7]",
  ai: "bg-[#0AB3D7] text-white",
  fide: "bg-gray-900 text-white",
};

export default function KursCard({ card }: { card: KursCardData }) {
  return (
    <div
      className={`border rounded-2xl p-6 flex flex-col gap-3 transition-all hover:-translate-y-0.5 ${
        card.accent
          ? "border-[#F78687] bg-gradient-to-br from-red-50/50 to-white hover:shadow-lg hover:shadow-[#F78687]/10"
          : "border-gray-200 bg-white hover:border-[#0AB3D7] hover:shadow-lg hover:shadow-[#0AB3D7]/10"
      }`}
    >
      {/* Badges */}
      <div className="flex gap-1.5 flex-wrap">
        {card.badges.map((b, j) => (
          <span
            key={j}
            className={`text-xs font-bold px-3 py-1 rounded-full tracking-wide ${badgeColors[b.color] || "bg-gray-100 text-gray-600"}`}
          >
            {b.label}
          </span>
        ))}
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-gray-900 leading-snug">{card.title}</h3>

      {/* Meta */}
      <p className="text-[13px] text-gray-400">{card.meta}</p>

      {/* Description */}
      <p className="text-sm text-gray-500 leading-relaxed flex-1">{card.desc}</p>

      {/* Footer */}
      <div className="flex justify-between items-center pt-3.5 border-t border-gray-100 mt-auto gap-3">
        {card.salePrice ? (
          <div>
            <p className="text-[13px] text-gray-300 line-through">{card.oldPrice}</p>
            <p className="text-lg font-bold text-[#0AB3D7]">{card.salePrice}</p>
            <p className="text-xs font-bold text-[#F78687]">{card.salePriceEur}</p>
            <span className="inline-block mt-1 text-[11px] font-bold bg-[#F78687] text-white px-2.5 py-0.5 rounded-lg">
              {card.saveAmount}
            </span>
          </div>
        ) : (
          <div>
            <p className="text-[17px] font-bold text-gray-900">{card.price}</p>
            {card.priceEur && <p className="text-xs font-bold text-[#F78687] mt-0.5">{card.priceEur}</p>}
          </div>
        )}
        <Link
          href={card.href}
          className={`flex-shrink-0 px-5 py-3 rounded-[10px] text-sm font-bold transition-all hover:-translate-y-px min-h-[46px] flex items-center ${
            card.freeCta
              ? "bg-[#0AB3D7] text-white hover:bg-[#089ab9]"
              : "bg-[#F78687] text-white hover:bg-[#e06060]"
          }`}
        >
          {card.cta}
        </Link>
      </div>
    </div>
  );
}
