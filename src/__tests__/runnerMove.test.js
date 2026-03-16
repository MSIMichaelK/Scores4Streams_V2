/**
 * Tests for runner_move action (tap-to-select, tap-to-move UX).
 * Manual runner adjustment — isPitch: false.
 */
import { createGameState, applyAction } from "../utils/scoringEngine";

describe("runner_move", () => {
  let game;
  beforeEach(() => {
    game = createGameState("Home", "Away");
  });

  test("move runner from 1st to 2nd", () => {
    game.runners.first = true;
    applyAction(game, { type: "runner_move", from: "first", to: "second" });
    expect(game.runners.first).toBe(false);
    expect(game.runners.second).toBe(true);
    expect(game.pitchCount).toBe(0);
  });

  test("move runner from 2nd to 3rd", () => {
    game.runners.second = true;
    applyAction(game, { type: "runner_move", from: "second", to: "third" });
    expect(game.runners.second).toBe(false);
    expect(game.runners.third).toBe(true);
  });

  test("move runner from 3rd to home scores a run (top of inning = away scores)", () => {
    game.isTop = true;
    game.runners.third = true;
    applyAction(game, { type: "runner_move", from: "third", to: "home" });
    expect(game.runners.third).toBe(false);
    expect(game.awayScore).toBe(1);
    expect(game.homeScore).toBe(0);
  });

  test("move runner from 3rd to home scores a run (bottom of inning = home scores)", () => {
    game.isTop = false;
    game.runners.third = true;
    applyAction(game, { type: "runner_move", from: "third", to: "home" });
    expect(game.runners.third).toBe(false);
    expect(game.homeScore).toBe(1);
    expect(game.awayScore).toBe(0);
  });

  test("move records an event with correct description", () => {
    game.runners.first = true;
    const evtsBefore = game.events.length;
    applyAction(game, { type: "runner_move", from: "first", to: "second" });
    const newEvt = game.events[evtsBefore];
    expect(newEvt.type).toBe("runner_move");
    expect(newEvt.isPitch).toBe(false);
    expect(newEvt.description).toContain("1B");
    expect(newEvt.description).toContain("2B");
  });

  test("move to home records runsScored: 1", () => {
    game.runners.second = true;
    const evtsBefore = game.events.length;
    applyAction(game, { type: "runner_move", from: "second", to: "home" });
    const newEvt = game.events[evtsBefore];
    expect(newEvt.runsScored).toBe(1);
    expect(newEvt.description).toContain("scored");
  });

  test("runner_move does not count as a pitch", () => {
    game.runners.first = true;
    applyAction(game, { type: "runner_move", from: "first", to: "third" });
    expect(game.pitchCount).toBe(0);
  });

  test("runner_move does not advance the batter", () => {
    game.runners.first = true;
    game.homeBatterIndex = 3;
    game.awayBatterIndex = 5;
    applyAction(game, { type: "runner_move", from: "first", to: "second" });
    expect(game.homeBatterIndex).toBe(3);
    expect(game.awayBatterIndex).toBe(5);
  });
});
