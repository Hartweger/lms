const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const e = raw.trim().toLowerCase();
  return EMAIL_RE.test(e) ? e : null;
}

function normHandle(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const h = raw.trim().replace(/^@/, "").toLowerCase();
  return h.length ? h : null;
}

interface MatchRow { id: string; email: string | null; instagram_handle: string | null }

export function pickMatch(
  rows: MatchRow[],
  key: { email: string | null; instagram: string | null },
): string | null {
  const email = normalizeEmail(key.email);
  if (email) {
    const byEmail = rows.find((r) => normalizeEmail(r.email) === email);
    if (byEmail) return byEmail.id;
  }
  const ig = normHandle(key.instagram);
  if (ig) {
    const byIg = rows.find((r) => normHandle(r.instagram_handle) === ig);
    if (byIg) return byIg.id;
  }
  return null;
}

/**
 * SVI redovi sa tim mejlom (isto poređenje kao pickMatch). Baza ima jedinstven indeks
 * na lower(email), pa ih je u praksi najviše jedan - ali pozivalac koji MENJA redove
 * ne sme da pretpostavi to, nego da obiđe sve što nađe.
 */
export function pickAllByEmail<T extends { email: string | null }>(
  rows: T[],
  rawEmail: string | null | undefined,
): T[] {
  const email = normalizeEmail(rawEmail);
  if (!email) return [];
  return rows.filter((r) => normalizeEmail(r.email) === email);
}
