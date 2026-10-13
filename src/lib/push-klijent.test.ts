import { describe, it, expect } from "vitest";
import { base64UrlUBajtove, jeIosBezPwa } from "./push-klijent";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const IPAD_DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";

describe("base64UrlUBajtove", () => {
  it("dekodira base64url bez dopune", () => {
    expect(Array.from(base64UrlUBajtove("TWE"))).toEqual([77, 97]);
  });

  it("prevodi - i _ u + i /", () => {
    expect(Array.from(base64UrlUBajtove("-_8"))).toEqual([251, 255]);
  });

  it("vraća Uint8Array", () => {
    expect(base64UrlUBajtove("TWE")).toBeInstanceOf(Uint8Array);
  });
});

describe("jeIosBezPwa", () => {
  it("iPhone u tabu - da", () => {
    expect(jeIosBezPwa(IPHONE, false, 5)).toBe(true);
  });

  it("iPhone kao instalirana PWA - ne", () => {
    expect(jeIosBezPwa(IPHONE, true, 5)).toBe(false);
  });

  it("iPad koji se predstavlja kao desktop Safari - da", () => {
    expect(jeIosBezPwa(IPAD_DESKTOP_UA, false, 5)).toBe(true);
  });

  it("pravi Mac (bez dodira) - ne", () => {
    expect(jeIosBezPwa(IPAD_DESKTOP_UA, false, 0)).toBe(false);
  });

  it("Android - ne", () => {
    expect(jeIosBezPwa(ANDROID, false, 5)).toBe(false);
  });
});
