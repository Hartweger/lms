"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trackInitiateCheckout } from "@/lib/fbq";
import { EUR_RATE } from "@/lib/order-utils";
import { computeCouponDiscount } from "@/lib/coupon-discount";
import { professorsFromVariants, packageTypesFromVariants, resolveVariant, type Variant } from "@/lib/individual-pricing";
import { checkoutStrings } from "@/lib/product-i18n";

interface Props {
  courseSlug: string;
  courseTitle: string;
  priceRsd: number;
  priceEur: number | null;
  variants?: Variant[];
  includedLessons?: number | null;
  initialEmail?: string;
  initialName?: string;
  isLoggedIn?: boolean;
  lang?: "sr" | "en";
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

const COUNTRIES_EN = [
  { code: "DE", label: "Germany" }, { code: "AT", label: "Austria" },
  { code: "CH", label: "Switzerland" }, { code: "GB", label: "United Kingdom" },
  { code: "US", label: "USA" }, { code: "RS", label: "Serbia" },
  { code: "OTHER", label: "Other country" },
];

function formatPrice(price: number): string {
  return price.toLocaleString("de-DE");
}

export default function CheckoutForm({ courseSlug, courseTitle, priceRsd, variants = [], includedLessons = null, initialEmail = "", initialName = "", isLoggedIn = false, lang = "sr" }: Props) {
  const router = useRouter();
  void includedLessons;

  const en = lang === "en";
  const ct = checkoutStrings(lang ?? "sr");

  const isIndividual = variants.length > 0;
  const professors = professorsFromVariants(variants);
  const packageTypes = packageTypesFromVariants(variants);
  const PAKET_LABEL: Record<string, string> = ct.packageLabels;
  const [professorId, setProfessorId] = useState<string | null>(professors[0]?.id ?? null);
  const [packageType, setPackageType] = useState<string | null>(packageTypes[0] ?? null);
  const [fullName, setFullName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [emailLocked, setEmailLocked] = useState(isLoggedIn);
  const [country, setCountry] = useState(en ? "DE" : "RS");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCoupon, setShowCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountType: string; amount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const countryList = en ? COUNTRIES_EN : COUNTRIES;
  const isRS = country === "RS";
  const [method, setMethod] = useState<"kartica" | "uplatnica" | "paypal">("kartica");
  const paymentMethod = method;
  const isCard = method === "kartica";

  const selectedVariant = isIndividual ? resolveVariant(variants, { professorId, packageType }) : null;
  // Za individualne cena dolazi iz varijacije; inače prop priceRsd.
  const basePrice = isIndividual ? (selectedVariant?.price ?? 0) : priceRsd;
  const discountedRsd = appliedCoupon
    ? computeCouponDiscount(appliedCoupon.discountType, appliedCoupon.amount, basePrice).finalPrice
    : basePrice;
  const eurApprox = Math.round(discountedRsd / EUR_RATE);
  const eurDisplay = selectedVariant?.paypal_price_eur ?? eurApprox;

  // Meta Pixel - InitiateCheckout kad korisnik dođe na korak kupovine (jednom).
  useEffect(() => {
    trackInitiateCheckout({ contentId: courseSlug, contentName: courseTitle, value: basePrice, currency: "RSD" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function validateCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await fetch(
        `/api/coupons/validate?code=${encodeURIComponent(couponCode.trim())}` +
        `&courseSlug=${encodeURIComponent(courseSlug)}&email=${encodeURIComponent(email.trim())}` +
        `&packageType=${encodeURIComponent(isIndividual ? (packageType ?? "") : "")}`
      );
      const data = await res.json();
      if (!res.ok) { setCouponError(data.error || (en ? "Unknown error." : "Nepoznata greška.")); setAppliedCoupon(null); return; }
      setAppliedCoupon(data);
    } catch { setCouponError(en ? "Error checking the coupon." : "Greška pri proveri kupona."); }
    finally { setCouponLoading(false); }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError(null);
    setShowCoupon(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Atribucija (last-touch) iz first-party cookie-ja `hw_attr`
    let attribution: Record<string, string> | null = null;
    try {
      const c = document.cookie.split("; ").find((x) => x.startsWith("hw_attr="));
      if (c) attribution = JSON.parse(decodeURIComponent(c.split("=").slice(1).join("=")));
    } catch { /* ignore */ }

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
          couponCode: appliedCoupon?.code || null,
          professorId: isIndividual ? professorId : null,
          packageType: isIndividual ? packageType : null,
          attribution,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || (en ? "Something went wrong. Please try again." : "Došlo je do greške. Pokušaj ponovo."));
        return;
      }

      if (isCard) {
        window.location.href = `/kupovina/kartica/${data.orderId}`;
      } else {
        router.push(`/kupovina/hvala/${data.orderId}`);
      }
    } catch {
      setError(en ? "Something went wrong. Check your internet connection and try again." : "Došlo je do greške. Proveri internet konekciju i pokušaj ponovo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order summary card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">{ct.orderSummaryTitle}</p>
        <div className="flex items-start justify-between gap-4">
          <p className="font-semibold text-gray-900 text-[15px] leading-snug">{courseTitle}</p>
          <div className="text-right flex-shrink-0">
            {appliedCoupon ? (
              <div>
                <p className="text-sm text-gray-400 line-through">{formatPrice(basePrice)} din</p>
                <p className="font-bold text-gray-900">{en ? `${eurDisplay} €` : `${formatPrice(discountedRsd)} din`}</p>
                <p className="text-xs text-gray-400 mt-0.5">{en ? `≈ ${formatPrice(discountedRsd)} din` : `≈ ${eurApprox}€`}</p>
              </div>
            ) : (
              <div>
                <p className="font-bold text-gray-900">{en ? `${eurDisplay} €` : `${formatPrice(basePrice)} din`}</p>
                <p className="text-xs text-gray-400 mt-0.5">{en ? `≈ ${formatPrice(discountedRsd)} din` : `≈ ${eurApprox}€`}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Individualni: izbor profesorke / paketa + napomena */}
      {isIndividual && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{en ? "Choose" : "Izaberi"}</p>

          {packageTypes.length > 0 && (
            <div>
              <label htmlFor="paket" className="block text-sm font-medium text-gray-700 mb-1">{en ? "Number of sessions" : "Broj termina"}</label>
              <select id="paket" value={packageType ?? ""} onChange={(e) => setPackageType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0AB3D7]">
                {packageTypes.map((p) => (<option key={p} value={p}>{PAKET_LABEL[p] ?? p}</option>))}
              </select>
            </div>
          )}

          {professors.length > 1 && (
            <div>
              <label htmlFor="prof" className="block text-sm font-medium text-gray-700 mb-1">{en ? "Tutor" : "Profesorka"}</label>
              <select id="prof" value={professorId ?? ""} onChange={(e) => setProfessorId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0AB3D7]">
                {professors.map((p) => (<option key={p.id} value={p.id}>{p.full_name}</option>))}
              </select>
            </div>
          )}

          {!en && (
            <div className="bg-[#FFF7E6] border border-[#F0D9A0] rounded-lg p-3">
              <p className="text-xs text-[#8A6D3B] leading-relaxed">
                Pre uplate proveri mejlom na <a href="mailto:info@hartweger.rs" className="underline">info@hartweger.rs</a> da li je izabrana profesorka trenutno na raspolaganju za nove termine.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Coupon */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        {appliedCoupon ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-green-600">
              {en ? "Coupon" : "Kupon"} {appliedCoupon.code} - {appliedCoupon.discountType === "fixed"
                ? (en ? `${formatPrice(appliedCoupon.amount)} din off` : `${formatPrice(appliedCoupon.amount)} din popusta`)
                : (en ? `${appliedCoupon.amount}% off` : `${appliedCoupon.amount}% popusta`)}
            </p>
            <button
              type="button"
              onClick={removeCoupon}
              className="text-sm text-gray-400 hover:text-gray-600 underline flex-shrink-0"
            >
              {en ? "Remove" : "Ukloni"}
            </button>
          </div>
        ) : showCoupon ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder={en ? "Enter coupon code" : "Unesi kod kupona"}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0AB3D7] focus:border-transparent transition"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); validateCoupon(); } }}
              />
              <button
                type="button"
                onClick={validateCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="bg-[#0AB3D7] hover:bg-[#089bbf] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors flex-shrink-0"
              >
                {couponLoading ? "..." : ct.couponApply}
              </button>
            </div>
            {couponError && (
              <p className="text-[#F78687] text-sm">{couponError}</p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCoupon(true)}
            className="text-sm text-[#0AB3D7] hover:underline"
          >
            {ct.couponToggle}
          </button>
        )}
      </div>

      {/* Personal info */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{en ? "Your details" : "Tvoji podaci"}</p>

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            {ct.fullNameLabel}
          </label>
          <input
            id="fullName"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={en ? "John Smith" : "Ana Anić"}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0AB3D7] focus:border-transparent transition"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            {ct.emailLabel}
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={emailLocked}
            placeholder="ana@example.com"
            className={`w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0AB3D7] focus:border-transparent transition ${emailLocked ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
          />
          {isLoggedIn && emailLocked && (
            <p className="text-xs text-gray-500 mt-1">
              {en ? <>Buying as <strong>{email}</strong> - the course is activated on this account.{" "}</> : <>Kupuješ kao <strong>{email}</strong> - kurs se aktivira na ovom nalogu.{" "}</>}
              <button type="button" onClick={() => setEmailLocked(false)} className="text-[#0AB3D7] hover:underline">
                {en ? "I'm buying for someone else" : "Kupujem za nekog drugog"}
              </button>
            </p>
          )}
          {isLoggedIn && !emailLocked && (
            <p className="text-xs text-[#F78687] mt-1">
              {en ? "Access goes to the account with this email, not yours." : "Pristup ide na nalog sa ovim emailom, ne na tvoj."}{" "}
              <button type="button" onClick={() => { setEmail(initialEmail); setEmailLocked(true); }} className="text-[#0AB3D7] hover:underline">
                {en ? "Back to my account" : "Vrati na moj nalog"}
              </button>
            </p>
          )}
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            {ct.countryLabel}
          </label>
          <select
            id="country"
            value={country}
            onChange={(e) => { setCountry(e.target.value); setMethod("kartica"); }}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0AB3D7] focus:border-transparent transition bg-white"
          >
            {countryList.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Payment method info */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">{en ? "Payment method" : "Način plaćanja"}</p>
        <div className="space-y-2">
          {(isRS
            ? [
                { v: "kartica", label: ct.methodCard, desc: en ? "Visa, Mastercard, Maestro - secure payment via Banca Intesa. Banca Intesa cardholders can pay in installments - choose the number in the next step (on the bank's page)." : "Visa, Mastercard, Maestro - sigurno preko Banca Intesa. Vlasnici Banca Intesa kartica mogu na rate - broj rata biraš u sledećem koraku (na strani banke)." },
                { v: "uplatnica", label: ct.methodBank, desc: en ? "Payment details are sent by email; access after the payment is confirmed." : "Podaci za uplatu stižu na email; pristup po potvrdi uplate." },
              ]
            : [
                { v: "kartica", label: ct.methodCard, desc: en ? "Visa, Mastercard, Maestro - secure payment via Banca Intesa. Charged in RSD (your bank converts to your currency)." : "Visa, Mastercard, Maestro - sigurno preko Banca Intesa. Naplata u dinarima (tvoja banka konvertuje u tvoju valutu)." },
                { v: "paypal", label: ct.methodPaypal, desc: en ? "A PayPal link is sent by email. Charged in EUR." : "PayPal link stiže na email. Naplata u evrima, uključuje 12% PayPal naknadu." },
              ]
          ).map((m) => (
            <label
              key={m.v}
              className={`flex items-start gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${method === m.v ? "border-[#0AB3D7] bg-[#E8F7FC]" : "border-gray-200 hover:border-gray-300"}`}
            >
              <input
                type="radio"
                name="method"
                value={m.v}
                checked={method === m.v}
                onChange={() => setMethod(m.v as typeof method)}
                className="mt-1"
              />
              <span>
                <span className="block font-semibold text-gray-900 text-sm">{m.label}</span>
                <span className="block text-gray-500 text-xs mt-0.5">{m.desc}</span>
              </span>
            </label>
          ))}
        </div>
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
        {loading ? (en ? "Sending..." : "Slanje...") : ct.payButton}
      </button>
    </form>
  );
}
