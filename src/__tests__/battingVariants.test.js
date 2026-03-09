/**
 * Tests for batting variant actions.
 * sacrifice_bunt, bunt_hit, slap_hit, dropped_third_strike,
 * intentional_walk, obstruction, interference
 */
import { createGameState, applyAction } from "../utils/scoringEngine";

describe("Sacrifice Bunt", () => {
  let game;
  beforeEach(() => {
    game = createGameState("Home", "Away");
  });

  test("sacrifice_bunt records out and advances runners", () => {
    game.runners = { first: true, second: false, third: false };
    applyAction(game, { type: "sacrifice_bunt", positions: [1, 3] });
    expect(game.outs).toBe(1);
    expect(game.runners.first).toBe(false);
    expect(game.runners.second).toBe(true); // advanced from 1st
    expect(game.pitchCount).toBe(1); // is a pitch
    expect(game.balls).toBe(0);
    expect(game.strikes).toBe(0);
  });

  test("sacrifice_bunt scores from 3rd", () => {
    game.runners = { first: false, second: false, third: true };
    applyAction(game, { type: "sacrifice_bunt", positions: [1, 3] });
    expect(game.awayScore).toBe(1);
    expect(game.outs).toBe(1);
    const ev = game.events[game.events.length - 1];
    expect(ev.description).toBe("Sac bunt 1-3");
  });

  test("sacrifice_bunt advances 2nd to 3rd and 1st to 2nd", () => {
    game.runners = { first: true, second: true, third: false };
    applyAction(game, { type: "sacrifice_bunt", positions: [1, 4] });
    expect(game.runners.first).toBe(false); // batter out, no one on 1st
    expect(game.runners.second).toBe(true); // was 1st
    expect(game.runners.third).toBe(true); // was 2nd
    expect(game.outs).toBe(1);
  });

  test("sacrifice_bunt as 3rd out changes sides", () => {
    game.outs = 2;
    game.runners.first = true;
    applyAction(game, { type: "sacrifice_bunt" });
    expect(game.outs).toBe(0);
    expect(game.isTop).toBe(false);
  });
});

describe("Bunt Hit", () => {
  let game;
  beforeEach(() => {
    game = createGameState("Home", "Away");
  });

  test("bunt_hit works like a single", () => {
    game.runners = { first: false, second: true, third: false };
    applyAction(game, { type: "bunt_hit" });
    expect(game.runners.first).toBe(true); // batter on 1st
    expect(game.runners.second).toBe(false);
    expect(game.runners.third).toBe(true); // was 2nd
    expect(game.pitchCount).toBe(1);
  });

  test("bunt_hit scores from 3rd", () => {
    game.runners.third = true;
    applyAction(game, { type: "bunt_hit" });
    expect(game.awayScore).toBe(1);
    const ev = game.events[game.events.length - 1];
    expect(ev.type).toBe("bunt_hit");
  });
});

describe("Slap Hit", () => {
  let game;
  beforeEach(() => {
    game = createGameState("Home", "Away");
  });

  test("slap_hit works like a single", () => {
    applyAction(game, { type: "slap_hit" });
    expect(game.runners.first).toBe(true);
    expect(game.pitchCount).toBe(1);
    const ev = game.events[game.events.length - 1];
    expect(ev.type).toBe("slap_hit");
  });
});

describe("Dropped Third Strike", () => {
  let game;
  beforeEach(() => {
    game = createGameState("Home", "Away");
  });

  test("dropped_third_strike puts batter on 1st", () => {
    applyAction(game, { type: "dropped_third_strike" });
    expect(game.runners.first).toBe(true);
    expect(game.outs).toBe(0); // no out recorded
    expect(game.pitchCount).toBe(1);
    expect(game.balls).toBe(0);
    expect(game.strikes).toBe(0);
  });

  test("dropped_third_strike with positions", () => {
    applyAction(game, { type: "dropped_third_strike", positions: [2, 3] });
    const ev = game.events[game.events.length - 1];
    expect(ev.description).toBe("Dropped 3rd strike 2-3");
    // Batter still reaches 1st (the throw was too late)
    expect(game.runners.first).toBe(true);
  });
});

describe("Intentional Walk", () => {
  let game;
  beforeEach(() => {
    game = createGameState("Home", "Away");
  });

  test("intentional_walk puts batter on 1st", () => {
    applyAction(game, { type: "intentional_walk" });
    expect(game.runners.first).toBe(true);
    expect(game.balls).toBe(0);
    expect(game.strikes).toBe(0);
    expect(game.pitchCount).toBe(1);
  });

  test("intentional_walk force-advances", () => {
    game.runners = { first: true, second: true, third: true };
    applyAction(game, { type: "intentional_walk" });
    expect(game.awayScore).toBe(1); // 3rd forced home
    expect(game.runners.first).toBe(true);
    expect(game.runners.second).toBe(true);
    expect(game.runners.third).toBe(true);
    const ev = game.events[game.events.length - 1];
    expect(ev.description).toBe("IBB - 1 run scored");
  });
});

describe("Obstruction", () => {
  let game;
  beforeEach(() => {
    game = createGameState("Home", "Away");
  });

  test("obstruction awards 1st base via force-advance", () => {
    applyAction(game, { type: "obstruction" });
    expect(game.runners.first).toBe(true);
    expect(game.pitchCount).toBe(1);
    const ev = game.events[game.events.length - 1];
    expect(ev.type).toBe("obstruction");
  });

  test("obstruction with bases loaded scores", () => {
    game.runners = { first: true, second: true, third: true };
    applyAction(game, { type: "obstruction" });
    expect(game.awayScore).toBe(1);
  });
});

describe("Interference", () => {
  let game;
  beforeEach(() => {
    game = createGameState("Home", "Away");
  });

  test("interference records an out", () => {
    applyAction(game, { type: "interference" });
    expect(game.outs).toBe(1);
    expect(game.pitchCount).toBe(1);
    expect(game.balls).toBe(0);
    expect(game.strikes).toBe(0);
  });

  test("interference with positions", () => {
    applyAction(game, { type: "interference", positions: [2, 3] });
    const ev = game.events[game.events.length - 1];
    expect(ev.description).toBe("Interference INT2-3");
    expect(ev.resultedInOut).toBe(true);
  });

  test("interference as 3rd out changes sides", () => {
    game.outs = 2;
    applyAction(game, { type: "interference" });
    expect(game.outs).toBe(0);
    expect(game.isTop).toBe(false);
  });
});
