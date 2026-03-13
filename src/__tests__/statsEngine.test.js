/**
 * Statistics engine tests for Scores4Streams V2.
 *
 * Tests team-level stats using full game replays (no rosters needed),
 * per-player stats using small roster-equipped scenarios, and edge cases
 * for unusual play types.
 */

import { createGameState, applyAction, replayActions } from "../utils/scoringEngine";
import { computeGameStats, formatIP } from "../utils/statsEngine";

// ─── Helper: replay a full game and get stats ────────────────────

function replayAndStats(homeTeam, awayTeam, actions) {
  const game = createGameState(homeTeam, awayTeam);
  replayActions(game, actions);
  const stats = computeGameStats(game.events, game.homeRoster, game.awayRoster);
  return { game, stats };
}

// ─── Sunshine Knox game actions (from gameReplay.test.js) ─────────

const sunshineKnoxActions = [
  // TOP 1: Psimaris Walk, Macaulay Out, Weldon K, Hughes Out
  "strike","ball","ball","ball","strike","foul","ball",
  "strike","out",
  "toggle_first","toggle_second",
  "strike","strike","strike",
  "strike","out",
  // BOT 1: Hotere-Moana Out, McMahon Single, Byrne Walk, Stewart HR, Dennis K, Ainslie K
  "strike","ball","foul","out",
  "strike","single",
  "ball","foul","foul","ball","ball","ball",
  "ball","homerun",
  "strike","foul","strike",
  "ball","ball","foul","foul","strike",
  // TOP 2: Blackley Out, Ferraro Walk, Scott K, Baker K
  "out",
  "ball","ball","ball","ball",
  "ball","strike","foul","strike",
  "strike","strike","foul","foul","strike",
  // BOT 2: Kronk Out, M.Hughes Out, L.Hughes Out
  "ball","strike","ball","ball","foul","out",
  "strike","foul","out",
  "foul","out",
  // TOP 3: Bedwell K, Psimaris K, Macaulay Walk, Weldon K
  "strike","ball","strike","strike",
  "foul","strike","ball","foul","ball","strike",
  "foul","strike","foul","foul","ball","foul","ball","foul","foul","ball","ball",
  "strike","foul","ball","strike",
  // BOT 3: Hotere-Moana Single, McMahon K (SB via toggle), Byrne Out, Stewart Out
  "ball","single",
  "strike","ball","strike",
  "toggle_first","toggle_second",
  "strike",
  "strike","foul","out",
  "toggle_second","toggle_third",
  "strike","ball","out",
  // TOP 4: Hughes Walk, Blackley K, Ferraro Out (sac), Scott Out
  "foul","ball","strike","foul","ball","foul","ball","ball",
  "ball","ball","strike","strike","strike",
  "strike","ball","out",
  "toggle_first","toggle_second",
  "strike","ball",
  "toggle_second","toggle_third",
  "foul","out",
  // BOT 4: Dennis Out, Ainslie K (dropped 3rd), Evans Out
  "out",
  "ball","foul","ball","strike","strike",
  "out",
  // TOP 5: Baker K, Addlem Error, Psimaris HR, Macaulay K, Weldon K
  "foul","ball","ball","strike","foul","strike",
  "ball","strike","ball","foul","error",
  "homerun",
  "foul","ball","strike","strike",
  "ball","strike","ball","foul","strike",
];

// ─── Team Batting Stats ──────────────────────────────────────────

describe("statsEngine", () => {
  describe("Team batting stats", () => {
    let stats;

    beforeAll(() => {
      const result = replayAndStats("Sunshine Knox", "Geelong Northern", sunshineKnoxActions);
      stats = result.stats;
    });

    test("away (Geelong) batting totals", () => {
      const b = stats.away.batting;
      expect(b.PA).toBe(21);
      expect(b.AB).toBe(16);  // 21 - 4(BB) - 1(error)
      expect(b.H).toBe(1);    // 1 HR
      expect(b["1B"]).toBe(0);
      expect(b.HR).toBe(1);
      expect(b.BB).toBe(4);
      expect(b.K).toBe(10);
      expect(b.RBI).toBe(2);  // HR with runner on = 2 RBI
      expect(b.R).toBe(2);
      expect(b.TB).toBe(4);
      expect(b.XBH).toBe(1);
      expect(b.SF).toBe(0);
      expect(b.SH).toBe(0);
    });

    test("home (Sunshine) batting totals", () => {
      const b = stats.home.batting;
      expect(b.PA).toBe(16);
      expect(b.AB).toBe(15);  // 16 - 1(BB)
      expect(b.H).toBe(3);    // 2 singles + 1 HR
      expect(b["1B"]).toBe(2);
      expect(b.HR).toBe(1);
      expect(b.BB).toBe(1);
      expect(b.K).toBe(4);
      expect(b.RBI).toBe(3);  // HR with 2 runners on = 3 RBI
      expect(b.R).toBe(3);
      expect(b.TB).toBe(6);   // 2×1 + 1×4 = 6
      expect(b.XBH).toBe(1);
    });

    test("handles empty events array", () => {
      const empty = computeGameStats([], null, null);
      expect(empty.home.batting.PA).toBe(0);
      expect(empty.away.batting.PA).toBe(0);
      expect(empty.home.batting.BA).toBe(0);
    });

    test("filters out undone events", () => {
      const game = createGameState("A", "B");
      replayActions(game, ["single", "single"]);
      // Mark first event as undone
      game.events[0].undone = true;
      const stats = computeGameStats(game.events, null, null);
      // Only 1 hit should count (the second single, which is in top half = away batting)
      expect(stats.away.batting.H).toBe(1);
    });
  });

  // ─── Batting Rate Stats ──────────────────────────────────────

  describe("Batting rates", () => {
    test("BA, OBP, SLG, OPS calculations", () => {
      const result = replayAndStats("Sunshine Knox", "Geelong Northern", sunshineKnoxActions);
      const away = result.stats.away.batting;

      // Geelong: 1 H, 16 AB → BA = 0.063
      expect(away.BA).toBeCloseTo(0.063, 3);
      // OBP = (1+4+0)/(16+4+0+0) = 5/20 = 0.250
      expect(away.OBP).toBeCloseTo(0.250, 3);
      // SLG = 4/16 = 0.250
      expect(away.SLG).toBeCloseTo(0.250, 3);
      // OPS = 0.250 + 0.250 = 0.500
      expect(away.OPS).toBeCloseTo(0.500, 3);
    });

    test("home batting rates", () => {
      const result = replayAndStats("Sunshine Knox", "Geelong Northern", sunshineKnoxActions);
      const home = result.stats.home.batting;

      // Sunshine: 3 H, 15 AB → BA = 0.200
      expect(home.BA).toBeCloseTo(0.200, 3);
      // OBP = (3+1+0)/(15+1+0+0) = 4/16 = 0.250
      expect(home.OBP).toBeCloseTo(0.250, 3);
      // SLG = 6/15 = 0.400
      expect(home.SLG).toBeCloseTo(0.400, 3);
      // OPS = 0.250 + 0.400 = 0.650
      expect(home.OPS).toBeCloseTo(0.650, 3);
    });

    test("handles 0 AB (no division by zero)", () => {
      // 4 walks = 4 PA, 0 AB
      const game = createGameState("A", "B");
      replayActions(game, ["ball","ball","ball","ball","ball","ball","ball","ball","ball","ball","ball","ball"]);
      const stats = computeGameStats(game.events, null, null);
      expect(stats.away.batting.PA).toBe(3);
      expect(stats.away.batting.AB).toBe(0);
      expect(stats.away.batting.BA).toBe(0);
      expect(stats.away.batting.SLG).toBe(0);
    });
  });

  // ─── Team Pitching Stats ─────────────────────────────────────

  describe("Team pitching stats", () => {
    let stats;

    beforeAll(() => {
      const result = replayAndStats("Sunshine Knox", "Geelong Northern", sunshineKnoxActions);
      stats = result.stats;
    });

    test("home pitching (pitched to away batters)", () => {
      const p = stats.home.pitching;
      expect(p.BF).toBe(21);       // 21 away PAs
      expect(p.outsRecorded).toBe(15); // 5 innings × 3 outs
      expect(p.IP).toBe("5.0");
      expect(p.H).toBe(1);         // 1 HR
      expect(p.R).toBe(2);
      expect(p.ER).toBe(2);        // All earned for now
      expect(p.BB).toBe(4);
      expect(p.K).toBe(10);
      expect(p.WP).toBe(0);
    });

    test("away pitching (pitched to home batters)", () => {
      const p = stats.away.pitching;
      expect(p.BF).toBe(16);       // 16 home PAs
      expect(p.outsRecorded).toBe(12); // 4 innings × 3 outs
      expect(p.IP).toBe("4.0");
      expect(p.H).toBe(3);         // 2 singles + 1 HR
      expect(p.R).toBe(3);
      expect(p.ER).toBe(3);
      expect(p.BB).toBe(1);
      expect(p.K).toBe(4);
    });

    test("pitching rates (softball = 7 innings)", () => {
      const hp = stats.home.pitching;
      // ERA = (2 × 7) / 5.0 = 2.80
      expect(hp.ERA).toBeCloseTo(2.80, 2);
      // WHIP = (4 + 1) / 5.0 = 1.00
      expect(hp.WHIP).toBeCloseTo(1.00, 2);
      // K/9 = (10 × 7) / 5.0 = 14.00
      expect(hp["K/9"]).toBeCloseTo(14.00, 2);

      const ap = stats.away.pitching;
      // ERA = (3 × 7) / 4.0 = 5.25
      expect(ap.ERA).toBeCloseTo(5.25, 2);
      // WHIP = (1 + 3) / 4.0 = 1.00
      expect(ap.WHIP).toBeCloseTo(1.00, 2);
    });

    test("handles 0 IP (no division by zero)", () => {
      const stats = computeGameStats([], null, null);
      expect(stats.home.pitching.ERA).toBe(0);
      expect(stats.home.pitching.WHIP).toBe(0);
    });

    test("pitch count includes ball/strike/foul", () => {
      const game = createGameState("A", "B");
      // 3 balls + 1 single = 4 isPitch events
      replayActions(game, ["ball", "ball", "ball", "single"]);
      const stats = computeGameStats(game.events, null, null);
      // All 4 events have isPitch:true, counted as home pitching (isTop=true)
      expect(stats.home.pitching.pitches).toBe(4);
    });
  });

  // ─── IP Formatting ───────────────────────────────────────────

  describe("formatIP", () => {
    test("formats complete innings", () => {
      expect(formatIP(0)).toBe("0.0");
      expect(formatIP(3)).toBe("1.0");
      expect(formatIP(6)).toBe("2.0");
      expect(formatIP(21)).toBe("7.0");
    });

    test("formats partial innings", () => {
      expect(formatIP(1)).toBe("0.1");
      expect(formatIP(2)).toBe("0.2");
      expect(formatIP(4)).toBe("1.1");
      expect(formatIP(5)).toBe("1.2");
      expect(formatIP(16)).toBe("5.1");
    });
  });

  // ─── Edge Cases ──────────────────────────────────────────────

  describe("Edge cases", () => {
    test("error is PA but not AB or H", () => {
      const game = createGameState("A", "B");
      replayActions(game, ["error"]);
      const stats = computeGameStats(game.events, null, null);
      expect(stats.away.batting.PA).toBe(1);
      expect(stats.away.batting.AB).toBe(0); // Error excluded from AB
      expect(stats.away.batting.H).toBe(0);
    });

    test("FC is AB but not H, records an out", () => {
      const game = createGameState("A", "B");
      applyAction(game, { type: "fc", positions: [6, 4] });
      const stats = computeGameStats(game.events, null, null);
      expect(stats.away.batting.PA).toBe(1);
      expect(stats.away.batting.AB).toBe(1);
      expect(stats.away.batting.H).toBe(0);
      // FC records an out for pitcher
      expect(stats.home.pitching.outsRecorded).toBe(1);
    });

    test("sac_fly is PA but not AB, records out + RBI", () => {
      const game = createGameState("A", "B");
      // Put runner on 3rd, then sac fly
      applyAction(game, "single");
      applyAction(game, "toggle_first");
      applyAction(game, "toggle_third");
      applyAction(game, { type: "sac_fly" });
      const stats = computeGameStats(game.events, null, null);
      // 2 PAs: single + sac_fly
      expect(stats.away.batting.PA).toBe(2);
      // AB: single counts (1), sac_fly does not → 1
      expect(stats.away.batting.AB).toBe(1);
      expect(stats.away.batting.SF).toBe(1);
      expect(stats.away.batting.RBI).toBe(1);
    });

    test("sacrifice_bunt is PA but not AB", () => {
      const game = createGameState("A", "B");
      applyAction(game, { type: "sacrifice_bunt" });
      const stats = computeGameStats(game.events, null, null);
      expect(stats.away.batting.PA).toBe(1);
      expect(stats.away.batting.AB).toBe(0);
      expect(stats.away.batting.SH).toBe(1);
    });

    test("double_play counts as GDP for batter and 2 outs for pitcher", () => {
      const game = createGameState("A", "B");
      applyAction(game, "single"); // Runner on 1st
      applyAction(game, { type: "double_play", positions: [6, 4, 3], runnersOut: ["first"] });
      const stats = computeGameStats(game.events, null, null);
      expect(stats.away.batting.GDP).toBe(1);
      expect(stats.home.pitching.outsRecorded).toBe(2);
    });

    test("intentional_walk counts as BB and IBB", () => {
      const game = createGameState("A", "B");
      applyAction(game, { type: "intentional_walk" });
      const stats = computeGameStats(game.events, null, null);
      expect(stats.away.batting.BB).toBe(1);
      expect(stats.away.batting.IBB).toBe(1);
      expect(stats.away.batting.PA).toBe(1);
      expect(stats.away.batting.AB).toBe(0);
      // Pitching: IBB counts toward BB total
      expect(stats.home.pitching.BB).toBe(1);
      expect(stats.home.pitching.IBB).toBe(1);
    });

    test("obstruction is PA but not AB", () => {
      const game = createGameState("A", "B");
      applyAction(game, { type: "obstruction" });
      const stats = computeGameStats(game.events, null, null);
      expect(stats.away.batting.PA).toBe(1);
      expect(stats.away.batting.AB).toBe(0);
    });

    test("bunt_hit counts as H and 1B", () => {
      const game = createGameState("A", "B");
      applyAction(game, { type: "bunt_hit" });
      const stats = computeGameStats(game.events, null, null);
      expect(stats.away.batting.H).toBe(1);
      expect(stats.away.batting["1B"]).toBe(1);
    });

    test("slap_hit counts as H and 1B", () => {
      const game = createGameState("A", "B");
      applyAction(game, { type: "slap_hit" });
      const stats = computeGameStats(game.events, null, null);
      expect(stats.away.batting.H).toBe(1);
      expect(stats.away.batting["1B"]).toBe(1);
    });

    test("dropped_third_strike counts as K and AB", () => {
      const game = createGameState("A", "B");
      applyAction(game, { type: "dropped_third_strike" });
      const stats = computeGameStats(game.events, null, null);
      expect(stats.away.batting.K).toBe(1);
      expect(stats.away.batting.PA).toBe(1);
      expect(stats.away.batting.AB).toBe(1); // D3K is an AB
      expect(stats.home.pitching.K).toBe(1); // Pitcher gets K credit
    });

    test("SB credited to batting team", () => {
      const game = createGameState("A", "B");
      applyAction(game, "single");
      applyAction(game, { type: "stolen_base", runner: "first" });
      const stats = computeGameStats(game.events, null, null);
      expect(stats.away.batting.SB).toBe(1);
    });

    test("CS credited to batting team", () => {
      const game = createGameState("A", "B");
      applyAction(game, "single");
      applyAction(game, { type: "caught_stealing", runner: "first" });
      const stats = computeGameStats(game.events, null, null);
      expect(stats.away.batting.CS).toBe(1);
      // CS is an out for pitcher
      expect(stats.home.pitching.outsRecorded).toBe(1);
    });

    test("wild_pitch runs count toward pitching and batting R", () => {
      const game = createGameState("A", "B");
      applyAction(game, "single");
      applyAction(game, "toggle_first");
      applyAction(game, "toggle_third");
      applyAction(game, { type: "wild_pitch", runners: ["third"] });
      const stats = computeGameStats(game.events, null, null);
      expect(stats.away.batting.R).toBe(1); // Team run from WP
      expect(stats.home.pitching.R).toBe(1);
      expect(stats.home.pitching.WP).toBe(1);
    });

    test("HBP counts as PA, not AB, pitcher gets HBP", () => {
      const game = createGameState("A", "B");
      applyAction(game, "hbp");
      const stats = computeGameStats(game.events, null, null);
      expect(stats.away.batting.PA).toBe(1);
      expect(stats.away.batting.AB).toBe(0);
      expect(stats.away.batting.HBP).toBe(1);
      expect(stats.home.pitching.HBP).toBe(1);
    });
  });

  // ─── Per-Player Stats ────────────────────────────────────────

  describe("Per-player stats", () => {
    function makePlayer(id, name, number, order, pos) {
      return { id, name, number: String(number), battingOrder: order, position: pos };
    }

    test("null roster returns null players", () => {
      const stats = computeGameStats([], null, null);
      expect(stats.home.players).toBeNull();
      expect(stats.away.players).toBeNull();
    });

    test("individual batting lines from roster game", () => {
      const game = createGameState("Home", "Away");

      // Set up away roster with 3 batters
      game.awayRoster = [
        makePlayer("b1", "Alice", 1, 1, "SS"),
        makePlayer("b2", "Bob", 2, 2, "CF"),
        makePlayer("b3", "Carol", 3, 3, "1B"),
      ];
      game.awayBatterIndex = 0;
      game.currentAwayPitcher = null;

      // Set up home roster with 1 pitcher
      game.homeRoster = [
        makePlayer("p1", "Dave", 10, 1, "P"),
      ];
      game.currentHomePitcher = "p1";

      // Simulate events with batterId/pitcherId manually stamped
      // Alice: single (isTop=true, batterId=b1, pitcherId=p1)
      applyAction(game, "single");
      game.events[game.events.length - 1].batterId = "b1";
      game.events[game.events.length - 1].pitcherId = "p1";

      // Bob: strikeout
      replayActions(game, ["strike", "strike", "strike"]);
      game.events[game.events.length - 1].batterId = "b2";
      game.events[game.events.length - 1].pitcherId = "p1";

      // Carol: double
      applyAction(game, "double");
      game.events[game.events.length - 1].batterId = "b3";
      game.events[game.events.length - 1].pitcherId = "p1";

      const stats = computeGameStats(game.events, game.homeRoster, game.awayRoster);

      // Away player batting
      const awayBatting = stats.away.players.batting;
      const alice = awayBatting.find((p) => p.playerId === "b1");
      expect(alice.H).toBe(1);
      expect(alice["1B"]).toBe(1);
      expect(alice.PA).toBe(1);
      expect(alice.AB).toBe(1);
      expect(alice.BA).toBe(1.000);

      const bob = awayBatting.find((p) => p.playerId === "b2");
      expect(bob.K).toBe(1);
      expect(bob.PA).toBe(1);
      expect(bob.AB).toBe(1);
      expect(bob.BA).toBe(0);

      const carol = awayBatting.find((p) => p.playerId === "b3");
      expect(carol.H).toBe(1);
      expect(carol["2B"]).toBe(1);
      expect(carol.TB).toBe(2);
      expect(carol.SLG).toBe(2.000);
    });

    test("per-pitcher stats split correctly", () => {
      const game = createGameState("Home", "Away");

      // Home roster with 2 pitchers
      game.homeRoster = [
        makePlayer("p1", "Pitcher1", 10, 1, "P"),
        makePlayer("p2", "Pitcher2", 20, 2, "P"),
      ];

      // Simulate: p1 pitches to 2 batters, then p2 pitches to 1 batter
      // All events are isTop=true (away batting = home pitching)
      applyAction(game, "single");
      game.events[game.events.length - 1].pitcherId = "p1";

      applyAction(game, "out");
      game.events[game.events.length - 1].pitcherId = "p1";

      applyAction(game, { type: "pitcher_change", team: "home", pitcherId: "p2" });

      applyAction(game, "homerun");
      game.events[game.events.length - 1].pitcherId = "p2";

      const stats = computeGameStats(game.events, game.homeRoster, null);

      const homePitching = stats.home.players.pitching;
      const p1 = homePitching.find((p) => p.playerId === "p1");
      expect(p1.BF).toBe(2);
      expect(p1.H).toBe(1);
      expect(p1.outsRecorded).toBe(1);
      expect(p1.R).toBe(0);

      const p2 = homePitching.find((p) => p.playerId === "p2");
      expect(p2.BF).toBe(1);
      expect(p2.H).toBe(1); // HR is a hit
      expect(p2.R).toBe(2); // 2 runs (no inheritedRunnerPitcherIds → all to current pitcher)
    });

    test("inherited runner attribution: run charged to original pitcher", () => {
      const game = createGameState("Home", "Away");

      game.homeRoster = [
        makePlayer("pA", "PitcherA", 10, 1, "P"),
        makePlayer("pB", "PitcherB", 20, 2, "P"),
      ];

      // pA allows a single (runner on 1st)
      applyAction(game, "single");
      game.events[game.events.length - 1].pitcherId = "pA";

      // pA records an out
      applyAction(game, "out");
      game.events[game.events.length - 1].pitcherId = "pA";

      // Pitcher change: pA → pB
      applyAction(game, { type: "pitcher_change", team: "home", pitcherId: "pB" });

      // pB gives up a HR scoring inherited runner + batter = 2 runs
      applyAction(game, "homerun");
      const hrEvent = game.events[game.events.length - 1];
      hrEvent.pitcherId = "pB";
      // The inherited runner was put on by pA
      hrEvent.inheritedRunnerPitcherIds = ["pA", "pB"];

      const stats = computeGameStats(game.events, game.homeRoster, null);
      const pitching = stats.home.players.pitching;

      const pA = pitching.find((p) => p.playerId === "pA");
      expect(pA.R).toBe(1);  // Inherited runner charged to pA
      expect(pA.ER).toBe(1);

      const pB = pitching.find((p) => p.playerId === "pB");
      expect(pB.R).toBe(1);  // Only the batter's run charged to pB
      expect(pB.ER).toBe(1);
    });

    test("inherited runner: all runs to new pitcher when no inherited runners", () => {
      const game = createGameState("Home", "Away");

      game.homeRoster = [
        makePlayer("pA", "PitcherA", 10, 1, "P"),
        makePlayer("pB", "PitcherB", 20, 2, "P"),
      ];

      // pA pitches 3 outs, no runners
      applyAction(game, "out");
      game.events[game.events.length - 1].pitcherId = "pA";
      applyAction(game, "out");
      game.events[game.events.length - 1].pitcherId = "pA";
      applyAction(game, "out");
      game.events[game.events.length - 1].pitcherId = "pA";

      // Side change
      applyAction(game, "out");
      applyAction(game, "out");
      applyAction(game, "out");

      // New inning top, pB pitches
      applyAction(game, { type: "pitcher_change", team: "home", pitcherId: "pB" });
      applyAction(game, "single");
      game.events[game.events.length - 1].pitcherId = "pB";
      applyAction(game, "homerun");
      const hrEvent = game.events[game.events.length - 1];
      hrEvent.pitcherId = "pB";
      // Both runs belong to pB (no inherited runner)
      hrEvent.inheritedRunnerPitcherIds = ["pB", "pB"];

      const stats = computeGameStats(game.events, game.homeRoster, null);
      const pitching = stats.home.players.pitching;

      const pA = pitching.find((p) => p.playerId === "pA");
      expect(pA.R).toBe(0);

      const pB = pitching.find((p) => p.playerId === "pB");
      expect(pB.R).toBe(2);
    });

    test("inherited runner scores on wild pitch — charged to original pitcher", () => {
      const game = createGameState("Home", "Away");

      game.homeRoster = [
        makePlayer("pA", "PitcherA", 10, 1, "P"),
        makePlayer("pB", "PitcherB", 20, 2, "P"),
      ];

      // pA walks a batter
      replayActions(game, ["ball", "ball", "ball", "ball"]);
      game.events[game.events.length - 1].pitcherId = "pA";

      // Manual advance runner to 3rd for testing
      applyAction(game, "toggle_first");
      applyAction(game, "toggle_third");

      // Pitcher change
      applyAction(game, { type: "pitcher_change", team: "home", pitcherId: "pB" });

      // Wild pitch scores the runner from 3rd
      applyAction(game, { type: "wild_pitch", runners: ["third"] });
      const wpEvent = game.events[game.events.length - 1];
      wpEvent.pitcherId = "pB";
      wpEvent.inheritedRunnerPitcherIds = ["pA"];

      const stats = computeGameStats(game.events, game.homeRoster, null);
      const pitching = stats.home.players.pitching;

      const pA = pitching.find((p) => p.playerId === "pA");
      expect(pA.R).toBe(1);  // Run charged to pA (put the runner on)
      expect(pA.WP).toBe(0); // WP stat stays on pB

      const pB = pitching.find((p) => p.playerId === "pB");
      expect(pB.R).toBe(0);  // No runs charged
      expect(pB.WP).toBe(1); // WP counted for pB
    });

    test("multiple inherited runners from different pitchers", () => {
      const game = createGameState("Home", "Away");

      game.homeRoster = [
        makePlayer("pA", "PitcherA", 10, 1, "P"),
        makePlayer("pB", "PitcherB", 20, 2, "P"),
        makePlayer("pC", "PitcherC", 30, 3, "P"),
      ];

      // pA allows a single
      applyAction(game, "single");
      game.events[game.events.length - 1].pitcherId = "pA";

      // pB comes in and allows a single (pA runner on 2nd, pB runner on 1st)
      applyAction(game, { type: "pitcher_change", team: "home", pitcherId: "pB" });
      applyAction(game, "single");
      game.events[game.events.length - 1].pitcherId = "pB";

      // pC comes in and gives up a HR scoring all 3
      applyAction(game, { type: "pitcher_change", team: "home", pitcherId: "pC" });
      applyAction(game, "homerun");
      const hrEvent = game.events[game.events.length - 1];
      hrEvent.pitcherId = "pC";
      // 3 runs: inherited from pA, inherited from pB, batter (pC)
      hrEvent.inheritedRunnerPitcherIds = ["pA", "pB", "pC"];

      const stats = computeGameStats(game.events, game.homeRoster, null);
      const pitching = stats.home.players.pitching;

      const pA = pitching.find((p) => p.playerId === "pA");
      expect(pA.R).toBe(1);

      const pB = pitching.find((p) => p.playerId === "pB");
      expect(pB.R).toBe(1);

      const pC = pitching.find((p) => p.playerId === "pC");
      expect(pC.R).toBe(1);
    });

    test("backward compat: events without inheritedRunnerPitcherIds charge all to pitcherId", () => {
      const game = createGameState("Home", "Away");

      game.homeRoster = [
        makePlayer("pA", "PitcherA", 10, 1, "P"),
        makePlayer("pB", "PitcherB", 20, 2, "P"),
      ];

      // pA allows a runner
      applyAction(game, "single");
      game.events[game.events.length - 1].pitcherId = "pA";

      applyAction(game, { type: "pitcher_change", team: "home", pitcherId: "pB" });

      // pB gives up HR but NO inheritedRunnerPitcherIds (old event format)
      applyAction(game, "homerun");
      game.events[game.events.length - 1].pitcherId = "pB";
      // No inheritedRunnerPitcherIds set — backward compat

      const stats = computeGameStats(game.events, game.homeRoster, null);
      const pitching = stats.home.players.pitching;

      const pA = pitching.find((p) => p.playerId === "pA");
      expect(pA.R).toBe(0);  // No inherited attribution without the array

      const pB = pitching.find((p) => p.playerId === "pB");
      expect(pB.R).toBe(2);  // All runs charged to current pitcher (old behavior)
    });
  });

  // ─── Fielding Stats ──────────────────────────────────────────

  describe("Fielding stats", () => {
    test("PO and A from positions array", () => {
      const game = createGameState("A", "B");
      // Ground out 6-3: SS assists, 1B putout
      applyAction(game, { type: "ground_out", positions: [6, 3] });
      const stats = computeGameStats(game.events, null, null);
      // Home fielding (they field when away bats)
      expect(stats.home.fielding).not.toBeNull();
      expect(stats.home.fielding[3].PO).toBe(1); // 1B putout
      expect(stats.home.fielding[6].A).toBe(1);  // SS assist
    });

    test("error tracked to fielder position", () => {
      const game = createGameState("A", "B");
      applyAction(game, { type: "error", positions: [6] });
      const stats = computeGameStats(game.events, null, null);
      expect(stats.home.fielding[6].E).toBe(1);
    });

    test("DP participation tracked", () => {
      const game = createGameState("A", "B");
      applyAction(game, "single");
      applyAction(game, { type: "double_play", positions: [6, 4, 3], runnersOut: ["first"] });
      const stats = computeGameStats(game.events, null, null);
      expect(stats.home.fielding[6].DP).toBe(1);
      expect(stats.home.fielding[4].DP).toBe(1);
      expect(stats.home.fielding[3].DP).toBe(1);
    });

    test("FPCT calculated correctly", () => {
      const game = createGameState("A", "B");
      // 6-3 groundout, then error by SS, then another 6-3
      applyAction(game, { type: "ground_out", positions: [6, 3] });
      applyAction(game, { type: "error", positions: [6] });
      applyAction(game, { type: "ground_out", positions: [6, 3] });
      const stats = computeGameStats(game.events, null, null);
      // SS: 2 assists, 1 error, 0 putouts → TC=3, FPCT = (0+2)/3 = 0.667
      expect(stats.home.fielding[6].A).toBe(2);
      expect(stats.home.fielding[6].E).toBe(1);
      expect(stats.home.fielding[6].TC).toBe(3);
      expect(stats.home.fielding[6].FPCT).toBeCloseTo(0.667, 3);
    });

    test("null without position data", () => {
      const game = createGameState("A", "B");
      applyAction(game, "out"); // Generic out, no positions
      const stats = computeGameStats(game.events, null, null);
      expect(stats.home.fielding).toBeNull();
    });
  });
});
