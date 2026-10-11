import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createFakeAdmin } from "@/lib/test/fake-admin";
import { planIzmeneKontakta, oznaciKupca } from "./mark-customer";

const narudzbina = {
  order_number: "2026-646",
  email: "Nikolina@Example.com",
  full_name: "Nikolina Mataija",
  user_id: "u-nik",
};

function klijent(fake: ReturnType<typeof createFakeAdmin>) {
  return fake.admin as unknown as SupabaseClient;
}

describe("planIzmeneKontakta", () => {
  it("lid u svakoj fazi osim „upisan“ ide u „upisan“", () => {
    for (const stage of ["nov", "kontaktiran", "zainteresovan", "ponuda", "izgubljen"]) {
      const plan = planIzmeneKontakta({ stage, name: "Ana", user_id: "u1" }, narudzbina);
      expect(plan?.patch.stage).toBe("upisan");
      expect(plan?.promenjenaFaza).toBe(true);
      expect(plan?.prethodnaFaza).toBe(stage);
    }
  });

  it("već „upisan“ bez praznih polja: nema izmene", () => {
    expect(planIzmeneKontakta({ stage: "upisan", name: "Ana", user_id: "u1" }, narudzbina)).toBeNull();
  });

  it("popunjava prazno ime i nalog, ali ne gazi postojeće", () => {
    const prazno = planIzmeneKontakta({ stage: "kontaktiran", name: null, user_id: null }, narudzbina);
    expect(prazno?.patch).toEqual({ stage: "upisan", name: "Nikolina Mataija", user_id: "u-nik" });
    const popunjeno = planIzmeneKontakta({ stage: "kontaktiran", name: "Niki", user_id: "stari" }, narudzbina);
    expect(popunjeno?.patch).toEqual({ stage: "upisan" });
  });

  it("popunjava ime i kad je kontakt već „upisan“, ali to nije promena faze", () => {
    const plan = planIzmeneKontakta({ stage: "upisan", name: "  ", user_id: "u1" }, narudzbina);
    expect(plan?.patch).toEqual({ name: "Nikolina Mataija" });
    expect(plan?.promenjenaFaza).toBe(false);
  });

  it("narudžbina bez imena i naloga ne puca", () => {
    const plan = planIzmeneKontakta({ stage: "nov", name: null, user_id: null }, { order_number: 1, email: "a@b.rs" });
    expect(plan?.patch).toEqual({ stage: "upisan" });
  });
});

describe("oznaciKupca", () => {
  it("lid iz Nikolinog slučaja: pomera u „upisan“, popunjava nalog i upisuje trag", async () => {
    const fake = createFakeAdmin({
      crm_contacts: [{ id: "c1", email: "nikolina@example.com", stage: "kontaktiran", name: null, user_id: null }],
    });
    const n = await oznaciKupca(klijent(fake), narudzbina);
    expect(n).toBe(1);
    const c = fake.row("crm_contacts", (r) => r.id === "c1")!;
    expect(c.stage).toBe("upisan");
    expect(c.name).toBe("Nikolina Mataija");
    expect(c.user_id).toBe("u-nik");
    const trag = fake.row("crm_interactions", (r) => r.contact_id === "c1")!;
    expect(trag.channel).toBe("sistem");
    expect(trag.direction).toBe("interna");
    expect(trag.summary).toBe("Kupovina potvrđena - narudžbina 2026-646");
  });

  it("mejl u drugom slovnom obliku nalazi isti kontakt", async () => {
    const fake = createFakeAdmin({
      crm_contacts: [{ id: "c1", email: "NIKOLINA@EXAMPLE.COM", stage: "nov", name: "N", user_id: "u" }],
    });
    expect(await oznaciKupca(klijent(fake), { ...narudzbina, email: "  nikolina@example.com " })).toBe(1);
    expect(fake.row("crm_contacts", (r) => r.id === "c1")!.stage).toBe("upisan");
  });

  it("kontakt ne postoji: ne pravi ga", async () => {
    const fake = createFakeAdmin({ crm_contacts: [] });
    expect(await oznaciKupca(klijent(fake), narudzbina)).toBe(0);
    expect(fake.tables.get("crm_contacts")).toHaveLength(0);
    expect(fake.tables.get("crm_interactions") ?? []).toHaveLength(0);
  });

  it("tuđi kontakt sa sličnom adresom se ne dira", async () => {
    const fake = createFakeAdmin({
      crm_contacts: [{ id: "c2", email: "nikolina@example.org", stage: "nov", name: "X", user_id: null }],
    });
    expect(await oznaciKupca(klijent(fake), narudzbina)).toBe(0);
    expect(fake.row("crm_contacts", (r) => r.id === "c2")!.stage).toBe("nov");
  });

  it("dva kontakta sa istim mejlom: obilazi oba, ne puca", async () => {
    const fake = createFakeAdmin({
      crm_contacts: [
        { id: "a", email: "nikolina@example.com", stage: "nov", name: "N", user_id: "u" },
        { id: "b", email: "Nikolina@example.com", stage: "ponuda", name: "N", user_id: "u" },
      ],
    });
    expect(await oznaciKupca(klijent(fake), narudzbina)).toBe(2);
    expect(fake.tables.get("crm_contacts")!.every((r) => r.stage === "upisan")).toBe(true);
  });

  it("izgubljen lid koji je platio postaje „upisan“", async () => {
    const fake = createFakeAdmin({
      crm_contacts: [{ id: "c1", email: "nikolina@example.com", stage: "izgubljen", name: "N", user_id: "u" }],
    });
    await oznaciKupca(klijent(fake), narudzbina);
    expect(fake.row("crm_contacts", (r) => r.id === "c1")!.stage).toBe("upisan");
  });

  it("već „upisan“: ne upisuje trag", async () => {
    const fake = createFakeAdmin({
      crm_contacts: [{ id: "c1", email: "nikolina@example.com", stage: "upisan", name: "N", user_id: "u" }],
    });
    expect(await oznaciKupca(klijent(fake), narudzbina)).toBe(0);
    expect(fake.tables.get("crm_interactions") ?? []).toHaveLength(0);
  });

  it("narudžbina bez mejla: ništa ne radi i ne puca", async () => {
    const fake = createFakeAdmin({
      crm_contacts: [{ id: "c1", email: null, stage: "nov", name: null, user_id: null }],
    });
    expect(await oznaciKupca(klijent(fake), { order_number: 5, email: null, full_name: null })).toBe(0);
    expect(await oznaciKupca(klijent(fake), { order_number: 5, email: "", full_name: "X" })).toBe(0);
    expect(fake.row("crm_contacts", (r) => r.id === "c1")!.stage).toBe("nov");
  });

  it("pad upisa se prijavljuje (baca), ali ostali kontakti se ipak obiđu", async () => {
    const fake = createFakeAdmin({
      crm_contacts: [{ id: "c1", email: "nikolina@example.com", stage: "nov", name: "N", user_id: "u" }],
    });
    fake.failUpdate("crm_contacts", "RLS");
    await expect(oznaciKupca(klijent(fake), narudzbina)).rejects.toThrow(/RLS/);
  });
});
