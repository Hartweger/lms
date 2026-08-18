"use client";

// Prijava roditelja mejlom: isti magic-link tok kao ostatak platforme
// (signInWithOtp), samo se link vraća na /zack/roditelj umesto na dashboard.
// Ovde se namerno NE pravi nikakva nova vrsta prijave.
import { useRef, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/client";
import Turnstile, { TURNSTILE_SITE_KEY, type TurnstileHandle } from "@/components/Turnstile";

const PAPIR = "#FCFBF7";
const IVICA = "#DED8C8";
const PRIGUSEN = "#6E6A5E";
const MASTILO = "#16161A";
const PLAVA = "#0B54C9";
const CRVENA = "#B3261E";
const ZELENA = "#1B6E3C";

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
      <h1 className="font-heading text-3xl font-bold" style={{ color: MASTILO }}>
        zack! za roditelje
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed" style={{ color: PRIGUSEN }}>
        zack! je Hartweger aplikacija u kojoj tvoje dete vežba nemački uz lekcije iz svog
        školskog udžbenika i za tačne odgovore skuplja sličice. Ovde detetu otvaraš profil
        i dobijaš kod i PIN kojima se ono prijavljuje, bez mejla i bez svog naloga.
      </p>

      <div
        className="mt-6 rounded-2xl border p-5 shadow-[0_2px_0_0_#DED8C8]"
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
              className="font-heading block text-[16px] font-bold"
              style={{ color: MASTILO }}
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
            <p aria-live="polite" className="min-h-[22px] pt-2 text-[14px]" style={{ color: CRVENA }}>
              {poruka}
            </p>
            <button
              type="submit"
              disabled={saljeSe || captchaCeka}
              className="font-heading mt-1 w-full rounded-xl px-4 py-3.5 text-[17px] font-bold text-white outline-offset-4 focus-visible:outline-4 focus-visible:outline-[#0B54C9] disabled:opacity-60"
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
