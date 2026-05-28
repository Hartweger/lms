import type { Metadata } from "next";
import KurseviKatalog from "@/components/KurseviKatalog";

export const metadata: Metadata = {
  title: "Kursevi nemačkog jezika — Hartweger",
  description:
    "Video kursevi, grupna i individualna nastava nemačkog jezika od A1 do C1. Izaberite tip kursa, filtrirajte po nivou i odmah se prijavite.",
};

export default function KurseviPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-[34px] font-bold tracking-tight text-gray-900 mb-2.5 leading-tight">
          Kursevi HARTWEGER centra
        </h1>
        <p className="text-[17px] text-gray-500 leading-relaxed">
          Izaberite tip kursa, filtrirajte po nivou i odmah se prijavite.
        </p>
      </div>
      <KurseviKatalog />
    </div>
  );
}
