// src/components/hearts/HeartsInfoPopover.tsx
"use client";
import { useState } from "react";

export function HeartsInfoPopover() {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        aria-label="Šta su srca?"
        onClick={() => setOpen((v) => !v)}
        className="w-5 h-5 ml-1 rounded-full bg-plava text-white font-bold text-xs inline-flex items-center justify-center shadow-sm hover:bg-plava-dark"
      >?</button>
      {open && (
        <div className="absolute z-20 mt-2 right-0 w-80 bg-white border border-gray-200 rounded-2xl p-4 shadow-lg text-sm text-gray-700 text-left">
          <h4 className="font-bold mb-2">❤️ Šta su srca?</h4>
          <p className="leading-relaxed">
            Srca su poeni koje skupljaš dok učiš nemački. Svaki tačan odgovor, lekcija i test pune tvoje srce.
            Što redovnije vežbaš — više srca i viši nivo.{" "}
            <em>I ne brini — srca se samo skupljaju, nikad ih ne gubiš!</em> Tvoj meda se raduje svakom srcu 🐻
          </p>
          <ul className="mt-3 space-y-1 list-disc pl-5">
            <li>Tačan odgovor: <b>+10 ❤️</b> (+5 za niz)</li>
            <li>Završena lekcija: <b>+20 ❤️</b></li>
            <li>Položen test: <b>+50 ❤️</b> (+25 za ≥90%)</li>
            <li>Dolazak svaki dan: <b>+10 ❤️</b></li>
          </ul>
          <h4 className="font-bold mt-4 mb-2">🏅 Šta su nivoi?</h4>
          <p className="leading-relaxed">
            Što više srca skupiš, prelaziš na viši <b>Nivo</b>. Nivo nije jezički nivo (A1, A2…) —
            to je tvoj nivo truda i redovnosti, i svaki nosi novu titulu:
          </p>
          <p className="mt-2 text-xs text-gray-600 leading-relaxed">
            Početnik → Radoznali → Marljivi → Vredni → Istrajni → Napredni → Majstor → Šampion → Heroj → Legenda
          </p>
          <p className="mt-2 leading-relaxed">Kad pređeš na viši Nivo, tvoj meda te slavi! 🎉</p>
        </div>
      )}
    </span>
  );
}
