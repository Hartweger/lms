import Link from "next/link";
import BuyButton from "@/components/BuyButton";

interface Props {
  price: number;
  priceEur: number | null;
  slug: string;
  ctaLabel: string;
  isVariable?: boolean;
  title: string;
}

function formatPrice(price: number): string {
  return price.toLocaleString("de-DE");
}

export default function PriceCard({ price, priceEur, slug, ctaLabel, isVariable, title }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-xl shadow-gray-200/60 overflow-hidden lg:sticky lg:top-24">
      {/* Price */}
      <div className="bg-gray-50 px-7 py-6 text-center border-b border-gray-100">
        <p className="text-4xl font-bold text-gray-900">
          {isVariable && "od "}
          {formatPrice(price)} <span className="text-xl font-semibold text-gray-400">din</span>
        </p>
        {priceEur && (
          <p className="text-[#F78687] font-bold text-sm mt-1.5">≈ {priceEur}€</p>
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
          {["Pristup odmah nakon uplate", "Kartica, uplatnica ili PayPal", "3000+ zadovoljnih polaznika"].map((text, i) => (
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
            Imate pitanje?{" "}
            <Link href="/kontakt" className="text-plava hover:underline font-medium">Pišite nam</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
