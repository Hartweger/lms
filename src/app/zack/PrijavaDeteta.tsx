"use client";

// Ekran na koji dete kuca kod i PIN. Sve što ova komponenta zna o pravilima
// prijave je „pošalji pa pročitaj poruku": odluke (poklapanje, zaključavanje)
// žive na serveru, a ovde se samo pazi da dete ne šalje očigledno nepotpun
// unos i da svaku poruku dobije mirno, uz polje i kroz aria-live.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { kodJeIspravan } from "@/lib/zack/kod";

// Ista provera kao pinJeIspravan iz lib/zack/pin.ts. Taj modul se ovde ne sme
// uvesti jer vuče node:crypto, koji ne postoji u pretraživaču.
const PIN_OBLIK = /^\d{4}$/;

const PAPIR = "#FCFBF7";
const IVICA = "#DED8C8";
const PRIGUSEN = "#6E6A5E";
const MASTILO = "#16161A";
const PLAVA = "#0B54C9";
const CRVENA = "#B3261E";

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
      setPoruka("Upiši ceo kod koji si dobio od roditelja, na primer ZK-4F7Q.");
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
      <h1 className="font-heading text-center text-4xl font-bold" style={{ color: MASTILO }}>
        zack!
      </h1>
      <p className="mt-2 text-center text-[17px]" style={{ color: PRIGUSEN }}>
        Upiši svoj kod i PIN, pa pravac na stazu.
      </p>

      <form
        onSubmit={posalji}
        noValidate
        className="mt-6 rounded-2xl border p-5 shadow-[0_2px_0_0_#DED8C8]"
        style={{ background: PAPIR, borderColor: IVICA }}
      >
        <label
          htmlFor="zack-kod"
          className="font-heading block text-[17px] font-bold"
          style={{ color: MASTILO }}
        >
          Tvoj kod
        </label>
        <p className="mt-0.5 text-[14px]" style={{ color: PRIGUSEN }}>
          Dobio si ga od roditelja. On kaže ko si, i nije tajna.
        </p>
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
          className="font-heading mt-2 w-full rounded-xl border-2 px-4 py-3.5 text-center text-[26px] font-bold uppercase tracking-[0.15em] outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9]"
          style={{ background: "#FFFFFF", borderColor: IVICA, color: MASTILO }}
        />

        <label
          htmlFor="zack-pin"
          className="font-heading mt-5 block text-[17px] font-bold"
          style={{ color: MASTILO }}
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
          className="font-heading mt-2 w-full rounded-xl border-2 px-4 py-3.5 text-center text-[26px] font-bold tracking-[0.4em] outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9]"
          style={{ background: "#FFFFFF", borderColor: IVICA, color: MASTILO }}
        />

        {/* aria-live čita poruku naglas i kad se fokus ne pomeri. */}
        <p aria-live="polite" className="mt-3 min-h-[24px] text-[15px]" style={{ color: CRVENA }}>
          {poruka}
        </p>

        <button
          type="submit"
          disabled={saljeSe}
          className="font-heading mt-2 w-full rounded-xl px-4 py-4 text-[20px] font-bold text-white outline-offset-4 focus-visible:outline-4 focus-visible:outline-[#0B54C9] disabled:opacity-60 motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:scale-[0.985]"
          style={{ background: PLAVA }}
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
