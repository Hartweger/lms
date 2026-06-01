"use client";

import { useState } from "react";
import KursCard, { type KursCardData } from "@/components/KursCard";

const LEVELS = [
  { id: "a1", label: "A1" },
  { id: "a2", label: "A2" },
  { id: "b1", label: "B1" },
  { id: "b2", label: "B2" },
  { id: "paket", label: "Paketi" },
  { id: "spec", label: "Specijalni" },
];

export default function IndividualniPonuda({ cards }: { cards: KursCardData[] }) {
  const [lvl, setLvl] = useState("sve");

  const available = LEVELS.filter((l) => cards.some((c) => c.level === l.id));
  const filtered = lvl === "sve" ? cards : cards.filter((c) => c.level === lvl);

  const chip = (active: boolean) =>
    `px-5 py-2.5 rounded-full border-2 text-sm font-semibold transition-all min-h-[44px] ${
      active
        ? "bg-[#0AB3D7] text-white border-[#0AB3D7]"
        : "bg-white text-gray-500 border-gray-200 hover:border-[#0AB3D7] hover:text-[#0AB3D7]"
    }`;

  return (
    <>
      <div className="flex gap-2 flex-wrap justify-center mb-7">
        <button onClick={() => setLvl("sve")} className={chip(lvl === "sve")}>
          Svi
        </button>
        {available.map((l) => (
          <button key={l.id} onClick={() => setLvl(l.id)} className={chip(lvl === l.id)}>
            {l.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
        {filtered.map((c, i) => (
          <KursCard key={i} card={c} />
        ))}
      </div>
    </>
  );
}
