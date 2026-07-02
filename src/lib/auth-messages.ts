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

// Poruka koja se prikazuje kad prijava lozinkom ne uspe.
export function loginErrorMessage(error: AuthErrorLike | null): string {
  if (!error) return "";
  if (isInvalidCredentials(error)) {
    return "Lozinka nije prošla. Ako si ranije bio/la na staroj platformi, stara lozinka ovde ne važi - napravi novu za 30 sekundi.";
  }
  if (error.status === 429) {
    return "Previše pokušaja. Sačekaj minut pa probaj ponovo.";
  }
  return "Trenutno ne možemo da te prijavimo. Pokušaj ponovo za koji trenutak.";
}
