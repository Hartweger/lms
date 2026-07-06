"use client";

import Link from "next/link";
import { useState } from "react";
import type { GrupaRaspored } from "@/lib/raspored";
import {
  EUR_RATE,
  LEVEL_ORDER,
  formatPrice,
  getNivoKey,
  nivoColors,
} from "@/lib/raspored-prikaz";

export default function RasporedKartice({
  grupe: grupeProp,
}: {
  grupe: GrupaRaspored[];
}) {
  const [level, setLevel] = useState<string>("sve");

  // Samo CEFR nivoi - posebni kursevi (npr. "Konverzacija B1+") imaju svoju
  // stranicu/checkout (isti filter kao RasporedGrupa).
  const grupe = grupeProp.filter((g) => LEVEL_ORDER.includes(getNivoKey(g.nivo)));

  if (grupe.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        Trenutno nema otvorenih grupa. Proveri ponovo uskoro.
      </p>
    );
  }

  const available = LEVEL_ORDER.filter((l) =>
    grupe.some((g) => getNivoKey(g.nivo) === l)
  );
  const filtered =
    level === "sve" ? grupe : grupe.filter((g) => getNivoKey(g.nivo) === level);

  const chip = (active: boolean) =>
    `px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
      active
        ? "bg-plava text-white shadow-sm"
        : "bg-white border border-gray-200 text-gray-600 hover:border-plava hover:text-plava"
    }`;

  return (
    <>
      {/* Filter po nivou */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
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
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          {filtered.map((g, i) => (
            <Kartica key={i} g={g} />
          ))}
        </div>
      )}
    </>
  );
}

function Kartica({ g }: { g: GrupaRaspored }) {
  const nivoKey = getNivoKey(g.nivo);
  const colors = nivoColors[nivoKey] ?? { bg: "#f3f4f6", text: "#374151" };
  const eurPrice = g.cenaEur ?? (g.cena != null ? Math.round(g.cena / EUR_RATE) : null);
  const maks = parseInt(g.maks, 10) || 0;
  const upisanih = parseInt(g.upisanih, 10) || 0;
  const isOpen = g.status?.toLowerCase().includes("otvoren");

  return (
    <div className="relative overflow-hidden bg-white border border-gray-200 rounded-2xl hover:shadow-lg transition-all">
      {/* Bočna traka u boji nivoa */}
      <div
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: colors.text }}
        aria-hidden
      />

      <div className="p-5 pl-7 md:p-6 md:pl-8">
        {/* Nivo + status */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <span
            className="px-3.5 py-1.5 rounded-full text-base font-montserrat font-bold"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            {g.nivo}
          </span>
          {g.full ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
              Popunjeno
            </span>
          ) : isOpen ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
              Otvoren za upis
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
              Uskoro
            </span>
          )}
        </div>

        {/* Termini */}
        <div className="space-y-2.5 text-sm text-gray-700 mb-5">
          <div className="flex items-start gap-2.5">
            <IkonicaKalendar />
            <p>
              <span className="font-semibold text-gray-900">{g.daniPuni}</span>
              {g.sat && <span className="text-gray-500"> · {g.sat}</span>}
            </p>
          </div>
          {g.pocetak && (
            <div className="flex items-start gap-2.5">
              <IkonicaSat />
              <p>
                Početak <span className="font-semibold text-gray-900">{g.pocetak}</span>
                {g.trajanje && (
                  <span className="text-gray-500"> · {g.trajanje} nedelja</span>
                )}
              </p>
            </div>
          )}
          {g.prof && (
            <div className="flex items-start gap-2.5">
              <IkonicaOsoba />
              <p>Profesorka {g.prof}</p>
            </div>
          )}
        </div>

        {/* Popunjenost */}
        <div className="flex items-center gap-2.5 mb-5">
          {maks > 0 && maks <= 10 && (
            <div className="flex gap-1" aria-hidden>
              {Array.from({ length: maks }, (_, idx) => (
                <span
                  key={idx}
                  className={`w-2.5 h-2.5 rounded-full ${
                    idx < upisanih ? "bg-plava" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          )}
          <span className="text-xs text-gray-500">
            {g.full
              ? "Sva mesta popunjena"
              : `${g.slobodnih} od ${g.maks} mesta slobodno`}
          </span>
        </div>

        {/* Cena + CTA */}
        <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-4">
          <div>
            {g.cena != null && (
              <p className="text-xl font-montserrat font-bold text-gray-900">
                {formatPrice(g.cena)} din
              </p>
            )}
            {eurPrice != null && <p className="text-xs text-gray-500">~ {eurPrice}€</p>}
          </div>
          {g.full ? (
            <button
              disabled
              className="bg-gray-200 text-gray-500 font-bold py-3 px-6 rounded-xl cursor-not-allowed"
            >
              Popunjeno
            </button>
          ) : g.checkoutSlug ? (
            <Link
              href={`/kursevi/${g.checkoutSlug}`}
              className="bg-koral hover:bg-koral-dark text-white font-bold py-3 px-6 rounded-xl transition-colors whitespace-nowrap"
            >
              Prijavi se
            </Link>
          ) : (
            <Link
              href="/kontakt"
              className="bg-koral hover:bg-koral-dark text-white font-bold py-3 px-6 rounded-xl transition-colors whitespace-nowrap"
            >
              Javi nam se
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function IkonicaKalendar() {
  return (
    <svg className="w-4 h-4 mt-0.5 text-plava flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v9.75" />
    </svg>
  );
}

function IkonicaSat() {
  return (
    <svg className="w-4 h-4 mt-0.5 text-plava flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function IkonicaOsoba() {
  return (
    <svg className="w-4 h-4 mt-0.5 text-plava flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}
