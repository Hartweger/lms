"use client";

// Ekran pristanka. Prikazuje se CEO tekst iz lib/zack/pristanak.ts - isti taj
// tekst server upisuje u bazu, pa ono što roditelj vidi i ono što se čuva ne
// mogu da se raziđu. Bez klika na „Prihvatam" nema reda u zack_roditelji, a
// bez tog reda rute ne daju da se napravi nijedan dečji profil.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PRISTANAK_TEKST } from "@/lib/zack/pristanak";

const PAPIR = "#FCFBF7";
const IVICA = "#DED8C8";
const PRIGUSEN = "#6E6A5E";
const MASTILO = "#16161A";
const PLAVA = "#0B54C9";
const CRVENA = "#B3261E";

export default function PristanakEkran({ email }: { email: string }) {
  const router = useRouter();
  const [poruka, setPoruka] = useState<string | null>(null);
  const [saljeSe, setSaljeSe] = useState(false);

  const prihvati = async () => {
    if (saljeSe) return;
    setPoruka(null);
    setSaljeSe(true);
    try {
      const odgovor = await fetch("/api/zack/roditelj/pristanak", { method: "POST" });
      if (odgovor.ok) {
        // Server je upisao pristanak; stranica se ponovo iscrtava i prelazi
        // u stanje sa spiskom dece.
        router.refresh();
        return;
      }
      const podaci: { error?: string } = await odgovor.json();
      setPoruka(podaci.error ?? "Nešto je zapelo. Probaj ponovo za koji trenutak.");
    } catch {
      setPoruka("Nema veze sa internetom. Probaj ponovo za koji trenutak.");
    }
    setSaljeSe(false);
  };

  const odjava = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <main className="mx-auto max-w-md">
      <h1 className="font-heading text-3xl font-bold" style={{ color: MASTILO }}>
        Još samo pristanak
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed" style={{ color: PRIGUSEN }}>
        Prijavljen si kao {email}. Pre nego što otvoriš profil detetu, pročitaj na šta
        tačno pristaješ - kratko je i bez sitnih slova.
      </p>

      <div
        className="mt-5 whitespace-pre-line rounded-2xl border p-5 text-[16px] leading-relaxed shadow-[0_2px_0_0_#DED8C8]"
        style={{ background: PAPIR, borderColor: IVICA, color: MASTILO }}
      >
        {PRISTANAK_TEKST}
      </div>

      <p aria-live="polite" className="min-h-[22px] pt-3 text-[14px]" style={{ color: CRVENA }}>
        {poruka}
      </p>
      <button
        type="button"
        onClick={prihvati}
        disabled={saljeSe}
        className="font-heading mt-1 w-full rounded-xl px-4 py-3.5 text-[17px] font-bold text-white outline-offset-4 focus-visible:outline-4 focus-visible:outline-[#0B54C9] disabled:opacity-60"
        style={{ background: PLAVA }}
      >
        {saljeSe ? "Čuva se..." : "Prihvatam"}
      </button>

      <p className="mt-4 text-center text-[14px]" style={{ color: PRIGUSEN }}>
        Nisi ti?{" "}
        <button
          type="button"
          onClick={odjava}
          className="underline outline-offset-2 focus-visible:outline-2 focus-visible:outline-[#0B54C9]"
          style={{ color: PRIGUSEN }}
        >
          Odjavi se
        </button>
      </p>
    </main>
  );
}
