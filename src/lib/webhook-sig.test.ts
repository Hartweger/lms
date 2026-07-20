import { describe, expect, it } from "vitest";
import crypto from "crypto";
import { verifyWcSignature } from "./webhook-sig";

const SECRET = "test-secret";

function sign(body: string, secret = SECRET) {
  return crypto.createHmac("sha256", secret).update(body).digest("base64");
}

describe("verifyWcSignature", () => {
  it("prihvata ispravan potpis", () => {
    const body = '{"id":123,"status":"completed"}';
    expect(verifyWcSignature(body, sign(body), SECRET)).toBe(true);
  });

  it("odbija potpis sa pogrešnim secretom", () => {
    const body = '{"id":123}';
    expect(verifyWcSignature(body, sign(body, "drugi-secret"), SECRET)).toBe(false);
  });

  it("odbija potpis za izmenjen body", () => {
    const body = '{"id":123}';
    expect(verifyWcSignature('{"id":124}', sign(body), SECRET)).toBe(false);
  });

  it("odbija prazan potpis bez bacanja (timingSafeEqual traži iste dužine)", () => {
    expect(verifyWcSignature('{"id":123}', "", SECRET)).toBe(false);
  });

  it("odbija potpis pogrešne dužine bez bacanja", () => {
    expect(verifyWcSignature('{"id":123}', "kratko", SECRET)).toBe(false);
  });

  it("odbija sve kad je secret prazan (env nije podešen)", () => {
    const body = '{"id":123}';
    expect(verifyWcSignature(body, sign(body, ""), "")).toBe(false);
  });
});
