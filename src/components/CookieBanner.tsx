"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CONSENT_EVENT, CONSENT_KEY, type ConsentValue, consentParams, parseConsent } from "@/lib/consent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function shouldShowBanner(): boolean {
  try {
    return parseConsent(localStorage.getItem(CONSENT_KEY)) === null;
  } catch {
    // localStorage nedostupan (npr. privatni režim) — ne prikazuj banner
    return false;
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(shouldShowBanner());
    // Footer "Podešavanja kolačića" ponovo otvara banner
    function reopen() {
      setVisible(true);
    }
    window.addEventListener(CONSENT_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_EVENT, reopen);
  }, []);

  function choose(value: ConsentValue) {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {
      // ignoriši ako pisanje nije moguće
    }
    // Šaljemo update za obe opcije: "denied" je bitan kod povlačenja ranije date saglasnosti
    window.gtag?.("consent", "update", consentParams(value));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Saglasnost za kolačiće"
      className="fixed inset-x-0 bottom-0 z-50 bg-[#1a2332] text-gray-200 shadow-2xl"
    >
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <p className="text-sm leading-relaxed flex-1">
          Koristimo kolačiće da bismo poboljšali tvoje iskustvo i razumeli kako se sajt koristi.
          Neophodni kolačići su uvek uključeni. Analitičke i marketinške kolačiće postavljamo samo
          uz tvoju saglasnost. Više u{" "}
          <Link href="/politika-privatnosti" className="underline text-plava hover:text-white">
            politici privatnosti
          </Link>
          .
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            type="button"
            onClick={() => choose("denied")}
            className="px-4 py-2 rounded-md border border-gray-500 text-sm hover:bg-gray-700 transition-colors"
          >
            Odbijam
          </button>
          <button
            type="button"
            onClick={() => choose("granted")}
            className="px-4 py-2 rounded-md bg-plava text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Prihvatam
          </button>
        </div>
      </div>
    </div>
  );
}
