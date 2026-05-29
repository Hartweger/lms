"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EUR_RATE, PAYPAL_SURCHARGE } from "@/lib/order-utils";

interface Props {
  courseSlug: string;
  courseTitle: string;
  priceRsd: number;
  priceEur: number | null;
}

const COUNTRIES = [
  { code: "RS", label: "Srbija" },
  { code: "DE", label: "Nemačka" },
  { code: "AT", label: "Austrija" },
  { code: "CH", label: "Švajcarska" },
  { code: "BA", label: "Bosna i Hercegovina" },
  { code: "HR", label: "Hrvatska" },
  { code: "ME", label: "Crna Gora" },
  { code: "MK", label: "Severna Makedonija" },
  { code: "SI", label: "Slovenija" },
  { code: "US", label: "SAD" },
  { code: "GB", label: "Velika Britanija" },
  { code: "CA", label: "Kanada" },
  { code: "OTHER", label: "Druga zemlja" },
];

function formatPrice(price: number): string {
  return price.toLocaleString("de-DE");
}

export default function CheckoutForm({ courseSlug, courseTitle, priceRsd, priceEur }: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("RS");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paymentMethod = country === "RS" ? "uplatnica" : "paypal";

  const displayEur = priceEur != null
    ? priceEur
    : Math.ceil((priceRsd / EUR_RATE) * (1 + PAYPAL_SURCHARGE));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug,
          fullName,
          email,
          country,
          paymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Došlo je do greške. Pokušaj ponovo.");
        return;
      }

      router.push(`/kupovina/hvala/${data.orderId}`);
    } catch {
      setError("Došlo je do greške. Proveri internet konekciju i pokušaj ponovo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order summary card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Tvoja porudžbina</p>
        <div className="flex items-start justify-between gap-4">
          <p className="font-semibold text-gray-900 text-[15px] leading-snug">{courseTitle}</p>
          <div className="text-right flex-shrink-0">
            {paymentMethod === "uplatnica" ? (
              <p className="font-bold text-gray-900">{formatPrice(priceRsd)} din</p>
            ) : (
              <div>
                <p className="font-bold text-gray-900">{displayEur} €</p>
                <p className="text-xs text-gray-400 mt-0.5">+12% PayPal naknada</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Tvoji podaci</p>

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            Ime i prezime
          </label>
          <input
            id="fullName"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ana Anić"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0AB3D7] focus:border-transparent transition"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email adresa
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ana@example.com"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0AB3D7] focus:border-transparent transition"
          />
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            Zemlja
          </label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0AB3D7] focus:border-transparent transition bg-white"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Payment method info */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Način plaćanja</p>
        {paymentMethod === "uplatnica" ? (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-9 h-9 bg-[#E8F7FC] rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-[#0AB3D7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Uplatnica / internet bankarstvo</p>
              <p className="text-gray-500 text-sm mt-0.5">
                Poslaćemo ti podatke za uplatu na email. Pristup kursu dobijaš čim potvrdimo uplatu.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-9 h-9 bg-[#FFF3F3] rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-[#F78687]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">PayPal</p>
              <p className="text-gray-500 text-sm mt-0.5">
                Poslaćemo ti PayPal link za plaćanje na email. Cena je u evrima i uključuje 12% PayPal naknadu.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-[#F78687] text-sm font-medium text-center">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#F78687] hover:bg-[#E06566] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-base py-4 rounded-xl transition-colors"
      >
        {loading ? "Slanje..." : "Naruči"}
      </button>
    </form>
  );
}
