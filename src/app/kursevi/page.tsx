import type { Metadata } from "next";
import KurseviKatalog from "@/components/KurseviKatalog";

export const metadata: Metadata = {
  title: "Kursevi nemačkog jezika - Hartweger",
  description: "Video kursevi, grupna i individualna nastava nemačkog jezika od A1 do C1. Izaberite tip kursa, filtrirajte po nivou i odmah se prijavite.",
  openGraph: {
    images: [{ url: "/og/share.png", width: 1200, height: 630, alt: "Hartweger - Škola nemačkog jezika" }],
    title: "Kursevi nemačkog jezika - Hartweger",
    description: "Video kursevi, grupna i individualna nastava nemačkog jezika od A1 do C1.",
  },
};

export default function KurseviPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-[34px] font-bold tracking-tight text-gray-900 mb-2.5 leading-tight">
          Kursevi HARTWEGER centra
        </h1>
        <p className="text-[17px] text-gray-500 leading-relaxed">
          Izaberi tip kursa, filtriraj po nivou i odmah se prijavi.
        </p>
        {/* Traka poverenja - kredencijal se vezuje za PROGRAM, ne za izvodjenje:
            Natasa licno vodi samo video kurseve, grupne i individualne drze profesorke iz tima. */}
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 mt-4">
          <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-plava rounded-full" />Program licenciranog ispitivača Geteovih i TELC ispita</li>
          <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-plava rounded-full" />20+ godina iskustva</li>
          <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-plava rounded-full" />100% prolaznost na ispitima</li>
          <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-plava rounded-full" />4.000+ polaznika</li>
        </ul>
      </div>
      <KurseviKatalog />
    </div>
  );
}
