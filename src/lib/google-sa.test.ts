import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { normalizujKljuc, napraviJwt } from "./google-sa";

const { privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

function telo(jwt: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString("utf8"));
}

/** Jedini sud koji je bitan: od normalizovanog ključa Node ume da napravi ključ i da potpiše. */
function upotrebljiv(k: string): string {
  return crypto.createSign("RSA-SHA256").update("proba").sign(k).toString("base64url");
}

describe("normalizujKljuc", () => {
  const ocekivano = upotrebljiv(privateKey);

  it("ispravan PEM radi", () => {
    expect(upotrebljiv(normalizujKljuc(privateKey))).toBe(ocekivano);
  });

  it("literalni \\n umesto preloma reda - tako ključ stiže iz Vercel env-a", () => {
    expect(upotrebljiv(normalizujKljuc(privateKey.replace(/\n/g, "\\n")))).toBe(ocekivano);
  });

  it("ceo JSON servisnog naloga, nalepljen kako je preuzet", () => {
    const json = JSON.stringify({ type: "service_account", private_key: privateKey });
    expect(upotrebljiv(normalizujKljuc(json))).toBe(ocekivano);
  });

  it("pod navodnicima", () => {
    expect(upotrebljiv(normalizujKljuc(`"${privateKey.replace(/\n/g, "\\n")}"`))).toBe(ocekivano);
  });
});

describe("napraviJwt", () => {
  it("bez subject-a nema sub - servisni nalog govori u svoje ime (GA4)", () => {
    const t = telo(napraviJwt({ saEmail: "sa@x.iam.gserviceaccount.com", privateKey, scope: "s" }, 1000));
    expect(t.sub).toBeUndefined();
    expect(t).toMatchObject({ iss: "sa@x.iam.gserviceaccount.com", scope: "s", iat: 1000, exp: 4600 });
  });

  it("sa subject-om se predstavlja kao korisnik - bez toga Gmail nema čije sanduče da otvori", () => {
    const t = telo(
      napraviJwt({ saEmail: "sa@x.iam.gserviceaccount.com", privateKey, scope: "s", subject: "info@hartweger.rs" }, 1000),
    );
    expect(t.sub).toBe("info@hartweger.rs");
  });
});
