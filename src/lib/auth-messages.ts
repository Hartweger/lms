export interface AuthErrorLike {
  message?: string;
  status?: number | null;
}

function isInvalidCredentials(error: AuthErrorLike): boolean {
  const msg = (error.message ?? "").toLowerCase();
  return error.status === 400 || msg.includes("invalid login credentials");
}

// Baner na /prijava kad korisnik stigne sa ?greska= (redirect iz auth ruta).
// "link" = login-link iz mejla (auth/mejl) istekao ili pokvaren.
// "auth" = magic-link verifikacija nije prošla (redirect iz /auth/confirm i /auth/callback).
export function urlGreskaMessage(kod: string | null): string {
  if (kod === "link") {
    return "Link iz mejla je istekao. Ništa strašno - prijavi se ovde, traje pola minuta.";
  }
  if (kod === "auth") {
    return "Link za prijavu nije prošao (možda je već iskorišćen). Zatraži novi ovde.";
  }
  return "";
}

// Poruka kad čuvanje nove lozinke (/profil) ne prođe.
// Supabase odbija slabe/procurele lozinke i lozinku istu kao stara - bez konkretne
// poruke korisnik kuca istu lozinku u krug ("pokušaj ponovo" ništa ne menja).
export function passwordSaveErrorMessage(error: AuthErrorLike | null): string {
  if (!error) return "";
  const msg = (error.message ?? "").toLowerCase();
  if (msg.includes("weak") || msg.includes("pwned") || msg.includes("easy to guess")) {
    return "Ova lozinka je previše laka za pogađanje (nalazi se u poznatim listama procurelih lozinki). Izmisli nešto svoje - npr. dve-tri reči spojene i broj.";
  }
  if (msg.includes("should be different")) {
    return "To je ista lozinka koju već imaš. Upiši neku drugu.";
  }
  if (msg.includes("at least") || msg.includes("characters")) {
    return "Lozinka je prekratka - treba bar 6 karaktera.";
  }
  if (msg.includes("session") || error.status === 401) {
    return "Prijava je istekla dok si kucao/la. Zatraži novi link na stranici za prijavu pa probaj opet.";
  }
  if (error.status === 429) {
    return "Previše pokušaja. Sačekaj minut pa probaj ponovo.";
  }
  return "Lozinka nije sačuvana. Probaj drugu lozinku ili nam se javi na info@hartweger.rs.";
}

// Poruka koja se prikazuje kad prijava lozinkom ne uspe.
export function loginErrorMessage(error: AuthErrorLike | null): string {
  if (!error) return "";
  if ((error.message ?? "").toLowerCase().includes("captcha")) {
    return "Bezbednosna provera nije prošla. Osveži stranicu pa pokušaj ponovo.";
  }
  if (isInvalidCredentials(error)) {
    return "Lozinka nije prošla. Proveri da li je dobro ukucana - ili napravi novu za 30 sekundi.";
  }
  if (error.status === 429) {
    return "Previše pokušaja. Sačekaj minut pa probaj ponovo.";
  }
  return "Trenutno ne možemo da te prijavimo. Pokušaj ponovo za koji trenutak.";
}
