export interface AuthErrorLike {
  message?: string;
  status?: number | null;
}

function isInvalidCredentials(error: AuthErrorLike): boolean {
  const msg = (error.message ?? "").toLowerCase();
  return error.status === 400 || msg.includes("invalid login credentials");
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
