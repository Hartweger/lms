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
