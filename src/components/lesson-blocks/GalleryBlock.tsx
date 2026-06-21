import type { GallerySection } from "@/lib/section-types";

/** Boji početni član (der/die/das) brend plavom. */
function renderDe(de: string) {
  const m = de.match(/^(der|die|das)\s+(.*)$/);
  if (!m) return de;
  return (
    <>
      <span className="text-plava">{m[1]}</span> {m[2]}
    </>
  );
}

export default function GalleryBlock({ title, items }: GallerySection) {
  return (
    <div className="border-l-4 border-plava bg-plava-light rounded-xl p-5 md:p-6">
      {title && <h4 className="font-semibold text-gray-900 mb-4">{title}</h4>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map((it, i) => (
          <div
            key={i}
            className="bg-white border border-gray-100 rounded-xl p-3 text-center flex flex-col items-center"
          >
            {/* SVG ilustracije iz Storage-a - plain img (next/image ne optimizuje SVG) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={it.image}
              alt={it.de}
              loading="lazy"
              className="w-full h-[74px] object-contain mb-2"
            />
            <div className="text-sm font-semibold text-gray-900 leading-tight">
              {renderDe(it.de)}
            </div>
            {it.sr && <div className="text-xs text-gray-500 mt-1">{it.sr}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
