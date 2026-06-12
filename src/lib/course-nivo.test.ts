import { describe, it, expect } from "vitest";
import { funnelUrlsForNivo, nivoForSlug, SLUG_TO_NIVO } from "./course-nivo";

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

describe("funnelUrlsForNivo", () => {
  it("za A2.1 daje grupni, individualni i video kurs nivoa", () => {
    const u = funnelUrlsForNivo("A2.1");
    expect(u.grupniUrl).toContain("/kursevi/grupni-kurs-nemackog-jezika-a2");
    expect(u.individualniUrl).toContain("/kursevi/individualni-kurs-nemackog-jezika-a2");
    expect(u.videoUrl).toContain("/kursevi/video-kurs-a2");
  });
  it("za C1.1 nema video kursa (fallback na katalog)", () => {
    const u = funnelUrlsForNivo("C1.1");
    expect(u.videoUrl).toBeNull();
    expect(u.kurseviUrl).toContain("/kursevi");
  });
  it("C1+ se mapira na C1.1", () => {
    expect(funnelUrlsForNivo("C1+").grupniUrl).toContain("grupni-kurs-c1-1");
  });
});
