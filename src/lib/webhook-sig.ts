import crypto from "crypto";

// Konstantno-vremensko poređenje WooCommerce HMAC potpisa (audit jul 2026:
// `signature !== expectedSig` je merljivo brže odbijao pogrešan prefiks).
// Provera dužine pre timingSafeEqual je nužna (baca na različite dužine) i
// odaje samo dužinu očekivanog potpisa, ne i sadržaj.
export function verifyWcSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest();
  const received = Buffer.from(signature, "base64");
  return (
    received.length === expected.length &&
    crypto.timingSafeEqual(received, expected)
  );
}
