import type { PdfSection } from "@/lib/section-types";

export default function PdfBlock({ url, label }: PdfSection) {
  return (
    <div>
      <div className="rounded-xl overflow-hidden border border-gray-100">
        <iframe
          src={url}
          className="w-full hidden md:block"
          style={{ height: "600px" }}
          title={label || "PDF dokument"}
        />
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 mt-3 text-sm text-plava hover:underline"
      >
        Otvori PDF u novom prozoru
      </a>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="md:hidden block mt-2 bg-red-600 text-white text-center py-3 rounded-lg text-sm font-semibold"
      >
        {label || "Otvori PDF"}
      </a>
    </div>
  );
}
