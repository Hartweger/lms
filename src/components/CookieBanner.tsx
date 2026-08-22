"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { CONSENT_EVENT, CONSENT_KEY, type ConsentValue, consentParams, parseConsent } from "@/lib/consent";
import { setPixelConsent } from "@/lib/fbq";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function shouldShowBanner(): boolean {
  try {
    return parseConsent(localStorage.getItem(CONSENT_KEY)) === null;
  } catch {
    // localStorage nedostupan (npr. privatni režim) - ne prikazuj banner
    return false;
  }
}

// Saglasnost živi u localStorage-u, van Reacta. Vrednost se ne menja sama od
// sebe (samo kroz choose() ispod), pa je subscribe no-op; serverski snapshot je
// false da SSR HTML ne sadrži banner i da nema hydration mismatch-a.
const bezPretplate = () => () => {};

export default function CookieBanner() {
  const nemaSaglasnosti = useSyncExternalStore(bezPretplate, shouldShowBanner, () => false);
  // Korisnička akcija nadjačava localStorage: null = nije bilo akcije,
  // true = footer je ponovo otvorio banner, false = upravo je izabrano.
  const [rucno, setRucno] = useState<boolean | null>(null);
  const visible = rucno ?? nemaSaglasnosti;

  useEffect(() => {
    // Footer "Podešavanja kolačića" ponovo otvara banner
    function reopen() {
      setRucno(true);
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
    // Isto i za Meta Pixel - grant odmršava queue (PageView i sl.), revoke ga zaustavlja
    setPixelConsent(value === "granted");
    setRucno(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Saglasnost za kolačiće"
      className="fixed inset-x-0 bottom-0 z-50 bg-[#1a2332] text-gray-200 shadow-2xl"
    >
      {/* Na telefonu je ova traka merila ~400px od 812px ekrana - pola prvog
          ekrana svake ulazne strane, pa je ponuda ostajala iza nje. Tekst se NE
          skraćuje (svrha obrade i pravo izbora moraju da stoje), nego se zbija:
          sitnije slovo, uži prored i manje vazduha. Od sm: naviše sve ostaje
          kako je i bilo. */}
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <p className="text-[13px] leading-snug sm:text-sm sm:leading-relaxed flex-1">
          Uz tvoju saglasnost pratimo kako se sajt koristi da bismo ti prikazali pravi sadržaj i
          stalno unapređivali časove i platformu. Neophodni kolačići rade uvek; analitičke i
          marketinške postavljamo samo ako prihvatiš. Detaljnije u{" "}
          <Link href="/uslovi#politika-privatnosti" className="underline text-plava hover:text-white">
            politici privatnosti
          </Link>
          .
        </p>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            type="button"
            onClick={() => choose("denied")}
            className="px-3 py-2 rounded-md text-sm text-gray-400 hover:text-white hover:underline transition-colors"
          >
            Odbijam
          </button>
          <button
            type="button"
            onClick={() => choose("granted")}
            className="px-6 py-2.5 rounded-md bg-plava text-white text-sm font-semibold shadow-md hover:opacity-90 transition-opacity"
          >
            Prihvatam
          </button>
        </div>
      </div>
    </div>
  );
}
