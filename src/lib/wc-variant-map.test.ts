import { describe, it, expect } from "vitest";
import { normalizeFirstName, profEmailForWcName, mapWcVariationsToRows } from "./wc-variant-map";

describe("normalizeFirstName", () => {
  it("uzima prvo ime, skida dijakritike, lowercase", () => {
    expect(normalizeFirstName("Nataša Hartweger")).toBe("natasa");
    expect(normalizeFirstName("Marija Radojkvić-Stanojić")).toBe("marija");
    expect(normalizeFirstName("Hristina Šarčević")).toBe("hristina");
  });
});

describe("profEmailForWcName", () => {
  it("mapira prvo ime na @hartweger.rs email", () => {
    expect(profEmailForWcName("Nataša Hartweger")).toBe("natasa@hartweger.rs");
    expect(profEmailForWcName("Katarina Todosijević")).toBe("katarina@hartweger.rs");
  });
  it("vraća null za nepoznato ime", () => {
    expect(profEmailForWcName("Petar Petrović")).toBeNull();
  });
});

describe("mapWcVariationsToRows", () => {
  const profIdByEmail = {
    "natasa@hartweger.rs": "uuid-natasa",
    "marija@hartweger.rs": "uuid-marija",
    "suzana@hartweger.rs": "uuid-suzana",
  };

  it("po nivou: jedan red po profesorki, package_type null", () => {
    const rows = mapWcVariationsToRows({
      courseId: "c-a11",
      isMonthly: false,
      profIdByEmail,
      variations: [
        { price: "23000", attributes: [{ name: "Profesor", option: "Suzana Marjanović" }] },
        { price: "28000", attributes: [{ name: "Profesor", option: "Nataša Hartweger" }] },
      ],
    });
    expect(rows).toEqual([
      { course_id: "c-a11", professor_id: "uuid-suzana", package_type: null, price: 23000, paypal_price_eur: null, is_active: true },
      { course_id: "c-a11", professor_id: "uuid-natasa", package_type: null, price: 28000, paypal_price_eur: null, is_active: true },
    ]);
  });

  it("mesečni: Marija dobija standard cenu (WP greška se ignoriše)", () => {
    const rows = mapWcVariationsToRows({
      courseId: "c-mp",
      isMonthly: true,
      profIdByEmail,
      variations: [
        { price: "28000", attributes: [{ name: "Profesor", option: "Marija Radojković Stanojić" }, { name: "Paket", option: "paket8" }] },
        { price: "27500", attributes: [{ name: "Profesor", option: "Suzana Marjanović" }, { name: "Paket", option: "paket8" }] },
      ],
    });
    const marija = rows.find((r) => r.professor_id === "uuid-marija" && r.package_type === "paket8");
    expect(marija?.price).toBe(27500); // standard, ne 28000
  });

  it("preskače varijaciju za nepoznatu/neseed-ovanu profesorku", () => {
    const rows = mapWcVariationsToRows({
      courseId: "c-a11", isMonthly: false, profIdByEmail,
      variations: [{ price: "23000", attributes: [{ name: "Profesor", option: "Danica Nepoznata" }] }],
    });
    expect(rows).toEqual([]);
  });
});
