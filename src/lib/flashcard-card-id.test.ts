import { describe, it, expect } from "vitest";
import { cardId } from "./flashcard-card-id";

describe("cardId", () => {
  it("isti ulaz daje isti id", () => {
    expect(cardId("a1-1-l1", "Vater", "otac")).toBe(cardId("a1-1-l1", "Vater", "otac"));
  });
  it("različit front daje različit id", () => {
    expect(cardId("a1-1-l1", "Vater", "otac")).not.toBe(cardId("a1-1-l1", "Mutter", "majka"));
  });
  it("ne zavisi od razmaka/velikih slova oko teksta", () => {
    expect(cardId("a1-1-l1", " Vater ", "Otac")).toBe(cardId("a1-1-l1", "vater", "otac"));
  });
  it("zavisi od setKey", () => {
    expect(cardId("a1-1-l1", "Vater", "otac")).not.toBe(cardId("a1-2-l1", "Vater", "otac"));
  });
});
