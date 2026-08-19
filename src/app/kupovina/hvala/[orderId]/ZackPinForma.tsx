"use client";

// Postavljanje PIN-a odmah posle gost-kupovine zack! članstva: dete je upravo
// nastalo sa kodom ali bez PIN-a, a roditelj još nema sesiju - zato obrazac
// radi preko orderId (neizvodljiv UUID iz adrese) i /api/zack/gost/pin, koji
// prima zahtev SAMO dok je pin_hash NULL. Posle uspeha obrazac nestaje
// (idempotentno) i ostaje uputstvo za papirić; ako roditelj preskoči, PIN
// kasnije postavlja u panelu („Novi PIN" uz dete).
import { useState } from "react";
import Link from "next/link";

const POLJE =
  "mt-1.5 w-full rounded-xl border-2 border-gray-200 px-3.5 py-2.5 text-[16px] text-gray-900 outline-offset-2 focus-visible:outline-4 focus-visible:outline-plava";

/** Ista pravila kao roditeljski panel: 4 cifre, ne sve iste, ne niz. */
function proveriPinUnos(pin: string, ponovo: string): string | null {
  if (!/^\d{4}$/.test(pin)) return "PIN mora imati tačno četiri cifre.";
  if (/^(\d)\1{3}$/.test(pin)) return "Ovaj PIN je lako pogoditi. Izaberi cifre koje nisu sve iste ni u nizu.";
  const c = [...pin].map(Number);
  const uzlazni = c.every((x, i) => i === 0 || x === c[i - 1] + 1);
  const silazni = c.every((x, i) => i === 0 || x === c[i - 1] - 1);
  if (uzlazni || silazni) return "Ovaj PIN je lako pogoditi. Izaberi cifre koje nisu sve iste ni u nizu.";
  if (pin !== ponovo) return "PIN-ovi se ne poklapaju - upiši isti oba puta.";
  return null;
}

export default function ZackPinForma({ orderId, imeDeteta }: { orderId: string; imeDeteta: string }) {
  const [pin, setPin] = useState("");
  const [ponovo, setPonovo] = useState("");
  const [poruka, setPoruka] = useState<string | null>(null);
  const [gotovo, setGotovo] = useState(false);
  const [saljeSe, setSaljeSe] = useState(false);

  const sacuvaj = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saljeSe) return;
    const omaska = proveriPinUnos(pin, ponovo);
    if (omaska) {
      setPoruka(omaska);
      return;
    }
    setPoruka(null);
    setSaljeSe(true);
    try {
      const odgovor = await fetch("/api/zack/gost/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, pin }),
      });
      if (odgovor.ok) {
        setGotovo(true);
      } else if (odgovor.status === 409) {
        // Već postavljen (npr. drugi tab) - i to je „gotovo", samo bez slavlja.
        setGotovo(true);
      } else {
        const podaci: { error?: string } = await odgovor.json();
        setPoruka(podaci.error ?? "Nešto je zapelo. Probaj ponovo za koji trenutak.");
      }
    } catch {
      setPoruka("Nema veze sa internetom. Probaj ponovo za koji trenutak.");
    }
    setSaljeSe(false);
  };

  if (gotovo) {
    return (
      <div aria-live="polite" className="mt-4 rounded-xl bg-green-50 border border-green-200 px-5 py-4 text-sm text-green-800">
        <p className="font-semibold">PIN je sačuvan.</p>
        <p className="mt-1">
          Prepiši detetu kod (gore) i PIN na papirić - to je cela „instalacija“. Dete se
          prijavljuje na{" "}
          <Link href="/zack" className="underline font-semibold">
            hartweger.rs/zack
          </Link>
          , a ti sve dalje vodiš iz{" "}
          <Link href="/zack/roditelj" className="underline font-semibold">
            roditeljskog panela
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={sacuvaj} noValidate className="mt-4">
      <p className="text-sm text-gray-700">
        Postavi još <strong>tajni broj (PIN)</strong> kojim se {imeDeteta} prijavljuje uz kod -
        četiri cifre koje ti izabereš. Možeš i kasnije, u roditeljskom panelu.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="zack-hvala-pin" className="block text-sm font-semibold text-gray-900">
            PIN (4 cifre)
          </label>
          <input
            id="zack-hvala-pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            aria-describedby="zack-hvala-pin-greska"
            className={POLJE}
          />
        </div>
        <div>
          <label htmlFor="zack-hvala-pin2" className="block text-sm font-semibold text-gray-900">
            Isti PIN, još jednom
          </label>
          <input
            id="zack-hvala-pin2"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={ponovo}
            onChange={(e) => setPonovo(e.target.value)}
            aria-describedby="zack-hvala-pin-greska"
            className={POLJE}
          />
        </div>
      </div>
      <p id="zack-hvala-pin-greska" aria-live="polite" className="min-h-[20px] pt-1.5 text-sm text-[#B3261E]">
        {poruka}
      </p>
      <button
        type="submit"
        disabled={saljeSe}
        className="mt-1 inline-block px-5 py-2.5 rounded-lg font-semibold text-white text-sm bg-plava hover:bg-plava-dark transition-colors disabled:opacity-60"
      >
        {saljeSe ? "Čuva se..." : "Sačuvaj PIN"}
      </button>
    </form>
  );
}
