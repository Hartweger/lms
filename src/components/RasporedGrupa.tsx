"use client";

import Link from "next/link";
import { useState } from "react";
import type { GrupaRaspored } from "@/lib/raspored";

const nivoColors: Record<string, { bg: string; text: string }> = {
  A1: { bg: "#e0f6fb", text: "#0776a0" },
  A2: { bg: "#d6f0f9", text: "#065e88" },
  B1: { bg: "#fef3e2", text: "#7a4800" },
  B2: { bg: "#fde8e8", text: "#b52a2a" },
  C1: { bg: "#fde4f0", text: "#952060" },
};

const nivoPrices: Record<string, number> = {
  A1: 19600,
  A2: 19600,
  B1: 19600,
  B2: 21200,
  C1: 21200,
};

const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1"];

function formatPrice(price: number): string {
  return price.toLocaleString("de-DE");
}

function getNivoKey(nivo: string): string {
  // Extract level like "A1", "B2" from strings like "A1.1", "B2.2"
  return nivo.substring(0, 2).toUpperCase();
}

export default function RasporedGrupa({
  grupe: grupeProp,
}: {
  grupe: GrupaRaspored[];
}) {
  const [level, setLevel] = useState<string>("sve");

  // Prikazuj samo CEFR nivoe (A1-C1). Posebni kursevi (npr. "Konverzacija B1+")
  // imaju svoju cenu/checkout i prodaju se iz kataloga, pa ih ovde izostavljamo
  // da ne dobiju pogrešnu cenu/pokvaren link (getNivoKey čita prva 2 slova).
  const grupe = grupeProp.filter((g) => LEVEL_ORDER.includes(getNivoKey(g.nivo)));

  if (grupe.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        Trenutno nema otvorenih grupa. Proverite ponovo uskoro.
      </p>
    );
  }

  // Samo nivoi koji stvarno postoje u rasporedu, po redosledu A1→C1
  const available = LEVEL_ORDER.filter((l) =>
    grupe.some((g) => getNivoKey(g.nivo) === l)
  );
  const filtered =
    level === "sve" ? grupe : grupe.filter((g) => getNivoKey(g.nivo) === level);

  const chip = (active: boolean) =>
    `px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
      active
        ? "bg-plava text-white"
        : "bg-white border border-gray-200 text-gray-600 hover:border-plava hover:text-plava"
    }`;

  return (
    <>
      {/* Filter po nivou */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setLevel("sve")} className={chip(level === "sve")}>
          Svi nivoi
        </button>
        {available.map((l) => (
          <button key={l} onClick={() => setLevel(l)} className={chip(level === l)}>
            {l}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          Trenutno nema termina za ovaj nivo. Probaj drugi nivo ili nas kontaktiraj.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          {filtered.map((g, i) => {
            const nivoKey = getNivoKey(g.nivo);
            const colors = nivoColors[nivoKey] ?? { bg: "#f3f4f6", text: "#374151" };
            const price = nivoPrices[nivoKey] ?? 19600;
            const eurPrice = Math.round(price / 117);
            const slobodnih = parseInt(g.slobodnih, 10);
            const isFull = slobodnih <= 0;
            const isOpen = g.status?.toLowerCase().includes("otvoren");

            return (
              <div
                key={i}
                className="border border-gray-200 rounded-2xl p-4 md:p-6 bg-white hover:border-plava hover:shadow-md transition-all"
              >
                {/* Header: nivo badge + status */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="px-3 py-1 rounded-full text-sm font-bold"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {g.nivo}
                  </span>

                  {isFull ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                      Popunjeno
                    </span>
                  ) : isOpen ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                      Otvoren za upis
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border-l-2 border-yellow-400">
                      Uskoro
                    </span>
                  )}
                </div>

                {/* Schedule details */}
                <div className="space-y-2 text-sm text-gray-700 mb-4">
                  <p>
                    <span className="font-medium">Dani:</span> {g.dani}, {g.sat}
                  </p>
                  <p>
                    <span className="font-medium">Početak:</span> {g.pocetak}
                    {g.trajanje && ` · ${g.trajanje}`}
                  </p>
                  <p>
                    <span className="font-medium">Profesor:</span> {g.prof}
                  </p>
                  <p>
                    <span className="font-medium">Mesta:</span>{" "}
                    {isFull ? (
                      <span className="text-red-600 font-bold">Popunjeno</span>
                    ) : (
                      `${g.slobodnih} od ${g.maks} mesta`
                    )}
                  </p>
                </div>

                {/* Price */}
                <div className="border-t border-gray-100 pt-4 mb-4">
                  <p className="text-xl font-bold text-gray-900">
                    {formatPrice(price)} din
                  </p>
                  <p className="text-xs text-gray-500">~ {eurPrice}€</p>
                </div>

                {/* CTA */}
                {isFull ? (
                  <button
                    disabled
                    className="w-full text-center bg-gray-200 text-gray-500 font-bold py-3 px-6 rounded-xl cursor-not-allowed"
                  >
                    Popunjeno
                  </button>
                ) : (
                  <Link
                    href={`/kupovina/grupni-${nivoKey.toLowerCase()}`}
                    className="block w-full text-center bg-koral hover:bg-koral-dark text-white font-bold py-3 px-6 rounded-xl transition-colors"
                  >
                    Prijavi se
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
