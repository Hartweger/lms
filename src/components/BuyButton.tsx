"use client";

import Link from "next/link";
import { trackAddToCart } from "@/lib/fbq";

interface Props {
  slug: string;
  className?: string;
  contentId: string;
  contentName: string;
  value: number;
  currency?: string;
  children: React.ReactNode;
}

/**
 * CTA dugme "Kupi / Kupi kurs / Prijavi se" koje vodi na /kupovina/[slug].
 * Sajt nema klasičnu korpu - klik na ovo dugme je trenutak "Dodaj u korpu",
 * pa tu šaljemo Meta Pixel AddToCart događaj.
 */
export default function BuyButton({ slug, className, contentId, contentName, value, currency = "RSD", children }: Props) {
  return (
    <Link
      href={`/kupovina/${slug}`}
      className={className}
      onClick={() => trackAddToCart({ contentId, contentName, value, currency })}
    >
      {children}
    </Link>
  );
}
