"use client";

// Prijava roditelja mejlom: isti magic-link tok kao ostatak platforme
// (signInWithOtp), samo se link vraća na /zack/roditelj umesto na dashboard.
// Ovde se namerno NE pravi nikakva nova vrsta prijave.
//
// Izgled: ista porodica kao dečja strana, samo smirenija - znak gore, papir,
// red. Trio mini-sličica u bojama roda stoji kao mig na ono što dete dobija.
import { useRef, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/client";
import Turnstile, { TURNSTILE_SITE_KEY, type TurnstileHandle } from "@/components/Turnstile";
import {
  CRVENA_ZNAK,
  DISPLAY,
  GRESKA,
  IVICA,
  MASTILO,
  MiniSlicica,
  PAPIR,
  PLAVA,
  PRIGUSEN,
  ZELENA,
  ZELENA_DAS,
  ZackZnak,
} from "../Ukras";

export default function RoditeljPrijava() {
  const [email, setEmail] = useState("");
  const [poruka, setPoruka] = useState<string | null>(null);
  const [poslato, setPoslato] = useState(false);
  const [saljeSe, setSaljeSe] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);
  // Token je jednokratan: posle svakog pokušaja se traži novi.
  const captchaCeka = Boolean(TURNSTILE_SITE_KEY) && !captchaToken;

  const posalji = async (e: React.FormEvent) => {
    e.preventDefault();
    const cistEmail = email.trim();
    if (!cistEmail) {
      setPoruka("Upiši svoju mejl adresu.");
      return;
    }
    setPoruka(null);
    setSaljeSe(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: cistEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/zack/roditelj`,
        captchaToken: captchaToken ?? undefined,
      },
    });
    turnstileRef.current?.reset();
    setCaptchaToken(null);
    if (error) {
      Sentry.captureException(error);
      if (error.status === 429) {
        setPoruka("Previše pokušaja. Sačekaj minut pa probaj ponovo.");
      } else {
        setPoruka("Trenutno ne možemo da pošaljemo link. Probaj ponovo za koji trenutak.");
      }
    } else {
      setPoslato(true);
    }
    setSaljeSe(false);
  };

  return (
    <main className="mx-auto max-w-md">
      <div className="flex items-start justify-between gap-4">
        <h1 className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
          <ZackZnak velicina="md" />
          <span className="text-[24px] tracking-tight" style={{ color: MASTILO, fontFamily: DISPLAY }}>
            za roditelje
          </span>
        </h1>
        {/* Tri sličice, tri roda: crvena die, plava der, zelena das. Mig na ono
            što dete u aplikaciji skuplja. */}
        <span aria-hidden="true" className="flex flex-none -space-x-2 pt-1">
          <MiniSlicica boja={CRVENA_ZNAK} ugao={-7} sirina={26} kasni={120} />
          <MiniSlicica boja={PLAVA} ugao={3} sirina={26} kasni={220} />
          <MiniSlicica boja={ZELENA_DAS} ugao={9} sirina={26} kasni={320} />
        </span>
      </div>
      <p className="mt-4 text-[16px] leading-relaxed" style={{ color: PRIGUSEN }}>
        {/* Udžbenik se roditelju NE pominje (odluka 19.08: sadržaj ide po planu i
            programu, ne po udžbeniku) - ova rečenica je do 22.08. jedina na sajtu
            još tvrdila suprotno. */}
        zack! je Hartweger aplikacija u kojoj tvoje dete vežba nemački po školskom planu i
        programu i za tačne odgovore skuplja sličice. Ovde detetu otvaraš profil
        i dobijaš kod i PIN kojima se ono prijavljuje, bez mejla i bez svog naloga.
      </p>

      <div
        className="mt-6 rounded-2xl border p-5 shadow-[0_3px_0_0_#DED8C8]"
        style={{ background: PAPIR, borderColor: IVICA }}
      >
        {poslato ? (
          <p aria-live="polite" className="text-[16px] leading-relaxed" style={{ color: ZELENA }}>
            Link za prijavu je poslat na {email.trim()}. Otvori poštu i klikni na njega,
            pa se vraćaš pravo na ovu stranicu.
          </p>
        ) : (
          <form onSubmit={posalji} noValidate>
            <label
              htmlFor="roditelj-email"
              className="block text-[16px]"
              style={{ color: MASTILO, fontFamily: DISPLAY }}
            >
              Tvoj mejl
            </label>
            <input
              id="roditelj-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              placeholder="ime@primer.rs"
              className="mt-2 w-full rounded-xl border-2 px-4 py-3 text-[17px] outline-offset-2 focus-visible:outline-4 focus-visible:outline-[#0B54C9]"
              style={{ background: "#FFFFFF", borderColor: IVICA, color: MASTILO }}
            />
            <Turnstile ref={turnstileRef} onToken={setCaptchaToken} />
            <p aria-live="polite" className="min-h-[22px] pt-2 text-[14px]" style={{ color: GRESKA }}>
              {poruka}
            </p>
            <button
              type="submit"
              disabled={saljeSe || captchaCeka}
              className="font-heading mt-1 w-full rounded-xl px-4 py-3.5 text-[17px] font-bold text-white shadow-[0_3px_0_0_#083E93] outline-offset-4 focus-visible:outline-4 focus-visible:outline-[#0B54C9] disabled:opacity-60 motion-safe:transition-transform motion-safe:duration-100 motion-safe:active:translate-y-[2px] motion-safe:active:shadow-[0_1px_0_0_#083E93]"
              style={{ background: PLAVA }}
            >
              {saljeSe ? "Šalje se..." : "Pošalji mi link za prijavu"}
            </button>
            <p className="mt-3 text-[13px] leading-relaxed" style={{ color: PRIGUSEN }}>
              Bez lozinke: na mejl ti stiže link kojim se prijavljuješ.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
