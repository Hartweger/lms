"use client";

import { useSyncExternalStore } from "react";

// Prepoznaje uređaj i prikazuje samo relevantno uputstvo za "Dodaj na početni
// ekran". Ako je aplikacija već instalirana (standalone), sekcija se ne prikazuje.
type Uredjaj = "ios" | "android" | "ostalo";

// Vrednosti se ne menjaju tokom života stranice, pa je subscribe no-op.
const bezPretplate = () => () => {};

function detektujUredjaj(): Uredjaj {
  const ua = navigator.userAgent;
  // iPadOS se predstavlja kao Macintosh, ali ima touch ekran
  const ios =
    /iPhone|iPad|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (ios) return "ios";
  if (/Android/.test(ua)) return "android";
  return "ostalo";
}

function jeInstalirano(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as { standalone?: boolean }).standalone === true)
  );
}

export default function DodajNaEkran() {
  const uredjaj = useSyncExternalStore<Uredjaj>(bezPretplate, detektujUredjaj, () => "ostalo");
  const instalirano = useSyncExternalStore(bezPretplate, jeInstalirano, () => false);

  if (instalirano) return null;

  const iphone = (
    <div>
      <p className="font-semibold text-nh-dark">iPhone (Safari)</p>
      <p>
        Dugme <span className="font-semibold">Podeli</span> (kvadrat sa strelicom) →{" "}
        <span className="font-semibold">Dodaj na početni ekran</span>
      </p>
    </div>
  );

  const android = (
    <div>
      <p className="font-semibold text-nh-dark">Android (Chrome)</p>
      <p>
        Meni <span className="font-semibold">⋮</span> →{" "}
        <span className="font-semibold">Dodaj na početni ekran</span>
      </p>
    </div>
  );

  return (
    <section className="rounded-xl border border-nh-pink-light bg-white p-6">
      <h2 className="font-heading text-xl font-bold text-nh-dark">📱 Dodaj na početni ekran</h2>
      <p className="mt-1 text-nh-dark/70">
        Članstvo radi i kao aplikacija — dodaš ikonicu na telefon i sve ti je na jedan dodir.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm text-nh-dark/80">
        {uredjaj === "ios" && iphone}
        {uredjaj === "android" && android}
        {uredjaj === "ostalo" && (
          <>
            {iphone}
            {android}
          </>
        )}
      </div>
    </section>
  );
}
