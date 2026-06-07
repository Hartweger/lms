import { describe, it, expect } from "vitest";
import { nivoForSlug, SLUG_TO_NIVO } from "./course-nivo";

describe("nivoForSlug", () => {
  it("vraća nivo za poznati grupni slug", () => {
    expect(nivoForSlug("grupni-kurs-nemackog-jezika-a1-1")).toBe("A1.1");
    expect(nivoForSlug("grupni-kurs-b2-1")).toBe("B2.1");
  });
  it("vraća null za nepoznat slug", () => {
    expect(nivoForSlug("nepostojeci-kurs")).toBeNull();
  });
  it("mapa sadrži sve grupne nivoe", () => {
    expect(SLUG_TO_NIVO["grupni-kurs-c1-2"]).toBe("C1.2");
  });
});
