"use client";

// Navigacija zaglavlja landing strane. Na velikom ekranu mirna traka linkova
// (sidra ka sekcijama + prijave), na telefonu hamburger koji otvara papirni
// list. Bez ijedne zavisnosti: stanje je jedan boolean, a pristupačnost prati
// obrazac dugme + aria-expanded + aria-controls.
//
// Zatvaranje: Escape (fokus se vraća na dugme), klik van menija, klik na
// stavku. Kod klika na sidro fokus namerno NE vraćamo na dugme - skok na
// sekciju nosi i fokus, pa tastatura nastavlja tamo gde čitalac gleda.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IVICA, MASTILO, PAPIR, PRIGUSEN } from "../Ukras";

/** Isti fokus prsten kao na ostatku strane. */
const FOKUS = "outline-offset-4 focus-visible:outline-4 focus-visible:outline-[#0B54C9]";

const SIDRA = [
  { href: "#kako-radi", tekst: "Kako radi" },
  { href: "#sta-dobijas", tekst: "Šta dobijaš" },
  { href: "#kako-pocinjes", tekst: "Kako počinješ" },
  { href: "#cena", tekst: "Cena" },
  { href: "#pitanja", tekst: "Pitanja" },
];

export default function Meni() {
  const [otvoren, setOtvoren] = useState(false);
  const dugme = useRef<HTMLButtonElement | null>(null);
  const okvir = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!otvoren) return;
    const naTaster = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOtvoren(false);
        dugme.current?.focus();
      }
    };
    const naKlikVan = (e: MouseEvent) => {
      if (okvir.current && e.target instanceof Node && !okvir.current.contains(e.target)) {
        setOtvoren(false);
      }
    };
    document.addEventListener("keydown", naTaster);
    document.addEventListener("mousedown", naKlikVan);
    return () => {
      document.removeEventListener("keydown", naTaster);
      document.removeEventListener("mousedown", naKlikVan);
    };
  }, [otvoren]);

  return (
    <div ref={okvir} className="relative">
      {/* Veliki ekran: mirna traka - sidra pa prijave, bez ikakve mehanike. */}
      <nav aria-label="Delovi strane" className="hidden items-center gap-0.5 lg:flex">
        {SIDRA.map((s) => (
          <a
            key={s.href}
            href={s.href}
            className={`rounded-lg px-2.5 py-2.5 text-[15px] ${FOKUS}`}
            style={{ color: PRIGUSEN }}
          >
            {s.tekst}
          </a>
        ))}
        <Link
          href="/zack"
          className={`rounded-lg px-2.5 py-2.5 text-[15px] underline underline-offset-2 ${FOKUS}`}
          style={{ color: PRIGUSEN }}
        >
          Prijava za dete
        </Link>
        <Link
          href="/zack/roditelj"
          className={`ml-1 rounded-xl border-2 px-4 py-2.5 text-[15px] font-bold ${FOKUS}`}
          style={{ borderColor: MASTILO, color: MASTILO }}
        >
          Uđi u nalog
        </Link>
      </nav>

      {/* Telefon: hamburger, meta 44×44. */}
      <button
        ref={dugme}
        type="button"
        aria-expanded={otvoren}
        aria-controls="zack-meni"
        onClick={() => setOtvoren((o) => !o)}
        className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 bg-white lg:hidden ${FOKUS}`}
        style={{ borderColor: MASTILO, color: MASTILO }}
      >
        <span className="sr-only">{otvoren ? "Zatvori meni" : "Otvori meni"}</span>
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          {otvoren ? (
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          )}
        </svg>
      </button>

      {/* Otcepljen list: papir, blagi nagib, ista senka kao kartice. Atribut
          hidden drži id u dokumentu i kad je meni zatvoren, zbog aria-controls. */}
      <div
        id="zack-meni"
        hidden={!otvoren}
        className="absolute right-0 top-[calc(100%+10px)] z-50 w-60 -rotate-1 rounded-2xl border p-2 shadow-[0_4px_0_0_#DED8C8,0_14px_30px_rgba(22,22,26,0.18)] lg:hidden"
        style={{ background: PAPIR, borderColor: IVICA }}
      >
        <nav aria-label="Meni" className="flex flex-col">
          {SIDRA.map((s) => (
            <a
              key={s.href}
              href={s.href}
              onClick={() => setOtvoren(false)}
              className={`flex min-h-[44px] items-center rounded-lg px-3 text-[16px] font-bold ${FOKUS}`}
              style={{ color: MASTILO }}
            >
              {s.tekst}
            </a>
          ))}
          <span aria-hidden="true" className="my-2 block border-t" style={{ borderColor: IVICA }} />
          <Link
            href="/zack/roditelj"
            onClick={() => setOtvoren(false)}
            className={`flex min-h-[44px] items-center rounded-lg px-3 text-[16px] ${FOKUS}`}
            style={{ color: PRIGUSEN }}
          >
            Prijava za roditelje
          </Link>
          <Link
            href="/zack"
            onClick={() => setOtvoren(false)}
            className={`flex min-h-[44px] items-center rounded-lg px-3 text-[16px] ${FOKUS}`}
            style={{ color: PRIGUSEN }}
          >
            Prijava za dete
          </Link>
        </nav>
      </div>
    </div>
  );
}
