"use client";

// Lepljivi poziv: žuti papirić sa cenom koji prati skrol - na telefonu traka
// uz dno, na velikom ekranu nagnut papirić u donjem desnom uglu.
//
// Pravila ponašanja:
// - pojavi se tek kad hero dugme izađe iz kadra NAGORE (roditelj je krenuo da
//   čita), da na prvom ekranu ne stoje dva ista poziva;
// - roditelj sme da ga skloni; izbor pamti sessionStorage, pa se papirić u
//   istoj poseti ne vraća;
// - ulazak koristi postojeću zack-zalepi animaciju, koja uz reduced-motion ne
//   postoji - papirić se tada prosto pojavi;
// - dok je prikazan, u tok strane ulazi i odstojnik, da fiksirani papirić
//   nikad ne prekrije podnožje.
//
// Cena: promo 1.200, puna 2.399 precrtana - sa sr-only objašnjenjem, da
// čitač ekrana ne pročita dva broja bez veze. Na telefonu precrtana otpada,
// jer u traku od ~64px ne staje čitko.
//
// Dok traje poklon, papirić nosi poklon umesto cene - isti raspored, samo
// druga ponuda. Da li poklon traje NE odlučuje ova komponenta: stiže joj kao
// poklonAktivan sa strane, koja ga čita iz POKLON_DO. Članstvo tada ostaje
// dohvatljivo mirnim linkom ispod dugmeta (na telefonu ga nosi sama strana,
// jer u traku od ~64px ne staju dva poziva).
import Link from "next/link";
import { useEffect, useState } from "react";
import { POKLON_DO_PRIKAZ } from "@/lib/zack/poklon";
import { CRVENA, DISPLAY, MASTILO, ZUTA } from "../zack/Ukras";

const FOKUS = "outline-offset-4 focus-visible:outline-4 focus-visible:outline-[#0B54C9]";
const KLJUC = "zack-lepljivi-cta";

export default function LepljivPoziv({ poklonAktivan }: { poklonAktivan: boolean }) {
  const [prosaoHero, setProsaoHero] = useState(false);
  // Izbor „zatvorio sam ga" se čita odmah pri prvom crtanju na klijentu; na
  // serveru je svejedno, jer je papirić ionako skriven dok se hero ne prođe.
  const [zatvoren, setZatvoren] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      return sessionStorage.getItem(KLJUC) === "ne";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const meta = document.getElementById("hero-cta");
    // Bez IntersectionObserver-a papirić prosto ne postoji - on je prodajni
    // dodatak, a pozivi u sekcijama rade i bez njega.
    if (!meta || !("IntersectionObserver" in window)) return;
    const posmatrac = new IntersectionObserver((unosi) => {
      for (const u of unosi) {
        setProsaoHero(!u.isIntersecting && u.boundingClientRect.top < 0);
      }
    });
    posmatrac.observe(meta);
    return () => posmatrac.disconnect();
  }, []);

  if (!prosaoHero || zatvoren) return null;

  const zatvori = () => {
    setZatvoren(true);
    try {
      sessionStorage.setItem(KLJUC, "ne");
    } catch {
      // Bez sessionStorage-a izbor važi samo do sledećeg učitavanja.
    }
  };

  return (
    <>
      {/* Odstojnik u toku strane: fiksirani papirić nikad preko podnožja. */}
      <div aria-hidden="true" className="h-24 lg:h-48" />
      <aside
        aria-label={poklonAktivan ? `Poklon do ${POKLON_DO_PRIKAZ}` : "Cena članstva"}
        className="zack-zalepi fixed inset-x-3 bottom-3 z-40 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:w-64"
      >
        <div
          className="relative -rotate-[0.6deg] rounded-xl border p-2.5 pr-1 shadow-[0_4px_0_0_rgba(22,22,26,0.18),0_10px_24px_rgba(22,22,26,0.22)] lg:rotate-2 lg:p-5 lg:pr-5 lg:pt-6"
          style={{ background: ZUTA, borderColor: "rgba(22,22,26,0.15)" }}
        >
          <div className="flex items-center gap-2.5 lg:flex-col lg:items-stretch lg:gap-4">
            {poklonAktivan ? (
              <>
                <p
                  className="min-w-0 flex-1 text-[15px] leading-snug lg:flex-none lg:text-[19px] lg:leading-tight"
                  style={{ color: MASTILO, fontFamily: DISPLAY }}
                >
                  Poklon do {POKLON_DO_PRIKAZ}
                  {/* Rečenica o kartici staje tek na papirić velikog ekrana. */}
                  <span className="mt-2 hidden text-[14px] lg:block" style={{ color: "#5C5304" }}>
                    Bez plaćanja i bez kartice.
                  </span>
                </p>
                <Link
                  href="/poklon"
                  className={`flex min-h-[44px] flex-none items-center justify-center rounded-lg border-2 border-white px-3.5 text-[15px] font-bold text-white shadow-[0_2px_0_0_#8F1B14] ${FOKUS}`}
                  style={{ background: CRVENA, fontFamily: DISPLAY }}
                >
                  Uzmi poklon
                </Link>
                <Link
                  href="/kupovina/zack-clanstvo"
                  className={`hidden text-center text-[13px] underline underline-offset-2 lg:block ${FOKUS}`}
                  style={{ color: "#5C5304" }}
                >
                  Ili članstvo - 1.200 din mesečno
                </Link>
              </>
            ) : (
              <>
                <p
                  className="min-w-0 flex-1 text-[15px] leading-snug lg:flex-none lg:text-[19px] lg:leading-tight"
                  style={{ color: MASTILO, fontFamily: DISPLAY }}
                >
                  {/* Na telefonu traka od ~64px nosi samo promo cenu; precrtana
                      puna i „po detetu" stanu tek na papirić velikog ekrana. */}
                  <span className="hidden lg:inline">
                    <span className="sr-only">Puna cena </span>
                    <s className="text-[15px]" style={{ color: "#5C5304" }}>
                      2.399
                    </s>{" "}
                  </span>
                  <span className="whitespace-nowrap">1.200 din</span> mesečno
                  <span className="hidden lg:inline"> po detetu</span>
                </p>
                <Link
                  href="/kupovina/zack-clanstvo"
                  className={`flex min-h-[44px] flex-none items-center justify-center rounded-lg border-2 border-white px-3.5 text-[15px] font-bold text-white shadow-[0_2px_0_0_#8F1B14] ${FOKUS}`}
                  style={{ background: CRVENA, fontFamily: DISPLAY }}
                >
                  Uključi članstvo
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={zatvori}
              aria-label="Zatvori ponudu"
              className={`flex h-11 w-11 flex-none items-center justify-center rounded-full lg:absolute lg:-right-2.5 lg:-top-2.5 lg:h-11 lg:w-11 lg:border lg:bg-white lg:shadow-[0_2px_6px_rgba(22,22,26,0.25)] ${FOKUS}`}
              style={{ color: MASTILO, borderColor: "rgba(22,22,26,0.15)" }}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
