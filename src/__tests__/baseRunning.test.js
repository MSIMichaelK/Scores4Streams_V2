/**
 * Tests for base running actions (isPitch: false — between pitches).
 * stolen_base, caught_stealing, pick_off, wild_pitch, passed_ball, illegal_pitch
 */
import { createGameState, applyAction } from "../utils/scoringEngine";

describe("Stolen Base", () => {
  let game;
  beforeEach(() => {
    game = createGameState("Home", "Away");
  });

  test("stolen_base from 1st to 2nd", () => {
    game.runners.first = true;
    applyAction(game, { type: "stolen_base", runner: "first" });
    expect(game.runners.first).toBe(false);
    expect(game.runners.second).toBe(true);
    expect(game.pitchCount).toBe(0); // not a pitch
  });

  test("stolen_base from 2nd to 3rd", () => {
    game.runners.second = true;
    applyAction(game, { type: "stolen_base", runner: "second" });
    expect(game.runners.second).toBe(false);
    expect(game.runners.third).toBe(true);
  });

  test("steal of home scores a run", () => {
    game.runners.third = true;
    applyAction(game, { type: "stolen_base", runner: "third" });
    expect(game.runners.third).toBe(false);
    expect(game.awayScore).toBe(1);
    const ev = game.events[game.events.length - 1];
    expect(ev.runsScored).toBe(1);
  });

  test("stolen_base event has correct description", () => {
    game.runners.first = true;
    applyAction(game, { type: "stolen_base", runner: "first" });
    const ev = game.events[game.events.length - 1];
    expect(ev.description).toBe("Stolen base 1B to 2B");
    expect(ev.isPitch).toBe(false);
  });
});

describe("Caught Stealing", () => {
  let game;
  beforeEach(() => {
    game = createGameState("Home", "Away");
  });

  test("caught_stealing records an out and removes runner", () => {
    game.runners.first = true;
    applyAction(game, { type: "caught_stealing", runner: "first", positions: [2, 6] });
    expect(game.runners.first).toBe(false);
    expect(game.outs).toBe(1);
    expect(game.pitchCount).toBe(0);
  });

  test("caught_stealing as 3rd out changes sides", () => {
    game.outs = 2;
    game.runners.second = true;
    applyAction(game, { type: "caught_stealing", runner: "second", positions: [2, 5] });
    expect(game.outs).toBe(0);
    expect(game.isTop).toBe(false);
  });

  test("caught_stealing event description includes positions", () => {
    game.runners.first = true;
    applyAction(game, { type: "caught_stealing", runner: "first", positions: [2, 6] });
    const ev = game.events[game.events.length - 1];
    expect(ev.description).toBe("CS 1B 2-6");
  });
});

describe("Pick Off", () => {
  let game;
  beforeEach(() => {
    game = createGameState("Home", "Away");
  });

  test("pick_off records an out and removes runner", () => {
    game.runners.second = true;
    applyAction(game, { type: "pick_off", runner: "second", positions: [1, 4] });
    expect(game.runners.second).toBe(false);
    expect(game.outs).toBe(1);
    expect(game.pitchCount).toBe(0);
  });

  test("pick_off as 3rd out changes sides", () => {
    game.outs = 2;
    game.runners.first = true;
    applyAction(game, { type: "pick_off", runner: "first" });
    expect(game.outs).toBe(0);
    expect(game.isTop).toBe(false);
  });
});

describe("Wild Pitch", () => {
  let game;
  beforeEach(() => {
    game = createGameState("Home", "Away");
  });

  test("wild_pitch advances lead runner (default)", () => {
    game.runners.second = true;
    applyAction(game, { type: "wild_pitch" });
    expect(game.runners.second).toBe(false);
    expect(game.runners.third).toBe(true);
    expect(game.pitchCount).toBe(0);
  });

  test("wild_pitch from 3rd scores a run", () => {
    game.runners.third = true;
    applyAction(game, { type: "wild_pitch" });
    expect(game.runners.third).toBe(false);
    expect(game.awayScore).toBe(1);
  });

  test("wild_pitch advances specified runners", () => {
    game.runners = { first: true, second: true, third: false };
    applyAction(game, { type: "wild_pitch", runners: ["first", "second"] });
    expect(game.runners.first).toBe(false);
    expect(game.runners.second).toBe(true); // was first
    expect(game.runners.third).toBe(true); // was second
  });

  test("wild_pitch with runner on 3rd scoring via runners array", () => {
    game.runners = { first: false, second: false, third: true };
    applyAction(game, { type: "wild_pitch", runners: ["third"] });
    expect(game.runners.third).toBe(false);
    expect(game.awayScore).toBe(1);
  });
});

describe("Passed Ball", () => {
  let game;
  beforeEach(() => {
    game = createGameState("Home", "Away");
  });

  test("passed_ball advances lead runner", () => {
    game.runners.first = true;
    applyAction(game, { type: "passed_ball" });
    expect(game.runners.first).toBe(false);
    expect(game.runners.second).toBe(true);
    expect(game.pitchCount).toBe(0);
  });

  test("passed_ball from 3rd scores a run", () => {
    game.runners.third = true;
    applyAction(game, { type: "passed_ball" });
    expect(game.awayScore).toBe(1);
    const ev = game.events[game.events.length - 1];
    expect(ev.type).toBe("passed_ball");
    expect(ev.runsScored).toBe(1);
  });
});

describe("Illegal Pitch", () => {
  let game;
  beforeEach(() => {
    game = createGameState("Home", "Away");
  });

  test("illegal_pitch advances all runners + ball to batter", () => {
    game.runners = { first: true, second: true, third: false };
    game.balls = 1;
    applyAction(game, { type: "illegal_pitch" });
    expect(game.runners.first).toBe(false); // was empty after shift
    expect(game.runners.second).toBe(true); // was first
    expect(game.runners.third).toBe(true); // was second
    expect(game.balls).toBe(2); // ball added
    expect(game.pitchCount).toBe(0); // not a pitch
  });

  test("illegal_pitch scores from 3rd", () => {
    game.runners.third = true;
    applyAction(game, { type: "illegal_pitch" });
    expect(game.awayScore).toBe(1);
    expect(game.runners.third).toBe(false);
  });

  test("illegal_pitch causing walk (4th ball)", () => {
    game.balls = 3;
    game.runners = { first: true, second: true, third: true };
    applyAction(game, { type: "illegal_pitch" });
    // 3rd scores from IP advance, then walk force-advances
    // IP: 3rd scores (run 1), 2nd→3rd, 1st→2nd, 1st empty
    // Then balls becomes 4 → walk → force advance with runners on 2nd+3rd
    // Walk: batter→1st, forces: 1st was empty so just batter→1st
    expect(game.awayScore).toBe(1); // only 3rd scored from IP
    expect(game.runners.first).toBe(true); // batter walked
  });
});
