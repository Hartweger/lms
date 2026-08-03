import { afterEach, describe, expect, it, vi } from "vitest";
import { detektujUredjaj, jeInstalirano } from "./uredjaj";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const IPAD_OS =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";
const MAC_DESKTOP =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

function stubNavigator(navigatorLike: Record<string, unknown>) {
  vi.stubGlobal("navigator", navigatorLike);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("detektujUredjaj", () => {
  it("prepoznaje iPhone", () => {
    stubNavigator({ userAgent: IPHONE, maxTouchPoints: 5 });
    expect(detektujUredjaj()).toBe("ios");
  });

  it("prepoznaje iPadOS koji se predstavlja kao Macintosh", () => {
    stubNavigator({ userAgent: IPAD_OS, maxTouchPoints: 5 });
    expect(detektujUredjaj()).toBe("ios");
  });

  it("prepoznaje Android", () => {
    stubNavigator({ userAgent: ANDROID, maxTouchPoints: 5 });
    expect(detektujUredjaj()).toBe("android");
  });

  it("Mac bez touch ekrana nije iOS", () => {
    stubNavigator({ userAgent: MAC_DESKTOP, maxTouchPoints: 0 });
    expect(detektujUredjaj()).toBe("ostalo");
  });
});

describe("jeInstalirano", () => {
  it("tačno kad je display-mode standalone", () => {
    stubNavigator({ userAgent: ANDROID });
    vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
    expect(jeInstalirano()).toBe(true);
  });

  it("tačno kad Safari prijavi navigator.standalone", () => {
    stubNavigator({ userAgent: IPHONE, standalone: true });
    vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
    expect(jeInstalirano()).toBe(true);
  });

  it("netačno u običnom tabu browsera", () => {
    stubNavigator({ userAgent: IPHONE, standalone: false });
    vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
    expect(jeInstalirano()).toBe(false);
  });
});
