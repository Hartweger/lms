import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createFakeAdmin } from "@/lib/test/fake-admin";
import { renewalProductSlugs, renewalProductSlug } from "./renewal-product";

// Realan presek baze: sadržajni kursevi NISU u prodaji, prodaju se proizvodi koji ih
// otključavaju. Link „Obnovi −50%" je do 29.07.2026 vodio na sadržajni slug → 404.
function seed() {
  return createFakeAdmin({
    courses: [
      { id: "a11", slug: "nemacki-a1-1", category: null, is_purchasable: false },
      { id: "a12", slug: "nemacki-a1-2", category: null, is_purchasable: false },
      { id: "c11", slug: "nemacki-c1-1", category: null, is_purchasable: false },
      { id: "fsp", slug: "fsp", category: "video", is_purchasable: true },
      { id: "v-a1", slug: "video-kurs-a1", category: "video", is_purchasable: true },
      { id: "pak", slug: "paket-a1-a2", category: "paket", is_purchasable: true },
      { id: "grp-a11", slug: "grupni-kurs-nemackog-jezika-a1-1", category: "grupni", is_purchasable: true },
      { id: "ind-a11", slug: "individualni-kurs-nemackog-jezika-a11", category: "individualni", is_purchasable: true },
      { id: "grp-c11", slug: "grupni-kurs-c1-1", category: "grupni", is_purchasable: true },
    ],
    course_unlocks: [
      { purchasable_course_id: "v-a1", content_course_id: "a11" },
      { purchasable_course_id: "v-a1", content_course_id: "a12" },
      { purchasable_course_id: "pak", content_course_id: "a11" },
      { purchasable_course_id: "grp-a11", content_course_id: "a11" },
      { purchasable_course_id: "ind-a11", content_course_id: "a11" },
      { purchasable_course_id: "grp-c11", content_course_id: "c11" },
      { purchasable_course_id: "fsp", content_course_id: "fsp" },
    ],
  });
}

const admin = () => seed().admin as unknown as SupabaseClient;

describe("renewalProductSlugs", () => {
  it("sadržajni kurs mapira na video proizvod, ne na sam sebe", async () => {
    const map = await renewalProductSlugs(admin(), ["a11", "a12"]);
    expect(map.get("a11")).toBe("video-kurs-a1");
    expect(map.get("a12")).toBe("video-kurs-a1");
  });

  it("bira video ispred paketa - obnavlja se nivo, ne skuplji paket", async () => {
    const map = await renewalProductSlugs(admin(), ["a11"]);
    expect(map.get("a11")).toBe("video-kurs-a1");
  });

  it("ne nudi grupni ni individualni kao obnovu (nisu samoposlužni)", async () => {
    const map = await renewalProductSlugs(admin(), ["c11"]);
    expect(map.has("c11")).toBe(false);
  });

  it("kurs koji je sam svoj proizvod mapira na sebe (FSP)", async () => {
    const map = await renewalProductSlugs(admin(), ["fsp"]);
    expect(map.get("fsp")).toBe("fsp");
  });

  it("prazan ulaz ne pravi upit i vraća praznu mapu", async () => {
    const f = seed();
    const map = await renewalProductSlugs(f.admin as unknown as SupabaseClient, []);
    expect(map.size).toBe(0);
  });

  it("renewalProductSlug vraća null kad proizvoda nema", async () => {
    expect(await renewalProductSlug(admin(), "c11")).toBeNull();
    expect(await renewalProductSlug(admin(), "a11")).toBe("video-kurs-a1");
  });
});
