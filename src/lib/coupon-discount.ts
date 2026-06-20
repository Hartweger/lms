/**
 * Obračun popusta kupona nad cenom (RSD). DRY izvor za /api/coupons/validate,
 * /api/orders i CheckoutForm.
 *  - "fixed"   -> skida fiksni iznos (amount), clamp na cenu (finalna >= 0)
 *  - inače     -> procenat (amount %), zaokruženo (zatečeno ponašanje)
 * PayPal EUR se i dalje izvodi iz finalPrice preko calculatePaypalEur, pa je
 * EUR popust automatski tačan i ne čuva se posebno.
 */
export function computeCouponDiscount(
  discountType: string,
  amount: number,
  unitPrice: number
): { discount: number; finalPrice: number } {
  let discount: number;
  if (discountType === "fixed") {
    discount = Math.min(Math.round(amount), unitPrice);
  } else {
    discount = Math.round((unitPrice * amount) / 100);
  }
  if (discount < 0) discount = 0;
  return { discount, finalPrice: unitPrice - discount };
}

/**
 * Individualni 1:1 paketi po broju termina. Kupon sa `term_packages_only`
 * (npr. prof-kuponi IME10) važi samo kada je izabrani paket jedan od ovih -
 * ne za mesečne, video ni jednokratne kupovine.
 */
export const TERM_PACKAGE_TYPES = ["paket4", "paket8", "paket12"] as const;

export function isTermPackage(packageType: string | null | undefined): boolean {
  return !!packageType && (TERM_PACKAGE_TYPES as readonly string[]).includes(packageType);
}
