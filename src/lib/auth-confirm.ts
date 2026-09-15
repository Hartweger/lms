// Pomoćne funkcije za magic-link potvrdu (/auth/confirm i /auth/potvrda).
//
// Zašto međukorak sa dugmetom: token iz mejla je JEDNOKRATAN. Gmail/Outlook
// pregledi linkova i ugrađeni pregledači umeju da otvore link pre polaznika
// (ili polaznik klikne dvaput), pa drugi otvor završi na /prijava?greska=auth
// („vraća me nazad" - zlatareza, 14.09.2026). Zato GET više ne troši token:
// prikaže dugme, a tek POST radi verifyOtp. Skeneri ne šalju POST.

export const OTP_TYPES = ["magiclink", "recovery", "email", "signup", "invite", "email_change"] as const;
export type OtpType = (typeof OTP_TYPES)[number];

export function isOtpType(type: string | null | undefined): type is OtpType {
  return typeof type === "string" && (OTP_TYPES as readonly string[]).includes(type);
}

// Čuva od open-redirecta: sme samo relativna putanja na našem domenu.
export function safeNext(next: string | null | undefined, fallback = "/dashboard"): string {
  if (typeof next !== "string" || next.length === 0) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

// Linkovi koje NAŠ server sam otvara u polaznikovom browseru (auto-login posle
// plaćanja, admin „uđi kao polaznik") nose auto=1 i verifikuju se odmah - tu
// nema mejla, pa ni skenera. Mejl-šabloni NEMAJU auto=1 i dobijaju dugme.
export function needsClick(auto: string | null | undefined): boolean {
  return auto !== "1";
}

export function potvrdaUrl(params: { token_hash: string; type: OtpType; next: string }): string {
  const q = new URLSearchParams({ token_hash: params.token_hash, type: params.type, next: params.next });
  return `/auth/potvrda?${q.toString()}`;
}

// Tekst dugmeta i naslova na /auth/potvrda po tipu linka.
export function potvrdaTekst(type: OtpType): { naslov: string; dugme: string } {
  if (type === "recovery") {
    return { naslov: "Još jedan klik do nove lozinke", dugme: "Postavi novu lozinku" };
  }
  return { naslov: "Još jedan klik i unutra si", dugme: "Prijavi me" };
}
