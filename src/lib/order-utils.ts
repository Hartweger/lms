export const EUR_RATE = 117;
export const PAYPAL_SURCHARGE = 0.12;

export const BANK_DETAILS = {
  primalac: "Hartweger, Beograd, 11070 Beograd",
  racun: "170-10559767000-18",
  sifraPalcanja: "189",
  model: "",
};

export const PAYPAL_ME_URL = "https://www.paypal.com/paypalme/natasahartweger1";

export async function generateOrderNumber(): Promise<string> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const year = new Date().getFullYear();
  const startOfYear = `${year}-01-01T00:00:00.000Z`;
  const endOfYear = `${year + 1}-01-01T00:00:00.000Z`;

  const { count, error } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfYear)
    .lt("created_at", endOfYear);

  if (error) {
    throw new Error(`Failed to generate order number: ${error.message}`);
  }

  const seq = ((count ?? 0) + 1).toString().padStart(3, "0");
  return `${year}-${seq}`;
}

export function calculatePaypalEur(priceRsd: number): number {
  return Math.ceil((priceRsd / EUR_RATE) * (1 + PAYPAL_SURCHARGE));
}
