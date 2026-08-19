"use client";

// Završni korak zack! checkouta: ime i saglasnost, pa preusmerenje na bankinu
// stranicu (postojeći tok /kupovina/kartica/[orderId], isti kao školski).
// Iznos i pravila stoje IZNAD, na serverskoj strani - ovde se ništa o ceni ne
// odlučuje: /api/orders je ionako računa sam iz plana, klijentu se ne veruje.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GRESKA, IVICA, MASTILO, PLAVA, PRIGUSEN } from "../../zack/Ukras";

const POLJE =
  "mt-1.5 w-full rounded-xl border-2 px-3.5 py-2.5 text-[16px] outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9]";

export default function ZackCheckout(props: {
  deteId: string;
  imeDeteta: string;
  email: string;
  pocetnoIme: string;
  iznosRsd: number;
}) {
  const router = useRouter();
  const [ime, setIme] = useState(props.pocetnoIme);
  const [saglasnost, setSaglasnost] = useState(false);
  const [poruka, setPoruka] = useState<string | null>(null);
  const [saljeSe, setSaljeSe] = useState(false);

  const plati = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saljeSe) return;
    if (!ime.trim()) {
      setPoruka("Upiši ime i prezime - banka ih traži uz karticu.");
      return;
    }
    if (!saglasnost) {
      setPoruka("Potvrdi da razumeš mesečno plaćanje pre nastavka.");
      return;
    }
    setPoruka(null);
    setSaljeSe(true);
    try {
      const odgovor = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: ime.trim(),
          email: props.email,
          country: "Srbija",
          courseSlug: "zack-clanstvo",
          paymentMethod: "kartica_pretplata",
          deteId: props.deteId,
        }),
      });
      const podaci: { orderId?: string; error?: string } = await odgovor.json();
      if (odgovor.ok && podaci.orderId) {
        // Dalje preuzima postojeća kartična strana: auto-POST ka NestPay-u.
        router.push(`/kupovina/kartica/${podaci.orderId}`);
        return;
      }
      setPoruka(podaci.error ?? "Nešto je zapelo. Probaj ponovo za koji trenutak.");
    } catch {
      setPoruka("Nema veze sa internetom. Probaj ponovo za koji trenutak.");
    }
    setSaljeSe(false);
  };

  return (
    <form
      onSubmit={plati}
      noValidate
      className="mt-5 rounded-2xl border bg-white p-5 shadow-[0_3px_0_0_#DED8C8]"
      style={{ borderColor: IVICA }}
    >
      <div>
        <label htmlFor="zack-ime" className="block text-[15px] font-bold" style={{ color: MASTILO }}>
          Tvoje ime i prezime
        </label>
        <input
          id="zack-ime"
          type="text"
          value={ime}
          onChange={(e) => setIme(e.target.value)}
          autoComplete="name"
          maxLength={80}
          className={POLJE}
          style={{ background: "#FFFFFF", borderColor: IVICA, color: MASTILO }}
        />
      </div>

      <p className="mt-3 text-[14px]" style={{ color: PRIGUSEN }}>
        Potvrda i račun stižu na <strong style={{ color: MASTILO }}>{props.email}</strong> (mejl
        tvog roditeljskog naloga).
      </p>

      <label className="mt-4 flex items-start gap-2.5 text-[14px] leading-relaxed" style={{ color: MASTILO }}>
        <input
          type="checkbox"
          checked={saglasnost}
          onChange={(e) => setSaglasnost(e.target.checked)}
          className="mt-1 h-4 w-4 flex-none"
        />
        <span>
          Razumem da pokrećem mesečno plaćanje od {props.iznosRsd.toLocaleString("de-DE")} RSD koje
          se automatski obnavlja dok ga ne otkažem, i saglasan/na sam sa uslovima korišćenja.
        </span>
      </label>

      <p aria-live="polite" className="min-h-[20px] pt-2 text-[14px]" style={{ color: GRESKA }}>
        {poruka}
      </p>

      <button
        type="submit"
        disabled={saljeSe}
        className="mt-1 block w-full rounded-xl px-4 py-3.5 text-[16px] font-bold text-white shadow-[0_3px_0_0_#083E93] outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9] disabled:opacity-60"
        style={{ background: PLAVA }}
      >
        {saljeSe ? "Samo trenutak..." : "Nastavi na plaćanje karticom →"}
      </button>
      <p className="mt-2.5 text-center text-[13px]" style={{ color: PRIGUSEN }}>
        Sledeći korak je zaštićena stranica Banca Intesa na kojoj unosiš karticu.
      </p>
    </form>
  );
}
