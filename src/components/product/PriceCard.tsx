import Link from "next/link";
import BuyButton from "@/components/BuyButton";
import { productStrings, formatMoney, type Lang } from "@/lib/product-i18n";

interface Props {
  price: number;
  priceEur: number | null;
  slug: string;
  ctaLabel: string;
  isVariable?: boolean;
  title: string;
  lang?: Lang;
}

export default function PriceCard({ price, priceEur, slug, ctaLabel, isVariable, title, lang = "sr" }: Props) {
  const en = lang === "en";
  const t = productStrings(lang);
  const primary = en && priceEur != null ? formatMoney(priceEur, "EUR") : formatMoney(price, "RSD");
  const secondary = en ? (price ? `≈ ${formatMoney(price, "RSD")}` : null)
                       : (priceEur ? `≈ ${priceEur}€` : null);
  const bullets = en
    ? ["Book your lessons right after payment", "Secure card payment (Visa, Mastercard)", "3000+ happy students"]
    : ["Pristup odmah nakon uplate", "Kartica, uplatnica ili PayPal", "3000+ zadovoljnih polaznika"];
  const questionText = en ? "Have a question?" : "Imate pitanje?";
  const questionLink = en ? "Write to us" : "Pišite nam";

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-xl shadow-gray-200/60 overflow-hidden lg:sticky lg:top-24">
      <div className="bg-gray-50 px-7 py-6 text-center border-b border-gray-100">
        <p className="text-4xl font-bold text-gray-900">
          {isVariable && t.pricePrefixFrom}
          {primary}
        </p>
        {secondary && (
          <p className="text-[#F78687] font-bold text-sm mt-1.5">{secondary}</p>
        )}
      </div>

      <div className="p-7">
        <BuyButton
          slug={slug}
          contentId={slug}
          contentName={title}
          value={price}
          className="block w-full text-center bg-[#F78687] hover:bg-[#e06060] text-white font-bold text-lg py-4 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-[#F78687]/25"
        >
          {ctaLabel}
        </BuyButton>

        <div className="mt-6 space-y-3.5">
          {bullets.map((text, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-gray-500">
              <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              {text}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-400">
            {questionText}{" "}
            <Link href="/kontakt" className="text-plava hover:underline font-medium">{questionLink}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
