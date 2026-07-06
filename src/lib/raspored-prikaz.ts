// Zajedničke display konstante za raspored grupa.
// Koriste ih RasporedGrupa (/grupni-kursevi) i RasporedKartice (/raspored).
// Cene NISU ovde - dolaze iz baze kurseva (GrupaRaspored.cena/cenaEur).

export const nivoColors: Record<string, { bg: string; text: string }> = {
  A1: { bg: "#e0f6fb", text: "#0776a0" },
  A2: { bg: "#d6f0f9", text: "#065e88" },
  B1: { bg: "#fef3e2", text: "#7a4800" },
  B2: { bg: "#fde8e8", text: "#b52a2a" },
  C1: { bg: "#fde4f0", text: "#952060" },
};

export const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1"];

// Fallback za ~€ prikaz kad kurs nema paypal_price_eur.
export const EUR_RATE = 117;

export function getNivoKey(nivo: string): string {
  // "A1.1" → "A1", "b2.2" → "B2"
  return nivo.substring(0, 2).toUpperCase();
}

export function formatPrice(price: number): string {
  return price.toLocaleString("de-DE");
}
