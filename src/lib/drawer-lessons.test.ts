import { describe, it, expect } from "vitest";
import { buildDrawerLessons } from "./drawer-lessons";

describe("buildDrawerLessons", () => {
  it("mapira module_name kolonu u module polje drawera", () => {
    const out = buildDrawerLessons(
      [
        { id: "l1", title: "Lekcija 1", order_index: 1, module_name: "Modul 1" },
        { id: "l2", title: "Lekcija 2", order_index: 2, module_name: null },
      ],
      new Set()
    );
    expect(out[0].module).toBe("Modul 1");
    expect(out[1].module).toBe("");
  });

  it("vezuje vežbe za svoju lekciju, sortirane po order_index, sa bedžom", () => {
    const out = buildDrawerLessons(
      [
        { id: "l1", title: "Lekcija 1", order_index: 1, module_name: "Modul 1" },
        { id: "l2", title: "Lekcija 2", order_index: 2, module_name: "Modul 1" },
      ],
      new Set(),
      [
        { id: "e2", lesson_id: "l1", title: "Test: Selbstkontrolle - Lektion 1", order_index: 2 },
        { id: "e1", lesson_id: "l1", title: "Vežba: Konditionale Zusammenhänge", order_index: 1 },
      ],
      "Nemački C1.1",
    );
    expect(out[0].exercises.map((e) => e.id)).toEqual(["e1", "e2"]);
    expect(out[0].exercises[0]).toMatchObject({ test: false, label: "✏️ Vežba" });
    expect(out[0].exercises[1]).toMatchObject({ test: true, label: "🎯 Test" });
    // lekcija bez vežbi ostaje prazan niz, ne undefined
    expect(out[1].exercises).toEqual([]);
  });

  it("bez prosleđenih vežbi lekcije imaju prazan niz", () => {
    const out = buildDrawerLessons(
      [{ id: "l1", title: "Lekcija 1", order_index: 1, module_name: null }],
      new Set(),
    );
    expect(out[0].exercises).toEqual([]);
  });

  it("označava završene lekcije", () => {
    const out = buildDrawerLessons(
      [
        { id: "l1", title: "Lekcija 1", order_index: 1, module_name: null },
        { id: "l2", title: "Lekcija 2", order_index: 2, module_name: null },
      ],
      new Set(["l2"])
    );
    expect(out.map((l) => l.completed)).toEqual([false, true]);
  });
});
