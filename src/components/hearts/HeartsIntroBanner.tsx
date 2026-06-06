// src/components/hearts/HeartsIntroBanner.tsx
"use client";
import { useCallback, useSyncExternalStore } from "react";
import { LEVEL_TITLES } from "@/lib/hearts/config";

const KEY = "hearts_intro_dismissed_v1";
const EVENT = "hearts_intro_dismissed";

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}

function getSnapshot() {
  try {
    return localStorage.getItem(KEY) !== "1";
  } catch {
    return true;
  }
}

export function HeartsIntroBanner() {
  // Server renders nothing (getServerSnapshot=false); client reads the
  // dismissed flag after hydration — no SSR/client mismatch.
  const show = useSyncExternalStore(subscribe, getSnapshot, () => false);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  if (!show) return null;

  return (
    <div className="relative bg-plava-light border border-plava/30 rounded-xl p-4 mb-4 text-sm text-gray-700">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Zatvori objašnjenje"
        className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 text-xl leading-none"
      >
        ×
      </button>
      <h3 className="font-bold text-base mb-1">🐻 Upoznaj svog medu!</h3>
      <p className="leading-relaxed">
        Dok učiš nemački, skupljaš <b>srca ❤️</b>. Svaki tačan odgovor, lekcija i test
        pune tvoje srce — penješ se kroz <b>nivoe</b> i osvajaš <b>titule</b> (ovo nije isto
        što i jezički nivo A1, A2…).
      </p>
      <div className="flex flex-wrap gap-1 mt-2 text-xs">
        {LEVEL_TITLES.map((t, i) => (
          <span key={t} className="bg-white border border-plava/30 rounded-full px-2 py-0.5">
            {i + 1}. {t}
          </span>
        ))}
      </div>
      <p className="mt-2 leading-relaxed text-gray-600">
        +10 tačan odgovor · +20 lekcija · +50 test · +10 dnevni dolazak. Što redovnije
        vežbaš, brže stižeš do sledeće titule — meda navija za tebe! 🎉
      </p>
    </div>
  );
}
