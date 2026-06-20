"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Privremena traka tokom prelaznog perioda (migracija sa starog WP/LearnDash).
// Ukloniti (ili obrisati render iz layout-a) kad se stari WP ugasi.
const DISMISS_KEY = "migracija-obavestenje-2026-06";
// Datum do kog stari napredak ostaje dostupan na old. - promeni ako se prelazni period pomeri.
const ROK = "8. jula 2026.";

function shouldShow(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) !== "1";
  } catch {
    return true;
  }
}

export default function MigracijaBanner() {
  // Kreće vidljiva (renderuje se i u SSR HTML-u - instant, bez flash-a za većinu);
  // sakriva se posle hydracije samo ako ju je korisnik već zatvorio.
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!shouldShow()) setVisible(false);
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignoriši ako pisanje nije moguće */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div role="region" aria-label="Obaveštenje o novoj platformi" className="bg-[#4fb1d3] text-white">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-start sm:items-center gap-3">
        <p className="text-sm leading-snug flex-1">
          <span className="inline-block bg-white/20 text-white text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded mr-2 align-middle">
            ℹ️ Postojeći polaznici
          </span>
          <span className="font-semibold">Prešli smo na novu platformu.</span>{" "}
          Tvoj nalog i kursevi su ovde - prijaviš se preko{" "}
          <span className="font-semibold">„Nastavi sa Google"</span> ili emailom i lozinkom (nemaš
          lozinku? na strani za prijavu klikni „Napravi je"). Ako si bio/la na pola kursa, raniji
          napredak je sačuvan na{" "}
          <a
            href="https://old.hartweger.rs/moj-nalog/"
            className="underline font-semibold hover:text-[#1a2332]"
          >
            old.hartweger.rs
          </a>{" "}
          (do {ROK}).
        </p>
        <Link
          href="/prijava"
          className="shrink-0 bg-white text-[#0f7390] font-semibold text-sm px-4 py-1.5 rounded-md hover:bg-white/90 transition-colors whitespace-nowrap"
        >
          Uloguj se →
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Zatvori obaveštenje"
          className="shrink-0 text-white/90 hover:text-white text-xl leading-none px-1"
        >
          ×
        </button>
      </div>
    </div>
  );
}
