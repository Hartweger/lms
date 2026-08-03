"use client";

import { useSyncExternalStore } from "react";

// Prepoznavanje uređaja i PWA režima za uputstva "Dodaj na početni ekran".
// Vrednosti se čitaju kroz useSyncExternalStore, ne kroz useEffect + setState:
// stranice se prerenderuju na serveru, pa React tokom hidracije uzima server
// snapshot i sam bezbedno prelazi na klijentsku vrednost.
export type Uredjaj = "ios" | "android" | "ostalo";

// Vrednosti se ne menjaju tokom života stranice, pa je subscribe no-op.
const bezPretplate = () => () => {};

export function detektujUredjaj(): Uredjaj {
  const ua = navigator.userAgent;
  // iPadOS se predstavlja kao Macintosh, ali ima touch ekran
  const ios =
    /iPhone|iPad|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (ios) return "ios";
  if (/Android/.test(ua)) return "android";
  return "ostalo";
}

export function jeInstalirano(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as { standalone?: boolean }).standalone === true)
  );
}

const uredjajNaServeru = (): Uredjaj => "ostalo";
const instaliranoNaServeru = () => false;

export function useUredjaj(): Uredjaj {
  return useSyncExternalStore(bezPretplate, detektujUredjaj, uredjajNaServeru);
}

export function useJeInstalirano(): boolean {
  return useSyncExternalStore(bezPretplate, jeInstalirano, instaliranoNaServeru);
}
