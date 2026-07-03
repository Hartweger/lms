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
