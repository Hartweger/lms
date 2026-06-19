import { describe, it, expect } from "vitest";
import { rankNakiTopics, pickExamples, NAKI_CONTENT_TOPICS } from "./topics";

describe("rankNakiTopics", () => {
  it("rangira po broju različitih sesija, ne po broju pogodaka", () => {
    const msgs = [
      // kein/nicht: 2 sesije
      { session_id: "a", message: "kako ide kein i nicht" },
      { session_id: "b", message: "Ich habe kein Auto" },
      // veznici: 1 sesija ali 3 poruke
      { session_id: "c", message: "weil je veznik" },
      { session_id: "c", message: "a dass" },
      { session_id: "c", message: "i obwohl" },
    ];
    const ranked = rankNakiTopics(msgs);
    expect(ranked[0].topic.name).toContain("kein/nicht");
    expect(ranked[0].sessions).toBe(2);
    const veznici = ranked.find((r) => r.topic.name.includes("Veznici"))!;
    expect(veznici.sessions).toBe(1);
    expect(veznici.hits).toBe(3);
  });

  it("svaka tema ima YT ugao i IG ideju", () => {
    for (const t of NAKI_CONTENT_TOPICS) {
      expect(t.yt.length).toBeGreaterThan(10);
      expect(t.ig.length).toBeGreaterThan(10);
    }
  });
});

describe("pickExamples", () => {
  it("bira kratka, različita pitanja za temu i preskače preduga", () => {
    const topic = NAKI_CONTENT_TOPICS.find((t) => t.name.includes("kein/nicht"))!;
    const msgs = [
      { message: "Ich trinke kein Kaffee" },
      { message: "Ich trinke kein Kaffee" }, // duplikat
      { message: "kratko" }, // ne matchuje temu
      { message: "x".repeat(200) + " nicht" }, // predugo
      { message: "Wann kein und wann nicht?" },
    ];
    const ex = pickExamples(msgs, topic, 3);
    expect(ex).toEqual(["Ich trinke kein Kaffee", "Wann kein und wann nicht?"]);
  });
});
