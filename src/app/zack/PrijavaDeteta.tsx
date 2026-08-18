"use client";

// Ekran na koji dete kuca kod i PIN. Sve što ova komponenta zna o pravilima
// prijave je „pošalji pa pročitaj poruku": odluke (poklapanje, zaključavanje)
// žive na serveru, a ovde se samo pazi da dete ne šalje očigledno nepotpun
// unos i da svaku poruku dobije mirno, uz polje i kroz aria-live.
//
// Izgled: otvaranje albuma, ne formular. Krupan zack! znak, oko njega se pri
// učitavanju „zalepe" mini-sličice u bojama roda (čist ukras, aria-hidden),
// kod je registarska tablica, dugme debela crvena nalepnica.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { kodJeIspravan } from "@/lib/zack/kod";
import {
  CRVENA,
  CRVENA_ZNAK,
  DISPLAY,
  GRESKA,
  IVICA,
  MASTILO,
  MiniSlicica,
  PAPIR,
  PLAVA,
  PRIGUSEN,
  SJAJ,
  TablicaOkvir,
  ZUTA,
  ZackZnak,
} from "./Ukras";

// Ista provera kao pinJeIspravan iz lib/zack/pin.ts. Taj modul se ovde ne sme
// uvesti jer vuče node:crypto, koji ne postoji u pretraživaču.
const PIN_OBLIK = /^\d{4}$/;

/**
 * Razbacane sličice iza znaka. Položaji su ručno nameštani za 375px: par
 * viri uz ivice, nijedna ne dodiruje tekst. Sjajna je tačno jedna i najmanja
 * je - izuzetak, kao i u albumu. Koza viri iza leve, na papirnoj sličici.
 */
function RazbacaneSlicice() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <span className="absolute left-[4%] top-1">
        <MiniSlicica boja={PAPIR} ugao={-8} sirina={52} kasni={220} ikonica="/zack/ikonice/1f410.svg" />
      </span>
      <span className="absolute bottom-2 left-[16%]">
        <MiniSlicica boja={ZUTA} ugao={6} sirina={40} kasni={340} />
      </span>
      <span className="absolute right-[5%] top-0">
        <MiniSlicica boja={PLAVA} ugao={9} sirina={48} kasni={280} />
      </span>
      <span className="absolute bottom-1 right-[17%]">
        <MiniSlicica boja={CRVENA_ZNAK} ugao={-6} sirina={38} kasni={400} />
      </span>
      <span className="absolute bottom-8 right-[2%]">
        <MiniSlicica boja={SJAJ} ugao={-10} sirina={26} kasni={480} />
      </span>
    </div>
  );
}

export default function PrijavaDeteta() {
  const router = useRouter();
  const [kod, setKod] = useState("");
  const [pin, setPin] = useState("");
  const [poruka, setPoruka] = useState<string | null>(null);
  const [saljeSe, setSaljeSe] = useState(false);

  const posalji = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saljeSe) return;
    if (!kodJeIspravan(kod)) {
      setPoruka("Upiši ceo kod, na primer ZK-4F7Q.");
      return;
    }
    if (!PIN_OBLIK.test(pin)) {
      setPoruka("Tajni broj ima tačno četiri cifre.");
      return;
    }
    setPoruka(null);
    setSaljeSe(true);
    try {
      const odgovor = await fetch("/api/zack/prijava", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kod, pin }),
      });
      const podaci: { childId?: string; error?: string } = await odgovor.json();
      if (odgovor.ok && podaci.childId) {
        router.push(`/zack/${podaci.childId}`);
        return;
      }
      setPoruka(podaci.error ?? "Nešto je zapelo. Probaj ponovo za koji trenutak.");
    } catch {
      setPoruka("Nema veze sa internetom. Probaj ponovo za koji trenutak.");
    }
    setSaljeSe(false);
  };

  return (
    <main className="mx-auto max-w-md">
      {/* Scena otvaranja: znak padne prvi, sličice se zalepe za njim. */}
      <div className="relative flex min-h-[150px] items-center justify-center">
        <RazbacaneSlicice />
        <h1 className="zack-zalepi relative" style={{ ["--zack-kasni" as string]: "60ms" }}>
          <ZackZnak velicina="lg" />
        </h1>
      </div>
      <p
        className="zack-zalepi mt-3 text-center text-[17px]"
        style={{ color: PRIGUSEN, ["--zack-kasni" as string]: "520ms" }}
      >
        Upiši svoj kod i PIN, pa pravac na stazu.
      </p>

      <form
        onSubmit={posalji}
        noValidate
        className="mt-6 rounded-2xl border p-5 shadow-[0_3px_0_0_#DED8C8]"
        style={{ background: PAPIR, borderColor: IVICA }}
      >
        <label
          htmlFor="zack-kod"
          className="block text-[17px]"
          style={{ color: MASTILO, fontFamily: DISPLAY }}
        >
          Tvoj kod
        </label>
        <p className="mt-0.5 text-[14px]" style={{ color: PRIGUSEN }}>
          Dobijaš ga od roditelja. On kaže ko si, i nije tajna.
        </p>
        {/* Kod izgleda kao registarska tablica - ista slika koju roditelj vidi
            na svojoj kartici, pa dete prepozna šta se ovde kuca. */}
        <TablicaOkvir className="mt-2 outline-offset-2 focus-within:outline-4 focus-within:outline-[#0B54C9]">
          <input
            id="zack-kod"
            name="kod"
            type="text"
            value={kod}
            onChange={(e) => setKod(e.target.value)}
            placeholder="ZK-4F7Q"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="w-full min-w-0 flex-1 bg-white px-3 py-3.5 text-center text-[24px] uppercase tracking-[0.1em] outline-none"
            style={{ color: MASTILO, fontFamily: DISPLAY }}
          />
        </TablicaOkvir>

        <label
          htmlFor="zack-pin"
          className="mt-5 block text-[17px]"
          style={{ color: MASTILO, fontFamily: DISPLAY }}
        >
          Tajni broj (PIN)
        </label>
        <p className="mt-0.5 text-[14px]" style={{ color: PRIGUSEN }}>
          Četiri cifre koje znaš samo ti.
        </p>
        <input
          id="zack-pin"
          name="pin"
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          placeholder="••••"
          autoComplete="off"
          className="mt-2 w-full rounded-xl border-[3px] bg-white px-4 py-3.5 text-center text-[24px] tracking-[0.4em] outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9]"
          style={{ borderColor: MASTILO, color: MASTILO, fontFamily: DISPLAY }}
        />

        {/* aria-live čita poruku naglas i kad se fokus ne pomeri. */}
        <p aria-live="polite" className="mt-3 min-h-[24px] text-[15px]" style={{ color: GRESKA }}>
          {poruka}
        </p>

        {/* Debela crvena nalepnica: tamna stopa ispod, na pritisak „legne". */}
        <button
          type="submit"
          disabled={saljeSe}
          className="mt-2 w-full rounded-2xl border-4 border-white px-4 py-4 text-[22px] text-white shadow-[0_4px_0_0_#8F1B14,0_6px_12px_rgba(22,22,26,0.18)] outline-offset-4 focus-visible:outline-4 focus-visible:outline-[#0B54C9] disabled:opacity-60 motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:translate-y-[3px] motion-safe:active:shadow-[0_1px_0_0_#8F1B14]"
          style={{ background: CRVENA, fontFamily: DISPLAY }}
        >
          {saljeSe ? "Samo trenutak..." : "Uđi"}
        </button>
      </form>

      <p className="mt-5 text-center text-[14px]" style={{ color: PRIGUSEN }}>
        Nemaš kod? Zamoli roditelja da ti napravi profil na{" "}
        <Link
          href="/zack/roditelj"
          className="underline outline-offset-2 focus-visible:outline-2 focus-visible:outline-[#0B54C9]"
          style={{ color: PRIGUSEN }}
        >
          roditeljskoj strani
        </Link>
        .
      </p>
    </main>
  );
}
