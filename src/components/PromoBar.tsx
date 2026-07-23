"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Promo traka za Video paket A1+A2+B1: poruke se smenjuju uz blagi fade,
// stalno CTA dugme desno. Prikazuje se samo na javnim stranama.
const DISMISS_KEY = "promo-paket-a1b1-2026-07";
const INTERVAL_MS = 5000;
const FADE_MS = 400;

// Puna poruka za desktop, kratka za mobilni (da traka uvek stane u jedan red).
const PORUKE = [
  { puna: "🇩🇪 Od nule do B1 - kompletna putanja na jednom mestu", kratka: "🇩🇪 Od nule do B1" },
  { puna: "🎬 150+ video lekcija, 11 tipova vežbi i 3 sertifikata", kratka: "🎬 150+ video lekcija" },
  { puna: "📦 Video paket A1+A2+B1 - sve u jednom paketu", kratka: "📦 Sve u jednom paketu" },
];

// Rute na kojima traka NE treba da smeta (aplikacija, učenje, checkout, auth).
const SKRIVENA_NA = [
  "/dashboard",
  "/lekcija",
  "/kurs",
  "/vezba",
  "/profil",
  "/nalog",
  "/admin",
  "/profesor",
  "/prijava",
  "/auth",
  "/kupovina",
];

function shouldShow(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) !== "1";
  } catch {
    return true;
  }
}

export default function PromoBar() {
  const pathname = usePathname();
  // Kreće vidljiva (renderuje se i u SSR HTML-u - instant, bez flash-a za većinu);
  // sakriva se posle hydracije samo ako ju je korisnik već zatvorio.
  const [visible, setVisible] = useState(true);
  const [poruka, setPoruka] = useState(0);
  const [fading, setFading] = useState(false);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!shouldShow()) {
      setVisible(false);
      return;
    }
    // Uz smanjene animacije (prefers-reduced-motion) poruka se ne smenjuje.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = setInterval(() => {
      setFading(true);
      fadeTimer.current = setTimeout(() => {
        setPoruka((p) => (p + 1) % PORUKE.length);
        setFading(false);
      }, FADE_MS);
    }, INTERVAL_MS);

    return () => {
      clearInterval(interval);
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    };
  }, []);

  if (!visible) return null;
  // Poredi po granici segmenta da "/kurs" ne uhvati i javni katalog "/kursevi".
  if (SKRIVENA_NA.some((p) => pathname === p || pathname?.startsWith(p + "/"))) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignoriši ako pisanje nije moguće */
    }
    setVisible(false);
  }

  return (
    <div
      role="region"
      aria-label="Ponuda: Video paket A1 + A2 + B1"
      className="bg-[#FFD130] text-[#1a2332]"
    >
      <div className="max-w-6xl mx-auto pl-4 pr-2 py-2 flex items-center gap-3">
        {/* -my-2/py-2 rasteže tap zonu preko paddinga trake - na telefonu prst
            često promaši sam tekst (18px), ovako je klikabilna cela visina (~48px). */}
        <Link
          href="/kursevi/paket-a1-a2-b1"
          className={`flex-1 min-w-0 self-stretch -my-2 py-2 flex items-center justify-center text-center font-heading font-semibold text-[13px] sm:text-sm leading-snug transition-opacity duration-[400ms] ${
            fading ? "opacity-0" : "opacity-100"
          }`}
        >
          <span className="hidden sm:inline">{PORUKE[poruka].puna}</span>
          <span className="sm:hidden">{PORUKE[poruka].kratka}</span>
        </Link>
        <Link
          href="/kursevi/paket-a1-a2-b1"
          className="shrink-0 bg-[#1a2332] text-white font-semibold text-[13px] sm:text-sm px-4 py-1.5 rounded-md hover:bg-[#2a3648] transition-colors whitespace-nowrap"
        >
          Pogledaj paket →
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Zatvori ponudu"
          className="shrink-0 text-[#1a2332]/60 hover:text-[#1a2332] text-xl leading-none px-1.5 py-1"
        >
          ×
        </button>
      </div>
    </div>
  );
}
