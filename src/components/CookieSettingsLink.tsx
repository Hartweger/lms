"use client";

import { CONSENT_EVENT } from "@/lib/consent";

// Link u footeru koji ponovo otvara cookie banner (izmena/povlačenje saglasnosti).
export default function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(CONSENT_EVENT))}
    >
      Podešavanja kolačića
    </button>
  );
}
