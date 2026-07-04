// Strožija provera mejl adrese nego staro /^[^\s@]+@[^\s@]+\.[^\s@]+$/ — ono propušta
// TLD sa ciframa ("gmail.com5"), koji Resend odbija sa "Invalid `to` field" (Sentry 40ddd5d2).
// TLD mora biti najmanje 2 slova, bez cifara.
const DELIVERABLE_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function isDeliverableEmail(email: string): boolean {
  return DELIVERABLE_EMAIL_RE.test(email);
}
