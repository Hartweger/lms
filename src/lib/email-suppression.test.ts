import { describe, it, expect } from "vitest";
import { isPermanentBounce } from "./email-suppression";

const HARD = "The recipient's email provider sent a hard bounce message, but didn't specify the reason for the hard bounce. We recommend removing the recipient's email address from your mailing list.";
const FULL = "The recipient's email provider sent a bounce message because the recipient's inbox was full. You might be able to send to the same recipient in the future when the mailbox is no longer full.";
const OPSTI = "The recipient's email provider sent a general bounce message. You might be able to send a message to the same recipient in the future if the issue that caused the message to bounce is resolved.";

describe("isPermanentBounce", () => {
  it("jedan hard bounce je dovoljan - Resend sam preporučuje uklanjanje", () => {
    expect(isPermanentBounce([{ reason: HARD }])).toBe(true);
  });

  it("pun inboks NIJE trajan, ni kad se ponovi četiri puta - iza njega je živ čovek", () => {
    expect(isPermanentBounce(Array(4).fill({ reason: FULL }))).toBe(false);
  });

  it("dva opšta odbačaja = adresa ne postoji (slučaj sasemaks2@gmail.con)", () => {
    expect(isPermanentBounce([{ reason: OPSTI }, { reason: OPSTI }])).toBe(true);
  });

  it("jedan opšti odbačaj se toleriše - može biti privremen kvar kod provajdera", () => {
    expect(isPermanentBounce([{ reason: OPSTI }])).toBe(false);
  });

  it("pun inboks se ne sabira sa opštim odbačajem u prag od dva", () => {
    expect(isPermanentBounce([{ reason: FULL }, { reason: OPSTI }])).toBe(false);
  });

  it("hard bounce presuđuje i kad ostali razlozi jesu privremeni", () => {
    expect(isPermanentBounce([{ reason: FULL }, { reason: HARD }])).toBe(true);
  });

  it("bez odbačaja nema zabrane", () => {
    expect(isPermanentBounce([])).toBe(false);
  });

  it("prazan razlog se broji kao odbačaj bez objašnjenja, ne kao privremen", () => {
    expect(isPermanentBounce([{ reason: null }, { reason: null }])).toBe(true);
  });
});
