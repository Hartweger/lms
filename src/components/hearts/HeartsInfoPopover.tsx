// src/components/hearts/HeartsInfoPopover.tsx
"use client";
import { useState } from "react";

export function HeartsInfoPopover() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <button
        type="button"
        aria-label="Šta su srca?"
        onClick={() => setOpen(true)}
        className="w-5 h-5 ml-1 rounded-full bg-plava text-white font-bold text-xs inline-flex items-center justify-center shadow-sm hover:bg-plava-dark"
      >
        ?
      </button>
      {open && (
        <>
          {/* poluprovidna pozadina — klik bilo gde zatvara */}
          <div className="fixed inset-0 z-40 bg-black/30" onClick={close} aria-hidden="true" />
          {/* centriran prozor — mobilno-prijateljski */}
          <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm max-h-[80vh] overflow-y-auto bg-white border border-gray-200 rounded-2xl p-5 shadow-xl text-sm text-gray-700 text-left">
            <button
              type="button"
              onClick={close}
              aria-label="Zatvori"
              className="absolute top-2 right-3 w-7 h-7 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 text-xl leading-none inline-flex items-center justify-center"
            >
              ×
            </button>
            <h4 className="font-bold mb-2 pr-6">❤️ Šta su srca?</h4>
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
        </>
      )}
    </>
  );
}
