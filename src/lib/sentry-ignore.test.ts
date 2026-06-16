import { describe, it, expect, vi, afterEach } from "vitest";
import {
  navigatorLock,
  NavigatorLockAcquireTimeoutError,
} from "@supabase/auth-js";
import { SENTRY_IGNORE_ERRORS } from "./sentry-ignore";

const matchesIgnoreList = (message: string) =>
  SENTRY_IGNORE_ERRORS.some((pattern) =>
    typeof pattern === "string" ? message.includes(pattern) : pattern.test(message)
  );

describe("Sentry ignore lista - Supabase auth lock greške", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("navigatorLock baca 'stole it' grešku kad drugi tab ukrade lock, a filter je hvata", async () => {
    // Simulira Web Locks API koji odbija zahtev AbortError-om dok NAŠ
    // acquire-timeout još nije istekao - tačno stanje kad drugi tab
    // izvrši steal:true nad lock-om koji mi držimo.
    vi.stubGlobal("navigator", {
      locks: {
        request: () =>
          Promise.reject(
            Object.assign(new Error("aborted"), { name: "AbortError" })
          ),
      },
    });

    let thrown: unknown;
    try {
      await navigatorLock("lock:sb-test-auth-token", 5000, async () => null);
    } catch (e) {
      thrown = e;
    }

    expect(thrown).toBeInstanceOf(NavigatorLockAcquireTimeoutError);
    const message = (thrown as Error).message;
    expect(message).toContain("was released because another request stole it");
    expect(matchesIgnoreList(message)).toBe(true);
  });

  it("hvata i acquire-timeout varijantu iste greške", () => {
    expect(
      matchesIgnoreList(
        'Acquiring an exclusive Navigator LockManager lock "lock:sb-x-auth-token" immediately failed'
      )
    ).toBe(true);
  });

  it("hvata iOS in-app browser (Meta WebView) webkit most grešku", () => {
    expect(
      matchesIgnoreList(
        "undefined is not an object (evaluating 'window.webkit.messageHandlers')"
      )
    ).toBe(true);
  });

  it("ne guta nepovezane greške", () => {
    expect(matchesIgnoreList("TypeError: Failed to fetch")).toBe(false);
    expect(matchesIgnoreList("Cannot read properties of undefined")).toBe(false);
  });
});
