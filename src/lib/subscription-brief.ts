// src/lib/subscription-brief.ts
// Pretplate u jutarnjem pregledu. Bez ovoga naplate 2..N prolaze potpuno tiho:
// mejl ide kupcu, fiskalni račun se izda sam, a Nataša vidi samo bezimeni zbir
// „nove narudžbine juče". Otkazivanje i pala naplata se do sada nisu videli nigde.
import { cancelReasonLabel } from "@/lib/subscription-cancel-reason";

export interface BriefNaplata {
  ime: string;
  rata: number;
  ukupno: number;
  iznos: number;
}

export interface BriefPala {
  ime: string;
  rata: number | null;
  pokusaj: number;
  /** Banka je odbila da pomeri palu naplatu - ranijeg pokušaja NEMA, čeka se redovan termin. */
  odbijeno: boolean;
}

export interface BriefOtkaz {
  ime: string;
  placeno: number;
  ukupno: number;
  razlog: string;
}

export interface SubscriptionBrief {
  naplaceno: BriefNaplata[];
  pale: BriefPala[];
  otkazano: BriefOtkaz[];
  aktivnih: number;
  mesecno: number;
}

export interface SubscriptionBriefInput {
  naplaceneRate: { ime: string | null; rata: number; ukupno: number; iznos: number }[];
  aktivne: {
    ime: string | null;
    amount: number;
    baseOid: string;
    retryOid: string | null;
    retryCount: number;
    lastRetryError?: string | null;
    /** Kad je banka poslednji put odgovorila na ponovni pokušaj (`subscriptions.last_retry_at`). */
    lastRetryAt?: string | null;
  }[];
  otkazane: { ime: string | null; paidPayments: number; totalPayments: number; cancelReason: string | null }[];
  /**
   * Jučerašnji dan [od, do) u ISO zapisu. Odbijena pala rata (CORE-5107) se javlja
   * samo u pregledu za dan kad je banka odbila - `retry_oid` se nikad ne briše, pa
   * bi se inače ista rata ponavljala svako jutro do kraja serije (Sonja, Milan,
   * Nemanja: 16.09.2026). Bez prozora se ponaša kao ranije (svaki dan).
   */
  prozor?: { od: string; do: string };
}

/**
 * Rate iz serije nose oid `<osnovni>-N` (šema banke, potvrđena na testu 21.07.2026).
 * Osnovni oid je i sam oblika `2026-227`, pa se broj rate ne sme čitati bez njega -
 * inače bi broj porudžbine ispao „rata 227".
 */
export function rataIzOida(oid: string, baseOid: string): number | null {
  if (!oid.startsWith(`${baseOid}-`)) return null;
  const rest = oid.slice(baseOid.length + 1);
  return /^\d+$/.test(rest) ? Number(rest) : null;
}

const ime = (v: string | null) => v ?? "-";

function uProzoru(t: string | null | undefined, p: { od: string; do: string }): boolean {
  if (!t) return false;
  const ms = new Date(t).getTime();
  return ms >= new Date(p.od).getTime() && ms < new Date(p.do).getTime();
}

export function buildSubscriptionBrief(input: SubscriptionBriefInput): SubscriptionBrief {
  return {
    naplaceno: input.naplaceneRate.map((r) => ({ ime: ime(r.ime), rata: r.rata, ukupno: r.ukupno, iznos: r.iznos })),
    // Pala je ona pretplata kojoj je naplata odbijena: serija je i dalje aktivna i
    // ostaje u mesečnom prihodu, ali novac za taj mesec još nije stigao.
    // `retryOid` se od 25.08.2026. upisuje i kad banka odbije pomeranje - do tada je
    // ovaj filter propuštao baš one slučajeve u kojima ništa ne radi samo od sebe.
    pale: input.aktivne
      .filter((s) => s.retryOid !== null)
      // Odbijena (ništa se više ne dešava samo od sebe, a ni ručno - odluka 09.09.2026)
      // ide u pregled samo jednom: kad je banka odbila. Zakazan pokušaj se vidi dok traje.
      .filter((s) => !s.lastRetryError || !input.prozor || uProzoru(s.lastRetryAt, input.prozor))
      .map((s) => ({
        ime: ime(s.ime),
        rata: rataIzOida(s.retryOid as string, s.baseOid),
        pokusaj: s.retryCount,
        odbijeno: !!s.lastRetryError,
      })),
    otkazano: input.otkazane.map((s) => ({
      ime: ime(s.ime),
      placeno: s.paidPayments,
      ukupno: s.totalPayments,
      razlog: cancelReasonLabel(s.cancelReason),
    })),
    aktivnih: input.aktivne.length,
    mesecno: input.aktivne.reduce((s, r) => s + r.amount, 0),
  };
}
