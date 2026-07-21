// src/lib/ga4-user-data.ts
// Enhanced Conversions: heširan mejl kupca za GA4 Measurement Protocol `user_data`.
// Google zahteva normalizaciju PRE heširanja: mala slova, bez ivičnih razmaka,
// a za gmail.com/googlemail.com i bez tačaka u lokalnom delu.

import { createHash } from "crypto";

export function normalizeEmailForGoogle(email: string | null | undefined): string | null {
  const trimmed = (email ?? "").trim().toLowerCase();
  const at = trimmed.indexOf("@");
  if (at < 1 || at === trimmed.length - 1) return null;
  let local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (domain === "gmail.com" || domain === "googlemail.com") {
    local = local.replace(/\./g, "");
  }
  return `${local}@${domain}`;
}

export function ga4UserData(
  email: string | null | undefined,
): { sha256_email_address: string } | null {
  const normalized = normalizeEmailForGoogle(email);
  if (!normalized) return null;
  return {
    sha256_email_address: createHash("sha256").update(normalized).digest("hex"),
  };
}
