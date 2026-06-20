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
