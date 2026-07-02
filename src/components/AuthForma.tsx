"use client";

import { useState } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/client";

interface AuthFormaProps {
  tip: "prijava" | "reset";
  onSubmit: (data: { email: string; password: string }) => Promise<string | null>;
}

export default function AuthForma({ tip, onSubmit }: AuthFormaProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [greska, setGreska] = useState<string | null>(null);
  const [uspeh, setUspeh] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [noAccount, setNoAccount] = useState(false);
  const [code, setCode] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleMagicLink = async () => {
    const cistEmail = email.trim();
    if (!cistEmail) {
      setGreska("Unesi email adresu pa onda pošalji link.");
      return;
    }
    setGreska(null);
    setUspeh(null);
    setNoAccount(false);
    setMagicLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: cistEmail,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: window.location.origin + "/auth/callback",
      },
    });
    if (error) {
      Sentry.captureException(error);
      const status = error.status;
      if (status === 429) {
        setGreska("Previše pokušaja. Sačekaj minut pa probaj ponovo.");
      } else if (typeof status === "number" && status >= 400 && status < 500) {
        // 4xx (npr. 422 „signups not allowed") = nema naloga sa tim mejlom
        setNoAccount(true);
      } else {
        setGreska("Trenutno ne možemo da pošaljemo link. Pokušaj ponovo za koji trenutak.");
      }
    } else {
      setMagicLinkSent(true);
    }
    setMagicLoading(false);
  };

  const handleVerifyCode = async () => {
    const cistKod = code.trim();
    if (cistKod.length < 6) {
      setCodeError("Unesi 6-cifreni kod iz mejla.");
      return;
    }
    setCodeError(null);
    setCodeLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: cistKod,
      type: "email",
    });
    setCodeLoading(false);
    if (error) {
      Sentry.captureException(error);
      setCodeError("Kod nije ispravan ili je istekao. Proveri mejl ili pošalji novi link.");
      return;
    }
    window.location.href = "/dashboard";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGreska(null);
    setUspeh(null);
    setNoAccount(false);
    setLoading(true);
    const result = await onSubmit({ email, password });
    if (result) {
      if (result.startsWith("OK:")) {
        setUspeh(result.slice(3));
      } else {
        setGreska(result);
      }
    }
    setLoading(false);
  };

  if (magicLinkSent) {
    return (
      <div className="w-full max-w-sm space-y-4">
        <div role="alert" className="bg-green-50 text-green-800 px-4 py-3 rounded-lg text-sm text-left">
          Poslali smo mejl na <strong>{email}</strong>. Proveri inbox (i spam folder).
          <br />
          Klikni na dugme <strong>Prijavi se</strong> u mejlu — i tu si.
        </div>

        <div className="border-t border-gray-200 pt-4 text-left">
          <p className="text-sm text-gray-600 mb-2">
            Link ti se otvara u pogrešnoj aplikaciji? U mejlu imaš i <strong>6-cifreni kod</strong> — ukucaj ga ovde:
          </p>
          <input
            type="text"
            aria-label="Šestocifreni kod za prijavu"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-center text-2xl tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-plava focus:border-transparent"
          />
          {codeError && (
            <div role="alert" className="mt-2 bg-koral-light text-koral-dark px-4 py-2 rounded-lg text-sm">
              {codeError}
            </div>
          )}
          <button
            type="button"
            onClick={handleVerifyCode}
            disabled={codeLoading}
            className="mt-3 w-full bg-plava text-white py-3 rounded-lg font-medium hover:bg-plava-dark transition-colors disabled:opacity-50"
          >
            {codeLoading ? "Proveravam..." : "Prijavi se kodom"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setMagicLinkSent(false);
            setCode("");
            setCodeError(null);
          }}
          className="w-full text-sm text-plava hover:underline"
        >
          Pogrešan mejl? Pošalji ponovo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-sm">
      {tip === "prijava" && (
        <>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {googleLoading ? "Učitavanje..." : "Nastavi sa Google"}
          </button>
          <p className="text-xs text-gray-400 text-center -mt-1">
            Imaš @gmail nalog? Ovo je najbrže - bez čekanja mejla.
          </p>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400">ili</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-plava focus:border-transparent"
            placeholder="tvoj@email.com"
          />
        </div>

        {tip === "prijava" && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Lozinka
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-plava focus:border-transparent"
              placeholder="Tvoja lozinka"
            />
          </div>
        )}

        {greska && (
          <div role="alert" className="bg-koral-light text-koral-dark px-4 py-3 rounded-lg text-sm">
            {greska}
          </div>
        )}

        {uspeh && (
          <div className="bg-plava-light text-plava-dark px-4 py-3 rounded-lg text-sm">
            {uspeh}
          </div>
        )}

        {noAccount && (
          <div role="alert" className="bg-koral-light text-koral-dark px-4 py-3 rounded-lg text-sm">
            Nemamo nalog sa tim mejlom. Da li si kupio/la kurs?{" "}
            <Link href="/kursevi" className="underline font-medium">
              Pogledaj kurseve
            </Link>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-plava text-white py-3 rounded-lg font-medium hover:bg-plava-dark transition-colors disabled:opacity-50"
        >
          {loading ? "Učitavanje..." : tip === "reset" ? "Pošalji mi link" : "Prijavi se"}
        </button>
      </form>

      {tip === "prijava" && (
        <div className="space-y-2 text-sm text-center">
          <Link href="/reset-lozinke" className="block text-plava hover:underline font-medium">
            Prvi put ovde ili nemaš lozinku? Napravi je
          </Link>
          <Link href="/reset-lozinke" className="block text-gray-500 hover:underline">
            Zaboravio/la si lozinku?
          </Link>
          <button
            type="button"
            onClick={handleMagicLink}
            disabled={magicLoading}
            className="w-full text-gray-400 hover:underline disabled:opacity-50"
          >
            {magicLoading ? "Slanje..." : "Radije bez lozinke? Pošalji mi link na mejl"}
          </button>
        </div>
      )}
    </div>
  );
}
