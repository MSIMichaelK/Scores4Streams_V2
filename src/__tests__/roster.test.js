import { createGameState, applyAction } from "../utils/scoringEngine.js";
import {
  getBattingLineup,
  getCurrentBatter,
  getCurrentPitcher,
  getPlayerById,
  updateRunnerIdentity,
  validateLineup,
} from "../utils/rosterHelpers.js";

// ─── Test Data ──────────────────────────────────────────────────

function makePlayer(id, name, number, battingOrder, position) {
  return { id, name, number: String(number), battingOrder, position };
}

function makeRoster() {
  return [
    makePlayer("p1", "Alice",   "1",  1, "P"),
    makePlayer("p2", "Beth",    "2",  2, "C"),
    makePlayer("p3", "Charlie", "3",  3, "1B"),
    makePlayer("p4", "Dana",    "4",  4, "2B"),
    makePlayer("p5", "Eve",     "5",  5, "3B"),
    makePlayer("p6", "Faye",    "6",  6, "SS"),
    makePlayer("p7", "Gina",    "7",  7, "LF"),
    makePlayer("p8", "Holly",   "8",  8, "CF"),
    makePlayer("p9", "Ivy",     "9",  9, "RF"),
  ];
}

function makeRosterWithDPFlex() {
  const roster = makeRoster();
  // Add DP (bats 10th) and FLEX (doesn't bat)
  roster.push(makePlayer("p10", "Jade", "10", 10, "DP"));
  roster.push(makePlayer("p11", "Kate", "11",  0, "FLEX"));
  return roster;
}

function stateWithRosters() {
  const game = createGameState("Home", "Away");
  game.homeRoster = makeRoster();
  game.awayRoster = makeRoster();
  game.currentHomePitcher = "p1";
  game.currentAwayPitcher = "p1";
  return game;
}

// ─── Helper Tests ───────────────────────────────────────────────

describe("getBattingLineup", () => {
  test("returns empty for null roster", () => {
    expect(getBattingLineup(null)).toEqual([]);
  });

  test("sorts by battingOrder and excludes subs", () => {
    const roster = [
      makePlayer("a", "A", "1", 3, "1B"),
      makePlayer("b", "B", "2", 0, "SS"), // sub
      makePlayer("c", "C", "3", 1, "P"),
    ];
    const lineup = getBattingLineup(roster);
    expect(lineup.map((p) => p.id)).toEqual(["c", "a"]);
  });

  test("includes 10 batters with DP", () => {
    const roster = makeRosterWithDPFlex();
    const lineup = getBattingLineup(roster);
    expect(lineup).toHaveLength(10);
    expect(lineup[9].position).toBe("DP");
  });
});

describe("getCurrentBatter", () => {
  test("returns first batter at index 0", () => {
    const game = stateWithRosters();
    // isTop = true, so away team bats
    const batter = getCurrentBatter(game);
    expect(batter.id).toBe("p1");
    expect(batter.battingOrder).toBe(1);
  });

  test("returns correct batter after advancing index", () => {
    const game = stateWithRosters();
    game.awayBatterIndex = 3;
    const batter = getCurrentBatter(game);
    expect(batter.id).toBe("p4");
  });

  test("returns null when no roster", () => {
    const game = createGameState();
    expect(getCurrentBatter(game)).toBeNull();
  });
});

describe("getCurrentPitcher", () => {
  test("returns home pitcher when away is batting (isTop)", () => {
    const game = stateWithRosters();
    const pitcher = getCurrentPitcher(game);
    expect(pitcher.id).toBe("p1");
    expect(pitcher.position).toBe("P");
  });

  test("returns away pitcher when home is batting", () => {
    const game = stateWithRosters();
    game.isTop = false;
    const pitcher = getCurrentPitcher(game);
    expect(pitcher.id).toBe("p1");
  });

  test("returns null when no pitcher set", () => {
    const game = stateWithRosters();
    game.currentHomePitcher = null;
    expect(getCurrentPitcher(game)).toBeNull();
  });
});

describe("getPlayerById", () => {
  test("finds player in home roster", () => {
    const game = stateWithRosters();
    expect(getPlayerById(game, "p5").name).toBe("Eve");
  });

  test("returns null for unknown ID", () => {
    const game = stateWithRosters();
    expect(getPlayerById(game, "unknown")).toBeNull();
  });
});

// ─── Batter Auto-Advance Tests ─────────────────────────────────

describe("Batter auto-advance", () => {
  test("advances after a single", () => {
    const game = stateWithRosters();
    expect(game.awayBatterIndex).toBe(0);
    applyAction(game, "single");
    expect(game.awayBatterIndex).toBe(1);
  });

  test("advances after a walk", () => {
    const game = stateWithRosters();
    game.balls = 3;
    applyAction(game, "ball"); // walk
    expect(game.awayBatterIndex).toBe(1);
  });

  test("advances after a strikeout", () => {
    const game = stateWithRosters();
    game.strikes = 2;
    applyAction(game, "strike"); // strikeout
    expect(game.awayBatterIndex).toBe(1);
  });

  test("advances after ground_out", () => {
    const game = stateWithRosters();
    applyAction(game, { type: "ground_out", positions: [6, 3] });
    expect(game.awayBatterIndex).toBe(1);
  });

  test("wraps around after 9th batter", () => {
    const game = stateWithRosters();
    game.awayBatterIndex = 8; // 9th batter (0-indexed)
    applyAction(game, "single");
    expect(game.awayBatterIndex).toBe(0); // wraps to top
  });

  test("wraps around after 10th batter with DP/FLEX", () => {
    const game = stateWithRosters();
    game.awayRoster = makeRosterWithDPFlex();
    game.awayBatterIndex = 9; // 10th batter
    applyAction(game, "single");
    expect(game.awayBatterIndex).toBe(0);
  });

  test("no auto-advance when no roster (backward compat)", () => {
    const game = createGameState();
    applyAction(game, "single");
    expect(game.awayBatterIndex).toBe(0); // unchanged
  });

  test("changeSides does not reset batter index", () => {
    const game = stateWithRosters();
    // Advance away batter a few times (each PA advances)
    applyAction(game, "single"); // index 0→1
    applyAction(game, "single"); // index 1→2
    expect(game.awayBatterIndex).toBe(2);
    // 3 outs to change sides (each out is a PA → index keeps advancing)
    applyAction(game, "out"); // index 2→3
    applyAction(game, "out"); // index 3→4
    applyAction(game, "out"); // index 4→5
    // Now home team bats. Away batter index should be preserved at 5.
    expect(game.isTop).toBe(false);
    expect(game.awayBatterIndex).toBe(5); // preserved across changeSides
    expect(game.homeBatterIndex).toBe(0); // home hasn't batted yet
  });

  test("advances correct team batter on changeSides out", () => {
    const game = stateWithRosters();
    // 2 outs already
    game.outs = 2;
    // This single advances the away batter, then 3rd out changes sides
    applyAction(game, "single");
    expect(game.awayBatterIndex).toBe(1); // away batter advanced
    // The 3rd out that changes sides — make sure it advances the away batter (not home)
    applyAction(game, "out"); // 3rd out, changeSides to bottom
    expect(game.awayBatterIndex).toBe(2); // advanced before changeSides
    expect(game.homeBatterIndex).toBe(0); // home hasn't batted yet
  });
});

// ─── Pitcher Change Tests ───────────────────────────────────────

describe("pitcher_change action", () => {
  test("updates current pitcher for home team", () => {
    const game = stateWithRosters();
    applyAction(game, { type: "pitcher_change", team: "home", pitcherId: "p3", playerName: "Charlie" });
    expect(game.currentHomePitcher).toBe("p3");
  });

  test("updates current pitcher for away team", () => {
    const game = stateWithRosters();
    applyAction(game, { type: "pitcher_change", team: "away", pitcherId: "p5", playerName: "Eve" });
    expect(game.currentAwayPitcher).toBe("p5");
  });

  test("records a pitcher_change event", () => {
    const game = stateWithRosters();
    applyAction(game, { type: "pitcher_change", team: "home", pitcherId: "p3", playerName: "Charlie" });
    const evt = game.events[game.events.length - 1];
    expect(evt.type).toBe("pitcher_change");
    expect(evt.isPitch).toBe(false);
    expect(evt.description).toContain("Charlie");
  });

  test("pitcher_change does NOT advance batter", () => {
    const game = stateWithRosters();
    applyAction(game, { type: "pitcher_change", team: "home", pitcherId: "p3" });
    expect(game.awayBatterIndex).toBe(0); // unchanged
  });
});

// ─── Runner Identity Tests ──────────────────────────────────────

describe("updateRunnerIdentity", () => {
  test("assigns batter to first on a single (empty bases)", () => {
    const result = updateRunnerIdentity(
      { first: null, second: null, third: null },
      { first: false, second: false, third: false },
      { first: true, second: false, third: false },
      "batter1"
    );
    expect(result.first).toBe("batter1");
  });

  test("advances runner from 1st to 2nd, batter to 1st on single", () => {
    const result = updateRunnerIdentity(
      { first: "runner-a", second: null, third: null },
      { first: true, second: false, third: false },
      { first: true, second: true, third: false },
      "batter1"
    );
    expect(result.second).toBe("runner-a");
    expect(result.first).toBe("batter1");
  });

  test("clears all on home run", () => {
    const result = updateRunnerIdentity(
      { first: "r1", second: "r2", third: "r3" },
      { first: true, second: true, third: true },
      { first: false, second: false, third: false },
      "batter1"
    );
    expect(result).toEqual({ first: null, second: null, third: null });
  });

  test("clears all on changeSides", () => {
    const result = updateRunnerIdentity(
      { first: "r1", second: null, third: null },
      { first: true, second: false, third: false },
      { first: false, second: false, third: false },
      null
    );
    expect(result).toEqual({ first: null, second: null, third: null });
  });

  test("handles double: 2nd and 3rd clear, batter to 2nd, 1st to 3rd", () => {
    const result = updateRunnerIdentity(
      { first: "r1", second: null, third: null },
      { first: true, second: false, third: false },
      { first: false, second: true, third: true },
      "batter1"
    );
    expect(result.third).toBe("r1");
    expect(result.second).toBe("batter1");
    expect(result.first).toBeNull();
  });
});

// ─── Lineup Validation Tests ────────────────────────────────────

describe("validateLineup", () => {
  test("valid 9-player lineup passes", () => {
    const result = validateLineup(makeRoster());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("valid 10-player DP/FLEX lineup passes", () => {
    const result = validateLineup(makeRosterWithDPFlex());
    expect(result.valid).toBe(true);
  });

  test("empty roster fails", () => {
    const result = validateLineup([]);
    expect(result.valid).toBe(false);
  });

  test("too few batters fails", () => {
    const roster = makeRoster().slice(0, 5);
    const result = validateLineup(roster);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("need at least 9"))).toBe(true);
  });

  test("DP without FLEX fails", () => {
    const roster = makeRoster();
    roster.push(makePlayer("dp", "DP", "10", 10, "DP"));
    const result = validateLineup(roster);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("FLEX"))).toBe(true);
  });

  test("duplicate batting order fails", () => {
    const roster = makeRoster();
    roster[1].battingOrder = 1; // duplicate with first player
    const result = validateLineup(roster);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Duplicate"))).toBe(true);
  });
});

// ─── Engine State Defaults ──────────────────────────────────────

describe("createGameState roster fields", () => {
  test("new state has null rosters", () => {
    const game = createGameState();
    expect(game.homeRoster).toBeNull();
    expect(game.awayRoster).toBeNull();
  });

  test("new state has zero batter indices", () => {
    const game = createGameState();
    expect(game.homeBatterIndex).toBe(0);
    expect(game.awayBatterIndex).toBe(0);
  });

  test("new state has null pitchers", () => {
    const game = createGameState();
    expect(game.currentHomePitcher).toBeNull();
    expect(game.currentAwayPitcher).toBeNull();
  });

  test("new state has empty runner identity", () => {
    const game = createGameState();
    expect(game.runnerIdentity).toEqual({ first: null, second: null, third: null });
  });
});
