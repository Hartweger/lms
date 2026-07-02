// src/lib/login-link.ts
// Login-link za mejlove: HMAC-potpisan token (email + next + rok) koji ruta
// /auth/mejl menja za SVEŽ Supabase magic link tek pri kliku. Zašto ne sirovi
// magic-link token u mejlu: ističe za ~1h, single-use, i svaki novi generateLink
// (npr. auto-login na nestpay callbacku) invalidira prethodni.
// Višekratan unutar roka (default 7 dana) - klik i sutra radi.
import { createHmac, timingSafeEqual } from "crypto";

interface LoginLinkPayload {
  email: string;
  next: string;
  exp: number; // epoch ms
}

function hmacKey(): string {
  const key = process.env.LOGIN_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!key) throw new Error("LOGIN_LINK_SECRET ili SUPABASE_SERVICE_ROLE_KEY mora biti postavljen");
  return key;
}

/** Relativna putanja bez open-redirect trikova (//host, protokoli, backslash). */
export function isSafeNext(next: string): boolean {
  return next.startsWith("/") && !next.startsWith("//") && !next.includes("\\");
}

export function createLoginLinkToken(
  o: { email: string; next: string; expiresInDays?: number },
  now: number = Date.now(),
): string {
  const next = isSafeNext(o.next) ? o.next : "/dashboard";
  const payload: LoginLinkPayload = {
    email: o.email.trim().toLowerCase(),
    next,
    exp: now + (o.expiresInDays ?? 7) * 86400000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", hmacKey()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyLoginLinkToken(
  token: string,
  now: number = Date.now(),
): { email: string; next: string } | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  let expected: Buffer;
  try {
    expected = createHmac("sha256", hmacKey()).update(body).digest();
  } catch {
    return null;
  }
  const given = Buffer.from(sig, "base64url");
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  let payload: LoginLinkPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof payload.email !== "string" || !payload.email) return null;
  if (typeof payload.exp !== "number" || payload.exp < now) return null;
  const next = typeof payload.next === "string" && isSafeNext(payload.next) ? payload.next : "/dashboard";
  return { email: payload.email, next };
}
