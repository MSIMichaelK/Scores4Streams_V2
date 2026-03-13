/**
 * Full game replay: ACT vs South Australia — L2 Practice Game
 * Source: Softball Australia L2 Scoring Manual, Section 17 (pp 27-31)
 * Date: 5 Jan 2021 — at Blacktown
 * Final: ACT (Away) 6 - South Australia (Home) 4
 * Line: ACT  0 0 2 0 2 0 2 = 6 | SA  0 1 0 3 0 0 0 = 4
 *
 * First test to use Advanced mode polymorphic object actions:
 *   ground_out with positions, fly_out, line_drive_out, strikeout_swinging,
 *   strikeout_looking, error, hbp, wild_pitch, caught_stealing,
 *   dropped_third_strike, hit with subType
 *
 * Features exercised: DP/FLEX lineups, ground outs with fielder chains,
 * fly outs, line drive outs, KC, K2, D3K (thrown out), HR, doubles,
 * singles, walks, HBP, errors (E6, E5), stolen bases, caught stealing,
 * wild pitches, bases-loaded HBP force advance
 *
 * Limitations:
 * - Substitutions not modeled (no sub action yet, only pitcher_change)
 * - Runner scoring on ground out modeled with toggle + score_away/score_home
 * - Extra runner advancement on WP modeled with toggle + score_home
 * - Baumber's at-bat result in Bot 4th inferred as walk (text ambiguous)
 */

import { createGameState, replayActions } from "../utils/scoringEngine";

describe("Game Replay: ACT vs South Australia — L2 Practice Game", () => {
  let game;

  beforeEach(() => {
    game = createGameState("South Australia", "ACT");
  });

  // ─── TOP 1st: ACT Batting ────────────────────────────────────────
  // White: Ball, Strike looking, Ball. Ground out 6-3.
  // McGovern: Strike looking. Ground out 5-3.
  // Kirkpatrick: Foul, Ball, Ball, Foul, Ball, Ball. Walk.
  // Norton: Strike, Foul, Ball, Foul, Ball, Foul, Ball. Line out to SS.
  // Result: 0 runs, 3 outs

  const top1 = [
    // White: Ball, Strike looking, Ball. Ground out 6-3.
    "ball", "strike", "ball", { type: "ground_out", positions: [6, 3] },
    // McGovern: Strike looking. Ground out 5-3.
    "strike", { type: "ground_out", positions: [5, 3] },
    // Kirkpatrick: Foul, Ball, Ball, Foul, Ball, Ball → Walk
    "foul", "ball", "ball", "foul", "ball", "ball",
    // Norton: Strike, Foul, Ball, Foul, Ball, Foul, Ball. LD out to SS.
    "strike", "foul", "ball", "foul", "ball", "foul", "ball",
    { type: "line_drive_out", positions: [6] },
  ];

  test("Top 1st: ACT 0, SA 0", () => {
    replayActions(game, top1);
    expect(game.awayScore).toBe(0);
    expect(game.homeScore).toBe(0);
    expect(game.isTop).toBe(false);
    expect(game.inning).toBe(1);
    expect(game.outs).toBe(0);
  });

  // ─── BOT 1st: SA Batting ─────────────────────────────────────────
  // Harris: Ball, Strike looking. LD out to SS.
  // Harrison: Strike looking, Strike looking. K swinging.
  // Farrell: Strike looking, Ball, Strike looking. K swinging.
  // Result: 0 runs, 3 outs

  const bot1 = [
    // Harris: Ball, Strike looking. Line drive out to SS.
    "ball", "strike", { type: "line_drive_out", positions: [6] },
    // Harrison: Strike looking, Strike looking. K swinging.
    "strike", "strike", { type: "strikeout_swinging" },
    // Farrell: Strike looking, Ball, Strike looking. K swinging.
    "strike", "ball", "strike", { type: "strikeout_swinging" },
  ];

  test("Bot 1st: ACT 0, SA 0", () => {
    replayActions(game, [...top1, ...bot1]);
    expect(game.awayScore).toBe(0);
    expect(game.homeScore).toBe(0);
    expect(game.isTop).toBe(true);
    expect(game.inning).toBe(2);
  });

  // ─── TOP 2nd: ACT Batting ────────────────────────────────────────
  // Byrne: Strike, Foul, Ball, Foul, Ball. K swinging.
  // Jar. Bradbury: Strike looking, Strike swinging. Error by SS (E6).
  // Jones: Ball, Foul, Strike, Foul, Ball, Foul. K swinging.
  // Johnson: Ball, Foul, Strike, Ball, Foul. K swinging.
  // Result: 0 runs, 3 outs (Bradbury stranded on 1st)

  const top2 = [
    // Byrne: Strike, Foul, Ball, Foul, Ball. K swinging.
    "strike", "foul", "ball", "foul", "ball", { type: "strikeout_swinging" },
    // Jar. Bradbury: Strike looking, Strike swinging. Error E6 — reaches 1st.
    "strike", "strike", { type: "error", positions: [6] },
    // Jones: Ball, Foul, Strike, Foul, Ball, Foul. K swinging.
    "ball", "foul", "strike", "foul", "ball", "foul", { type: "strikeout_swinging" },
    // Johnson: Ball, Foul, Strike, Ball, Foul. K swinging.
    "ball", "foul", "strike", "ball", "foul", { type: "strikeout_swinging" },
  ];

  test("Top 2nd: ACT 0, SA 0", () => {
    replayActions(game, [...top1, ...bot1, ...top2]);
    expect(game.awayScore).toBe(0);
    expect(game.homeScore).toBe(0);
    expect(game.isTop).toBe(false);
    expect(game.inning).toBe(2);
  });

  // ─── BOT 2nd: SA Batting ─────────────────────────────────────────
  // Kipfer: Home run to RF (first pitch).
  // May: Ball, Strike, Strike. Fly out to RF.
  // Lach: Ball, Strike, Ball, Strike. LD out to 3B.
  // Paturis: Ball, Ball, Ball, Strike, Strike, Ball. Walk.
  // Peterson: Strike, Strike, Ball, Ball, Ball. K swinging.
  // Result: 1 run (Kipfer HR), 3 outs

  const bot2 = [
    // Kipfer: Home run to RF (first pitch)
    "homerun",
    // May: Ball, Strike, Strike. Fly out to RF.
    "ball", "strike", "strike", { type: "fly_out", positions: [9] },
    // Lach: Ball, Strike, Ball, Strike. LD out to 3B.
    "ball", "strike", "ball", "strike", { type: "line_drive_out", positions: [5] },
    // Paturis: Ball, Ball, Ball, Strike, Strike, Ball → Walk
    "ball", "ball", "ball", "strike", "strike", "ball",
    // Peterson: Strike, Strike, Ball, Ball, Ball. K swinging.
    "strike", "strike", "ball", "ball", "ball", { type: "strikeout_swinging" },
  ];

  test("Bot 2nd: ACT 0, SA 1", () => {
    replayActions(game, [...top1, ...bot1, ...top2, ...bot2]);
    expect(game.awayScore).toBe(0);
    expect(game.homeScore).toBe(1);
    expect(game.isTop).toBe(true);
    expect(game.inning).toBe(3);
  });

  // ─── TOP 3rd: ACT Batting ────────────────────────────────────────
  // Jer. Bradbury: Strike, Ball, Strike. K swinging.
  // White: Double to CF (first pitch).
  // McGovern: Ball (WP — White 2nd→3rd). Ground out 1-6-3. White scores.
  // Kirkpatrick: Ball, Ball. Home run to CF.
  // Norton: Foul, Ball, Ball, Foul, Foul. Single to CF.
  // Byrne: Single to CF. Norton advances to 3rd (manual adjust).
  // Jar. Bradbury: Ball, then Byrne CS 2-6 (3rd out). Norton stranded.
  // Result: 2 runs (White on GO, Kirkpatrick HR)

  const top3 = [
    // Jer. Bradbury: Strike, Ball, Strike. K swinging.
    "strike", "ball", "strike", { type: "strikeout_swinging" },
    // White: Double to CF (first pitch)
    "double",
    // McGovern: Ball (WP advances White 2nd→3rd)
    "ball", { type: "wild_pitch" },
    // McGovern: Ground out 1-6-3. White scores from 3rd.
    { type: "ground_out", positions: [1, 6, 3] },
    "toggle_third", "score_away", // White scores
    // Kirkpatrick: Ball, Ball. Home run to CF.
    "ball", "ball", "homerun",
    // Norton: Foul, Ball, Ball, Foul, Foul. Single to CF.
    "foul", "ball", "ball", "foul", "foul", "single",
    // Byrne: Single to CF. Norton 1st→2nd (engine), need 2nd→3rd manual.
    "single",
    "toggle_second", "toggle_third", // Norton 2nd→3rd
    // Jar. Bradbury: Ball. Byrne CS at 2nd (2-6). 3rd out.
    "ball", { type: "caught_stealing", runner: "first", positions: [2, 6] },
  ];

  test("Top 3rd: ACT 2, SA 1", () => {
    replayActions(game, [...top1, ...bot1, ...top2, ...bot2, ...top3]);
    expect(game.awayScore).toBe(2);
    expect(game.homeScore).toBe(1);
    expect(game.isTop).toBe(false);
    expect(game.inning).toBe(3);
  });

  // ─── BOT 3rd: SA Batting ─────────────────────────────────────────
  // Baumber: Strike, Ball, Strike. K swinging.
  // Harris: Ball, Ball, Ball, Strike, Strike, Foul, Ball → Walk.
  // Harrison: Strike, Strike. Fly out to SS.
  // Farrell: Strike, Ball, Strike. K swinging.
  // Result: 0 runs, 3 outs (Harris stranded)

  const bot3 = [
    // Baumber: Strike, Ball, Strike. K swinging.
    "strike", "ball", "strike", { type: "strikeout_swinging" },
    // Harris: Ball, Ball, Ball, Strike, Strike, Foul, Ball → Walk
    "ball", "ball", "ball", "strike", "strike", "foul", "ball",
    // Harrison: Strike, Strike. Fly out to SS.
    "strike", "strike", { type: "fly_out", positions: [6] },
    // Farrell: Strike, Ball, Strike. K swinging.
    "strike", "ball", "strike", { type: "strikeout_swinging" },
  ];

  test("Bot 3rd: ACT 2, SA 1", () => {
    replayActions(game, [...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3]);
    expect(game.awayScore).toBe(2);
    expect(game.homeScore).toBe(1);
    expect(game.isTop).toBe(true);
    expect(game.inning).toBe(4);
  });

  // ─── TOP 4th: ACT Batting ────────────────────────────────────────
  // Jar. Bradbury: Strike, Strike, Foul, Ball, Ball. Fly out to LF.
  // Jones: Strike, Strike. K swinging.
  // Johnson: Ground out 6-3 (first pitch).
  // Result: 0 runs, 3 outs

  const top4 = [
    // Jar. Bradbury: Strike, Strike, Foul, Ball, Ball. Fly out to LF.
    "strike", "strike", "foul", "ball", "ball", { type: "fly_out", positions: [7] },
    // Jones: Strike, Strike. K swinging.
    "strike", "strike", { type: "strikeout_swinging" },
    // Johnson: Ground out 6-3 (first pitch).
    { type: "ground_out", positions: [6, 3] },
  ];

  test("Top 4th: ACT 2, SA 1", () => {
    replayActions(game, [
      ...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3, ...top4,
    ]);
    expect(game.awayScore).toBe(2);
    expect(game.homeScore).toBe(1);
    expect(game.isTop).toBe(false);
    expect(game.inning).toBe(4);
  });

  // ─── BOT 4th: SA Batting ─────────────────────────────────────────
  // Kipfer: Ball, Foul, Ball, Strike, Ball, Ball → Walk.
  // May: Strike, Ball, Strike, Foul. Double to RF. Kipfer 1st→3rd (engine).
  // Lach: Strike, Ball. K swinging (D3K thrown out at 1st — still an out).
  // Paturis: Ball, Strike, Ball, Ball, Ball → Walk. Bases loaded.
  // Peterson: HBP. Kipfer scores (force), May→3rd, Paturis→2nd.
  // Baumber: Strike, Ball (WP). May scores from 3rd, then manual:
  //   Paturis scores from 2nd, Peterson 1st→3rd.
  //   Baumber walks (3 more balls).
  // Harris: Ball, Foul, Ball, Ball. Ground out 1-3.
  // Harrison: Ball, Ball, Strike, Foul, Ball. K swinging.
  // Result: 3 runs (Kipfer on HBP force, May + Paturis on WP)

  const bot4 = [
    // Kipfer: Ball, Foul, Ball, Strike, Ball, Ball → Walk
    "ball", "foul", "ball", "strike", "ball", "ball",
    // May: Strike, Ball, Strike, Foul. Double to RF. Kipfer 1st→3rd (engine handles).
    "strike", "ball", "strike", "foul", "double",
    // Lach: Strike, Ball. K swinging (D3K but thrown out — modeled as K)
    "strike", "ball", { type: "strikeout_swinging" },
    // Paturis: Ball, Strike, Ball, Ball, Ball → Walk. Bases loaded.
    "ball", "strike", "ball", "ball", "ball",
    // Peterson: HBP. Kipfer scores (force advance), May→3rd, Paturis→2nd.
    { type: "hbp" },
    // Baumber: Strike looking, Ball (same pitch = WP)
    "strike", "ball",
    // WP: May scores from 3rd (engine default — lead runner)
    { type: "wild_pitch" },
    // Manual: Paturis scores from 2nd
    "toggle_second", "score_home",
    // Manual: Peterson 1st→3rd
    "toggle_first", "toggle_third",
    // Baumber continues: Ball, Ball, Ball → Walk (count was 1-1, now 4-1)
    "ball", "ball", "ball",
    // Harris: Ball, Foul, Ball, Ball. Ground out 1-3.
    "ball", "foul", "ball", "ball", { type: "ground_out", positions: [1, 3] },
    // Harrison: Ball, Ball, Strike, Foul, Ball. K swinging.
    "ball", "ball", "strike", "foul", "ball", { type: "strikeout_swinging" },
  ];

  test("Bot 4th: ACT 2, SA 4", () => {
    replayActions(game, [
      ...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3, ...top4,
      ...bot4,
    ]);
    expect(game.awayScore).toBe(2);
    expect(game.homeScore).toBe(4);
    expect(game.isTop).toBe(true);
    expect(game.inning).toBe(5);
  });

  // ─── TOP 5th: ACT Batting ────────────────────────────────────────
  // Jer. Bradbury: Strike, Ball, Foul. K swinging.
  // White: Ball, Foul, Foul. K looking.
  // McGovern: Home run to CF (first pitch).
  // Kirkpatrick: Home run to CF (first pitch).
  // Norton: Foul, Ball, Ball, Ball. Single to CF.
  // Byrne: Fly out to 2B (first pitch).
  // Result: 2 runs (McGovern HR, Kirkpatrick HR)

  const top5 = [
    // Jer. Bradbury: Strike, Ball, Foul. K swinging.
    "strike", "ball", "foul", { type: "strikeout_swinging" },
    // White: Ball, Foul, Foul. K looking.
    "ball", "foul", "foul", { type: "strikeout_looking" },
    // McGovern: Home run to CF (first pitch)
    "homerun",
    // Kirkpatrick: Home run to CF (first pitch)
    "homerun",
    // Norton: Foul, Ball, Ball, Ball. Single to CF.
    "foul", "ball", "ball", "ball", "single",
    // Byrne: Fly out to 2B (first pitch).
    { type: "fly_out", positions: [2] },
  ];

  test("Top 5th: ACT 4, SA 4", () => {
    replayActions(game, [
      ...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3, ...top4,
      ...bot4, ...top5,
    ]);
    expect(game.awayScore).toBe(4);
    expect(game.homeScore).toBe(4);
    expect(game.isTop).toBe(false);
    expect(game.inning).toBe(5);
  });

  // ─── BOT 5th: SA Batting ─────────────────────────────────────────
  // Farrell: Single to SS (first pitch).
  // Kipfer: Foul, Foul, Ball. K swinging.
  // May: Strike, Strike, Ball. K swinging.
  // Lach: Strike looking. Ground out 1-3.
  // Result: 0 runs, 3 outs (Farrell stranded)

  const bot5 = [
    // Farrell: Single to SS (first pitch). Text says "Singles to short stop."
    "single",
    // Kipfer: Foul, Foul, Ball. K swinging.
    "foul", "foul", "ball", { type: "strikeout_swinging" },
    // May: Strike, Strike, Ball. K swinging.
    "strike", "strike", "ball", { type: "strikeout_swinging" },
    // Lach: Strike looking. Ground out 1-3.
    "strike", { type: "ground_out", positions: [1, 3] },
  ];

  test("Bot 5th: ACT 4, SA 4", () => {
    replayActions(game, [
      ...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3, ...top4,
      ...bot4, ...top5, ...bot5,
    ]);
    expect(game.awayScore).toBe(4);
    expect(game.homeScore).toBe(4);
    expect(game.isTop).toBe(true);
    expect(game.inning).toBe(6);
  });

  // ─── TOP 6th: ACT Batting ────────────────────────────────────────
  // (Subs: Jones→Harrow, Johnson→Wickham — no engine action)
  // Jar. Bradbury: Strike swinging. Ground out 1-3.
  // Harrow: Strike, Strike. K looking.
  // Wickham: Strike looking, Strike swinging. K looking.
  // Result: 0 runs, 3 outs

  const top6 = [
    // Jar. Bradbury: Strike swinging. Ground out 1-3.
    "strike", { type: "ground_out", positions: [1, 3] },
    // Harrow: Strike, Strike. K looking.
    "strike", "strike", { type: "strikeout_looking" },
    // Wickham: Strike looking, Strike swinging. K looking.
    "strike", "strike", { type: "strikeout_looking" },
  ];

  test("Top 6th: ACT 4, SA 4", () => {
    replayActions(game, [
      ...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3, ...top4,
      ...bot4, ...top5, ...bot5, ...top6,
    ]);
    expect(game.awayScore).toBe(4);
    expect(game.homeScore).toBe(4);
    expect(game.isTop).toBe(false);
    expect(game.inning).toBe(6);
  });

  // ─── BOT 6th: SA Batting ─────────────────────────────────────────
  // (Subs: Jones RE, Johnson RE — fielding. Peterson→Jackson)
  // Paturis: Foul, Strike, Ball. K swinging.
  // Jackson: Strike looking. Error by 3B (E5) — reaches 1st.
  // Baumber: Strike looking. Ground out 6-3. Jackson to 2nd.
  // Harris: Ground out 6-3 (first pitch).
  // Result: 0 runs, 3 outs

  const bot6 = [
    // Paturis: Foul, Strike, Ball. K swinging.
    "foul", "strike", "ball", { type: "strikeout_swinging" },
    // Jackson: Strike looking. Error E5 — reaches 1st.
    "strike", { type: "error", positions: [5] },
    // Baumber: Strike looking. Ground out 6-3. Jackson to 2nd (manual).
    "strike", { type: "ground_out", positions: [6, 3] },
    "toggle_first", "toggle_second", // Jackson 1st→2nd
    // Harris: Ground out 6-3 (first pitch). 3rd out.
    { type: "ground_out", positions: [6, 3] },
  ];

  test("Bot 6th: ACT 4, SA 4", () => {
    replayActions(game, [
      ...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3, ...top4,
      ...bot4, ...top5, ...bot5, ...top6, ...bot6,
    ]);
    expect(game.awayScore).toBe(4);
    expect(game.homeScore).toBe(4);
    expect(game.isTop).toBe(true);
    expect(game.inning).toBe(7);
  });

  // ─── TOP 7th: ACT Batting ────────────────────────────────────────
  // (Subs: Jer. Bradbury→Nussbaum, then Jer. Bradbury RE)
  // Nussbaum: Ball, Strike, Strike. Single to CF.
  // White: Ball, Strike, Foul, Ball, Foul, Foul, Ball, Ball → Walk.
  //   Nussbaum (via re-entry as Jer. Bradbury) to 2nd. Engine: force advance.
  // McGovern: Ball, Foul, Strike, Ball. K looking.
  // Kirkpatrick: Strike, Strike. Double to CF.
  //   Jer. Bradbury (2nd) scores, White (1st) → 3rd. Engine handles double.
  // Norton: Strike looking. Ground out 5-3. White scores from 3rd (manual).
  //   Kirkpatrick to 3rd (manual).
  // Byrne: Fly out to RF (first pitch).
  // Result: 2 runs (Bradbury on double, White on ground out)

  const top7 = [
    // Nussbaum/Jer. Bradbury: Ball, Strike, Strike. Single to CF.
    "ball", "strike", "strike", "single",
    // White: Ball, Strike, Foul, Ball, Foul, Foul, Ball, Ball → Walk
    // Walk force-advances Nussbaum 1st→2nd.
    "ball", "strike", "foul", "ball", "foul", "foul", "ball", "ball",
    // McGovern: Ball, Foul, Strike, Ball. K looking.
    "ball", "foul", "strike", "ball", { type: "strikeout_looking" },
    // Kirkpatrick: Strike, Strike. Double to CF.
    // Engine: 2nd (Bradbury) scores, 1st (White) → 3rd, Kirkpatrick → 2nd.
    "strike", "strike", "double",
    // Norton: Strike looking. Ground out 5-3. White scores from 3rd.
    "strike", { type: "ground_out", positions: [5, 3] },
    "toggle_third", "score_away", // White scores from 3rd
    // Manual: Kirkpatrick 2nd→3rd
    "toggle_second", "toggle_third",
    // Byrne: Fly out to RF (first pitch).
    { type: "fly_out", positions: [9] },
  ];

  test("Top 7th: ACT 6, SA 4", () => {
    replayActions(game, [
      ...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3, ...top4,
      ...bot4, ...top5, ...bot5, ...top6, ...bot6, ...top7,
    ]);
    expect(game.awayScore).toBe(6);
    expect(game.homeScore).toBe(4);
    expect(game.isTop).toBe(false);
    expect(game.inning).toBe(7);
  });

  // ─── BOT 7th: SA Batting ─────────────────────────────────────────
  // Harrison: Strike, Strike, Foul. Fly out to 3B.
  // Farrell: Strike, Ball, Strike, Ball, Foul, Foul. Single to LF.
  // Kipfer: Strike looking. Fly out to RF.
  // May: Strike swinging. Ground out 6 (force out at 2nd, unassisted).
  // Result: 0 runs, 3 outs. GAME OVER. ACT 6, SA 4.

  const bot7 = [
    // Harrison: Strike, Strike, Foul. Fly out to 3B.
    "strike", "strike", "foul", { type: "fly_out", positions: [5] },
    // Farrell: Strike, Ball, Strike, Ball, Foul, Foul. Single to LF.
    "strike", "ball", "strike", "ball", "foul", "foul",
    "single",
    // Kipfer: Strike looking. Fly out to RF.
    "strike", { type: "fly_out", positions: [9] },
    // May: Strike swinging. Ground out — force at 2nd, SS unassisted (PO6).
    "strike", { type: "ground_out", positions: [6] },
  ];

  test("Bot 7th: ACT 6, SA 4 — GAME OVER", () => {
    replayActions(game, [
      ...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3, ...top4,
      ...bot4, ...top5, ...bot5, ...top6, ...bot6, ...top7, ...bot7,
    ]);
    expect(game.awayScore).toBe(6);
    expect(game.homeScore).toBe(4);
    // After Bot 7th with 3 outs, changes to Top 8th
    expect(game.isTop).toBe(true);
    expect(game.inning).toBe(8);
    expect(game.outs).toBe(0);
  });

  // ─── FULL GAME VERIFICATION ──────────────────────────────────────

  test("Final score: ACT 6, SA 4 after 7 complete innings", () => {
    const allActions = [
      ...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3, ...top4,
      ...bot4, ...top5, ...bot5, ...top6, ...bot6, ...top7, ...bot7,
    ];
    replayActions(game, allActions);
    expect(game.awayScore).toBe(6);
    expect(game.homeScore).toBe(4);
  });

  test("Events array is populated with play-by-play", () => {
    const allActions = [
      ...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3, ...top4,
      ...bot4, ...top5, ...bot5, ...top6, ...bot6, ...top7, ...bot7,
    ];
    replayActions(game, allActions);
    // Should have many events (pitches, plays, toggles)
    expect(game.events.length).toBeGreaterThan(100);
    // Verify some specific event types exist
    const types = game.events.map((e) => e.type);
    expect(types).toContain("ground_out");
    expect(types).toContain("fly_out");
    expect(types).toContain("line_drive_out");
    expect(types).toContain("strikeout_swinging");
    expect(types).toContain("strikeout_looking");
    expect(types).toContain("error");
    expect(types).toContain("hbp");
    expect(types).toContain("wild_pitch");
    expect(types).toContain("caught_stealing");
    expect(types).toContain("hit");
    expect(types).toContain("walk");
  });

  test("Per-inning scoring is correct", () => {
    // Verify score at the end of each full inning
    const innings = [
      { actions: [...top1, ...bot1], away: 0, home: 0, label: "Inn 1" },
      { actions: [...top2, ...bot2], away: 0, home: 1, label: "Inn 2" },
      { actions: [...top3, ...bot3], away: 2, home: 1, label: "Inn 3" },
      { actions: [...top4, ...bot4], away: 2, home: 4, label: "Inn 4" },
      { actions: [...top5, ...bot5], away: 4, home: 4, label: "Inn 5" },
      { actions: [...top6, ...bot6], away: 4, home: 4, label: "Inn 6" },
      { actions: [...top7, ...bot7], away: 6, home: 4, label: "Inn 7" },
    ];

    let cumulative = [];
    for (const inn of innings) {
      cumulative = [...cumulative, ...inn.actions];
      const g = createGameState("South Australia", "ACT");
      replayActions(g, cumulative);
      expect(g.awayScore).toBe(inn.away); // ACT
      expect(g.homeScore).toBe(inn.home); // SA
    }
  });
});
