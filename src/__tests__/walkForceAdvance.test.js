/**
 * Walk force-advance tests (AB-004 regression)
 *
 * The old walk handler used simplified logic:
 *   updated.third = runners.second
 *   updated.second = runners.first
 *   updated.first = true
 *
 * This incorrectly cleared non-forced runners. For example:
 * - Runner on 2nd only → walk should put batter on 1st, leave 2nd alone
 *   Old code: updated.third = false (was.second=true), updated.second = false (was.first=false)
 *   Result: runner on 2nd vanishes!
 *
 * The fix uses force-chain logic (same as HBP): only advance runners
 * in a continuous chain from 1st base.
 */

import { createGameState, applyAction } from "../utils/scoringEngine";

function walkBatter(state) {
  // 4 balls = walk
  applyAction(state, "ball");
  applyAction(state, "ball");
  applyAction(state, "ball");
  applyAction(state, "ball");
}

describe("Walk force-advance (AB-004)", () => {
  let game;

  beforeEach(() => {
    game = createGameState("Home", "Away");
  });

  test("bases empty → batter walks to 1st", () => {
    walkBatter(game);
    expect(game.runners).toEqual({ first: true, second: false, third: false });
    expect(game.awayScore).toBe(0);
  });

  test("runner on 1st → batter to 1st, runner forced to 2nd", () => {
    game.runners.first = true;
    walkBatter(game);
    expect(game.runners).toEqual({ first: true, second: true, third: false });
    expect(game.awayScore).toBe(0);
  });

  test("runner on 2nd only → batter to 1st, runner stays on 2nd (NOT forced)", () => {
    // This is the exact bug scenario from AB-004
    game.runners.second = true;
    walkBatter(game);
    expect(game.runners).toEqual({ first: true, second: true, third: false });
    expect(game.awayScore).toBe(0);
  });

  test("runner on 3rd only → batter to 1st, runner stays on 3rd (NOT forced)", () => {
    game.runners.third = true;
    walkBatter(game);
    expect(game.runners).toEqual({ first: true, second: false, third: true });
    expect(game.awayScore).toBe(0);
  });

  test("runners on 1st and 2nd → both forced, batter to 1st", () => {
    game.runners.first = true;
    game.runners.second = true;
    walkBatter(game);
    expect(game.runners).toEqual({ first: true, second: true, third: true });
    expect(game.awayScore).toBe(0);
  });

  test("runners on 1st and 3rd → 1st forced to 2nd, 3rd stays (no force)", () => {
    game.runners.first = true;
    game.runners.third = true;
    walkBatter(game);
    expect(game.runners).toEqual({ first: true, second: true, third: true });
    expect(game.awayScore).toBe(0);
  });

  test("runners on 2nd and 3rd → neither forced, batter to 1st", () => {
    game.runners.second = true;
    game.runners.third = true;
    walkBatter(game);
    expect(game.runners).toEqual({ first: true, second: true, third: true });
    expect(game.awayScore).toBe(0);
  });

  test("bases loaded → all forced, runner from 3rd scores", () => {
    game.runners.first = true;
    game.runners.second = true;
    game.runners.third = true;
    walkBatter(game);
    expect(game.runners).toEqual({ first: true, second: true, third: true });
    expect(game.awayScore).toBe(1);
  });

  test("bases loaded walk scores correct team (home batting)", () => {
    game.isTop = false; // home batting
    game.runners.first = true;
    game.runners.second = true;
    game.runners.third = true;
    walkBatter(game);
    expect(game.homeScore).toBe(1);
    expect(game.awayScore).toBe(0);
  });

  test("walk resets count to 0-0", () => {
    game.strikes = 2; // full count scenario
    walkBatter(game);
    expect(game.balls).toBe(0);
    expect(game.strikes).toBe(0);
  });
});
