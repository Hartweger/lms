import { describe, it, expect } from "vitest";
import {
  LADDER, ladderFor, safeLevelsFor, createGame, answer, walkAway,
  applyFiftyFifty, useSwap, wonPoints, type MillionaireState,
} from "./millionaire";

const rngFirst = () => 0; // deterministički rng za testove

describe("ladderFor", () => {
  it("puna igra ima 15 suma i milion na vrhu", () => {
    expect(ladderFor(15)).toEqual([...LADDER]);
    expect(ladderFor(15)).toHaveLength(15);
    expect(ladderFor(15)[14]).toBe(1_000_000);
  });
  it("kraća igra: prvih n-1 suma + milion kao poslednja", () => {
    expect(ladderFor(5)).toEqual([100, 200, 300, 500, 1_000_000]);
  });
  it("jedno pitanje = odmah milion", () => {
    expect(ladderFor(1)).toEqual([1_000_000]);
  });
  it("nula pitanja se klampuje na jedno (milion)", () => {
    expect(ladderFor(0)).toEqual([1_000_000]);
  });
});

describe("safeLevelsFor", () => {
  it("puna igra: sigurni stepenici posle 5. i 10. pitanja (indeksi 4 i 9)", () => {
    expect(safeLevelsFor(15)).toEqual([4, 9]);
  });
  it("kratka igra bez stepenika", () => {
    expect(safeLevelsFor(4)).toEqual([]);
  });
  it("nula pitanja = bez stepenika", () => {
    expect(safeLevelsFor(0)).toEqual([]);
  });
});

describe("createGame", () => {
  it("questionCount <= 0 se klampuje na 1", () => {
    expect(createGame(0).questionCount).toBe(1);
    expect(createGame(-3).questionCount).toBe(1);
  });
});

describe("answer", () => {
  it("tačan odgovor penje na sledeći nivo", () => {
    const s = createGame(15);
    const next = answer(s, true);
    expect(next.level).toBe(1);
    expect(next.status).toBe("playing");
    expect(next.correctCount).toBe(1);
    expect(next.hiddenOptions).toEqual([]); // 50:50 važi samo za jedno pitanje
  });
  it("tačan odgovor na poslednjem pitanju = pobeda", () => {
    let s = createGame(2);
    s = answer(s, true);
    s = answer(s, true);
    expect(s.status).toBe("won");
    expect(s.correctCount).toBe(2);
  });
  it("pogrešan odgovor završava igru", () => {
    const s = createGame(15);
    const next = answer(s, false);
    expect(next.status).toBe("lost");
    expect(next.correctCount).toBe(0);
  });
  it("posle završene igre answer vraća isto stanje", () => {
    const lost = answer(createGame(15), false);
    expect(answer(lost, true)).toBe(lost);
  });
});

describe("wonPoints", () => {
  it("pobeda nosi milion", () => {
    let s = createGame(2);
    s = answer(s, true);
    s = answer(s, true);
    expect(wonPoints(s)).toBe(1_000_000);
  });
  it("ispadanje pre prvog stepenika = 0 poena", () => {
    let s = createGame(15);
    s = answer(s, true); // nivo 1
    s = answer(s, false);
    expect(wonPoints(s)).toBe(0);
  });
  it("ispadanje posle 5. pitanja pada na 1.000 (stepenik)", () => {
    let s = createGame(15);
    for (let i = 0; i < 6; i++) s = answer(s, true); // prošao pitanja 1-6
    s = answer(s, false); // pao na 7. pitanju
    expect(wonPoints(s)).toBe(1_000); // LADDER[4]
  });
  it("ispadanje posle 10. pitanja pada na 32.000", () => {
    let s = createGame(15);
    for (let i = 0; i < 11; i++) s = answer(s, true);
    s = answer(s, false);
    expect(wonPoints(s)).toBe(32_000); // LADDER[9]
  });
  it("odustajanje nosi trenutno osvojeno", () => {
    let s = createGame(15);
    for (let i = 0; i < 3; i++) s = answer(s, true); // osvojio 300
    s = walkAway(s);
    expect(s.status).toBe("walked");
    expect(wonPoints(s)).toBe(300); // LADDER[2]
  });
  it("odustajanje pre prvog odgovora nosi 0", () => {
    const s = walkAway(createGame(15));
    expect(wonPoints(s)).toBe(0);
  });
  it("posle završene igre walkAway vraća isto stanje", () => {
    const lost = answer(createGame(15), false);
    expect(walkAway(lost)).toBe(lost);
  });
  it("tokom igre vraća trenutno osigurano (informativno)", () => {
    let s = createGame(15);
    for (let i = 0; i < 3; i++) s = answer(s, true);
    expect(s.status).toBe("playing");
    expect(wonPoints(s)).toBe(300); // LADDER[2]
  });
});

describe("applyFiftyFifty", () => {
  it("sklanja tačno dve pogrešne opcije i troši džoker", () => {
    const s = createGame(15);
    const next = applyFiftyFifty(s, 2, 4, rngFirst);
    expect(next.usedFiftyFifty).toBe(true);
    expect(next.hiddenOptions).toHaveLength(2);
    expect(next.hiddenOptions).not.toContain(2); // tačna ostaje
  });
  it("ne može dvaput", () => {
    let s = createGame(15);
    s = applyFiftyFifty(s, 0, 4, rngFirst);
    const again = applyFiftyFifty(s, 0, 4, rngFirst);
    expect(again).toBe(s); // nepromenjeno stanje
  });
  it("sa 3 opcije sklanja dve pogrešne (ostaje samo tačna)", () => {
    const s = createGame(15);
    const next = applyFiftyFifty(s, 1, 3, rngFirst);
    expect([...next.hiddenOptions].sort()).toEqual([0, 2]);
  });
  it("bez pogrešnih opcija ne troši džoker", () => {
    const s = createGame(15);
    expect(applyFiftyFifty(s, 0, 1, rngFirst)).toBe(s);
  });
  it("posle završene igre vraća isto stanje", () => {
    const lost = answer(createGame(15), false);
    expect(applyFiftyFifty(lost, 0, 4, rngFirst)).toBe(lost);
  });
});

describe("useSwap", () => {
  it("troši džoker i resetuje 50:50 sakrivanje za novo pitanje", () => {
    let s = createGame(15);
    s = applyFiftyFifty(s, 0, 4, rngFirst);
    const next = useSwap(s);
    expect(next.usedSwap).toBe(true);
    expect(next.hiddenOptions).toEqual([]);
    expect(next.usedFiftyFifty).toBe(true); // 50:50 ostaje potrošen
  });
  it("ne može dvaput", () => {
    let s = useSwap(createGame(15));
    expect(useSwap(s)).toBe(s);
  });
});
