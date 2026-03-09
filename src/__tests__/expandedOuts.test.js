/**
 * Tests for expanded out types and multi-out plays.
 * ground_out, fly_out, line_drive_out, popup_out, foul_fly_out,
 * infield_fly, strikeout_swinging, strikeout_looking,
 * double_play, triple_play
 */
import { createGameState, applyAction, replayActions } from "../utils/scoringEngine";

describe("Expanded Out Types", () => {
  let game;

  beforeEach(() => {
    game = createGameState("Home", "Away");
  });

  // ─── Single-out types ──────────────────────────────────

  test("ground_out records 1 out and 1 pitch", () => {
    applyAction(game, { type: "ground_out", positions: [6, 3] });
    expect(game.outs).toBe(1);
    expect(game.pitchCount).toBe(1);
    expect(game.balls).toBe(0);
    expect(game.strikes).toBe(0);
  });

  test("fly_out records 1 out and 1 pitch", () => {
    applyAction(game, { type: "fly_out", positions: [9] });
    expect(game.outs).toBe(1);
    expect(game.pitchCount).toBe(1);
    const ev = game.events[game.events.length - 1];
    expect(ev.description).toBe("Fly out F9");
  });

  test("line_drive_out records 1 out with correct description", () => {
    applyAction(game, { type: "line_drive_out", positions: [6] });
    expect(game.outs).toBe(1);
    const ev = game.events[game.events.length - 1];
    expect(ev.description).toBe("Line drive out LD6");
  });

  test("popup_out records 1 out with correct description", () => {
    applyAction(game, { type: "popup_out", positions: [4] });
    expect(game.outs).toBe(1);
    const ev = game.events[game.events.length - 1];
    expect(ev.description).toBe("Popup out PO4");
  });

  test("foul_fly_out records 1 out with correct description", () => {
    applyAction(game, { type: "foul_fly_out", positions: [2] });
    expect(game.outs).toBe(1);
    const ev = game.events[game.events.length - 1];
    expect(ev.description).toBe("Foul fly out FF2");
  });

  test("infield_fly records 1 out", () => {
    applyAction(game, { type: "infield_fly", positions: [4] });
    expect(game.outs).toBe(1);
    const ev = game.events[game.events.length - 1];
    expect(ev.description).toBe("Infield fly IF4");
  });

  test("out types without positions still work", () => {
    applyAction(game, { type: "ground_out" });
    expect(game.outs).toBe(1);
    const ev = game.events[game.events.length - 1];
    expect(ev.description).toBe("Ground out");
    expect(ev.positions).toBeNull();
  });

  // ─── Strikeout variants ────────────────────────────────

  test("strikeout_swinging records out and resets count", () => {
    applyAction(game, "ball");
    applyAction(game, { type: "strikeout_swinging" });
    expect(game.outs).toBe(1);
    expect(game.balls).toBe(0);
    expect(game.strikes).toBe(0);
    expect(game.pitchCount).toBe(2);
    const ev = game.events[game.events.length - 1];
    expect(ev.type).toBe("strikeout_swinging");
    expect(ev.description).toContain("K");
  });

  test("strikeout_looking records out and resets count", () => {
    applyAction(game, { type: "strikeout_looking" });
    expect(game.outs).toBe(1);
    const ev = game.events[game.events.length - 1];
    expect(ev.type).toBe("strikeout_looking");
    expect(ev.description).toContain("KC");
  });

  // ─── Side change on 3rd out ────────────────────────────

  test("3 expanded outs change sides", () => {
    applyAction(game, { type: "ground_out", positions: [6, 3] });
    applyAction(game, { type: "fly_out", positions: [9] });
    applyAction(game, { type: "strikeout_swinging" });
    expect(game.outs).toBe(0); // reset after side change
    expect(game.isTop).toBe(false);
  });

  test("expanded outs clear count", () => {
    applyAction(game, "ball");
    applyAction(game, "strike");
    expect(game.balls).toBe(1);
    expect(game.strikes).toBe(1);
    applyAction(game, { type: "fly_out", positions: [8] });
    expect(game.balls).toBe(0);
    expect(game.strikes).toBe(0);
  });
});

describe("Double Play", () => {
  let game;

  beforeEach(() => {
    game = createGameState("Home", "Away");
  });

  test("double_play records 2 outs from 1 pitch", () => {
    game.runners.first = true;
    applyAction(game, { type: "double_play", positions: [6, 4, 3], runnersOut: ["first"] });
    expect(game.outs).toBe(2);
    expect(game.pitchCount).toBe(1); // Only 1 pitch! (fixes AB-006)
    expect(game.runners.first).toBe(false);
    const ev = game.events[game.events.length - 1];
    expect(ev.outsRecorded).toBe(2);
    expect(ev.description).toBe("Double play 6-4-3");
  });

  test("double_play with 1 out already changes sides", () => {
    game.outs = 1;
    game.runners.first = true;
    applyAction(game, { type: "double_play", positions: [4, 6, 3], runnersOut: ["first"] });
    // 1 + 2 = 3 outs → side change
    expect(game.outs).toBe(0);
    expect(game.isTop).toBe(false);
  });

  test("double_play with 0 outs does not change sides", () => {
    game.runners.first = true;
    applyAction(game, { type: "double_play", positions: [6, 4, 3], runnersOut: ["first"] });
    expect(game.outs).toBe(2);
    expect(game.isTop).toBe(true);
  });

  test("double_play resets count", () => {
    game.runners.first = true;
    game.balls = 2;
    game.strikes = 1;
    applyAction(game, { type: "double_play", positions: [6, 4, 3], runnersOut: ["first"] });
    expect(game.balls).toBe(0);
    expect(game.strikes).toBe(0);
  });

  test("double_play without positions works", () => {
    game.runners.first = true;
    applyAction(game, { type: "double_play", runnersOut: ["first"] });
    expect(game.outs).toBe(2);
    const ev = game.events[game.events.length - 1];
    expect(ev.description).toBe("Double play");
  });

  test("double_play can score a run (timing play)", () => {
    game.runners = { first: true, second: false, third: true };
    applyAction(game, { type: "double_play", positions: [4, 6, 3], runnersOut: ["first"], runsScored: 1 });
    expect(game.outs).toBe(2);
    expect(game.awayScore).toBe(1);
    expect(game.runners.third).toBe(false); // runner scored but DP didn't put them out
  });
});

describe("Triple Play", () => {
  let game;

  beforeEach(() => {
    game = createGameState("Home", "Away");
    game.runners = { first: true, second: true, third: false };
  });

  test("triple_play records 3 outs and changes sides", () => {
    applyAction(game, { type: "triple_play", positions: [5, 4, 3], runnersOut: ["second", "first"] });
    expect(game.outs).toBe(0); // reset after side change
    expect(game.isTop).toBe(false);
    expect(game.pitchCount).toBe(1);
    const ev = game.events[0];
    expect(ev.outsRecorded).toBe(3);
  });

  test("triple play does not score runs", () => {
    game.runners.third = true;
    applyAction(game, { type: "triple_play", runnersOut: ["first", "second", "third"] });
    expect(game.awayScore).toBe(0);
  });
});

describe("Expanded outs in full game context", () => {
  test("mix of expanded and legacy outs works in a half-inning", () => {
    const game = createGameState("Home", "Away");
    replayActions(game, [
      { type: "ground_out", positions: [6, 3] },
      { type: "fly_out", positions: [8] },
      { type: "strikeout_looking" },
    ]);
    expect(game.outs).toBe(0); // side changed
    expect(game.isTop).toBe(false);
    expect(game.pitchCount).toBe(3);
  });

  test("legacy string 'out' still works alongside expanded outs", () => {
    const game = createGameState("Home", "Away");
    replayActions(game, [
      "out",
      { type: "ground_out", positions: [5, 3] },
      "out",
    ]);
    expect(game.outs).toBe(0);
    expect(game.isTop).toBe(false);
    expect(game.pitchCount).toBe(3);
  });

  test("DP + regular out = side change on 3 total outs", () => {
    const game = createGameState("Home", "Away");
    game.runners.first = true;
    applyAction(game, { type: "double_play", positions: [6, 4, 3], runnersOut: ["first"] });
    expect(game.outs).toBe(2);
    applyAction(game, { type: "fly_out", positions: [7] });
    expect(game.outs).toBe(0);
    expect(game.isTop).toBe(false);
  });
});
