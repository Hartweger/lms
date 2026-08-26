import { describe, expect, it, vi } from "vitest";
import { courseAllowsLateJoin } from "./coupon-late-join";

// Lažni Supabase: beleži na koju tabelu i sa kojim filterima je otišao upit.
function fakeAdmin(redovi: { id: string }[]) {
  const filteri: Record<string, unknown> = {};
  const lanac = {
    select: () => lanac,
    eq: (k: string, v: unknown) => {
      filteri[k] = v;
      return lanac;
    },
    limit: () => Promise.resolve({ data: redovi }),
  };
  const from = vi.fn(() => lanac);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { admin: { from } as any, filteri, from };
}

describe("courseAllowsLateJoin", () => {
  it("propušta grupni kurs čiji nivo ima otvorenu grupu sa naknadnim upisom", async () => {
    const { admin, filteri } = fakeAdmin([{ id: "g1" }]);
    const ok = await courseAllowsLateJoin(admin, {
      slug: "grupni-kurs-nemackog-jezika-a2",
      course_type: "group",
    });
    expect(ok).toBe(true);
    expect(filteri).toEqual({ level: "A2.1", status: "otvoren", naknadni_upis: true });
  });

  it("odbija kad nijedna grupa tog nivoa ne prima naknadni upis", async () => {
    const { admin } = fakeAdmin([]);
    expect(
      await courseAllowsLateJoin(admin, {
        slug: "grupni-kurs-nemackog-jezika-a2",
        course_type: "group",
      }),
    ).toBe(false);
  });

  // Zamka: SLUG_TO_NIVO mapira i individualne kurseve na isti nivo. Bez provere
  // course_type kod bi curio na 1:1 proizvod od 33.000, gde nema grupe.
  it("odbija individualni kurs istog nivoa i ne dira bazu", async () => {
    const { admin, from } = fakeAdmin([{ id: "g1" }]);
    expect(
      await courseAllowsLateJoin(admin, {
        slug: "individualni-kurs-nemackog-jezika-a2",
        course_type: "individual",
      }),
    ).toBe(false);
    expect(from).not.toHaveBeenCalled();
  });

  it("odbija video kurs", async () => {
    const { admin, from } = fakeAdmin([{ id: "g1" }]);
    expect(
      await courseAllowsLateJoin(admin, { slug: "video-kurs-a2", course_type: "video" }),
    ).toBe(false);
    expect(from).not.toHaveBeenCalled();
  });

  it("odbija grupni kurs koji nije u mapi nivoa", async () => {
    const { admin, from } = fakeAdmin([{ id: "g1" }]);
    expect(
      await courseAllowsLateJoin(admin, { slug: "nepoznat-grupni-kurs", course_type: "group" }),
    ).toBe(false);
    expect(from).not.toHaveBeenCalled();
  });

  it("radi i za konverzacijski, čiji nivo nije CEFR podnivo", async () => {
    const { admin, filteri } = fakeAdmin([{ id: "g1" }]);
    expect(
      await courseAllowsLateJoin(admin, {
        slug: "grupni-konverzacijski-kurs-nemackog-b1",
        course_type: "group",
      }),
    ).toBe(true);
    expect(filteri.level).toBe("Konverzacija B1+");
  });
});
