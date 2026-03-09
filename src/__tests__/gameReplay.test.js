/**
 * Full game replay test: Geelong Northern vs Sunshine Knox
 * Date: Feb 22, 2026 — GameChanger scoresheet
 * Final: Geelong Northern (Away) 2 - Sunshine Knox (Home) 3
 * Line: GLNG 0 0 0 0 2 = 2 | SNSH 3 0 0 0 X = 3
 *
 * This test replays every pitch and play through our scoring engine
 * and verifies the game state at the end of each half-inning.
 *
 * Known limitations:
 * - Stolen bases modeled as manual runner toggles between pitches
 * - Wild pitch advances modeled as manual runner toggles
 * - Sacrifice bunts modeled as Out + runner toggle
 * - Courtesy runners are invisible to the engine (just a runner on base)
 */

import { createGameState, applyAction, replayActions } from "../utils/scoringEngine";

describe("Game Replay: Geelong Northern vs Sunshine Knox (Feb 22 2026)", () => {
  let game;

  beforeEach(() => {
    game = createGameState("Sunshine Knox", "Geelong Northern");
  });

  // ─── TOP 1st: Geelong Northern batting ───────────────────────────
  // Psimaris: Walk (S, B, B, B, S, Foul, B)
  // Macaulay: Ground out 1-3 (S, in play) — Psimaris advances to 2nd
  // Weldon: Strikeout swinging (S, S, S)
  // Hughes: Ground out 1-3 (S, in play)
  // Result: 0 runs

  const top1 = [
    // Psimaris: Walk — S1 looking, B1, B2, B3, S2 looking, Foul, B4
    "strike", "ball", "ball", "ball", "strike", "foul", "ball",
    // Macaulay: Ground out 1-3 — S1 swinging, in play (out)
    "strike", "out",
    // Runner adjust: Psimaris 1st→2nd on ground out
    "toggle_first", "toggle_second",
    // Weldon: Strikeout — S1, S2, S3
    "strike", "strike", "strike",
    // Hughes: Ground out 1-3 — S1 swinging, in play (out)
    "strike", "out",
  ];

  test("Top 1st: Geelong 0, Sunshine 0", () => {
    replayActions(game, top1);
    expect(game.awayScore).toBe(0);  // Geelong (away)
    expect(game.homeScore).toBe(0);  // Sunshine (home)
    expect(game.isTop).toBe(false);  // Now bottom of 1st
    expect(game.inning).toBe(1);
    expect(game.outs).toBe(0);       // Reset after side change
  });

  // ─── BOTTOM 1st: Sunshine Knox batting ───────────────────────────
  // Hotere-Moana: Ground out 5-3 (S, B, Foul, in play)
  // McMahon: Single bunt (S, in play)
  // Byrne: Walk (B, Foul, Foul, B, B, B) — McMahon to 2nd
  // Stewart: Home Run (B, in play) — McMahon scores, Byrne scores = 3 runs
  // Dennis: Strikeout (S, Foul, S swinging)
  // Ainslie: Strikeout looking (B, B, Foul, Foul, S looking)
  // Result: 3 runs

  const bot1 = [
    // Hotere-Moana: Ground out 5-3 — S1 looking, B1, Foul, in play
    "strike", "ball", "foul", "out",
    // McMahon: Single bunt — S1 swinging, in play (single)
    "strike", "single",
    // Byrne: Walk — B1, Foul, Foul, B2, B3, B4
    // Walk auto-advances: McMahon 1st→2nd, Byrne on 1st
    "ball", "foul", "foul", "ball", "ball", "ball",
    // Stewart: Home Run — B1, in play (HR)
    // McMahon (2nd) scores, Byrne (1st) scores, Stewart scores = 3 runs
    "ball", "homerun",
    // Dennis: Strikeout — S1 looking, Foul(S2), S3 swinging
    "strike", "foul", "strike",
    // Ainslie: Strikeout looking — B1, B2, Foul(S1), Foul(S2), S3 looking
    "ball", "ball", "foul", "foul", "strike",
  ];

  test("Bot 1st: Geelong 0, Sunshine 3", () => {
    replayActions(game, [...top1, ...bot1]);
    expect(game.awayScore).toBe(0);  // Geelong
    expect(game.homeScore).toBe(3);  // Sunshine
    expect(game.isTop).toBe(true);   // Now top of 2nd
    expect(game.inning).toBe(2);
    expect(game.outs).toBe(0);
  });

  // ─── TOP 2nd: Geelong Northern batting ───────────────────────────
  // Blackley: Ground out 6-3 (in play — 1 pitch)
  // Ferraro: Walk (B, B, B, B)
  // Scott: Strikeout (B, S, Foul, S swinging)
  // Baker: Strikeout (S, S, Foul, Foul, S)
  // Result: 0 runs

  const top2 = [
    // Blackley: Ground out 6-3 — in play
    "out",
    // Ferraro: Walk — B1, B2, B3, B4
    "ball", "ball", "ball", "ball",
    // Scott: Strikeout — B1, S1, Foul(S2), S3
    "ball", "strike", "foul", "strike",
    // Baker: Strikeout — S1, S2, Foul, Foul, S3
    "strike", "strike", "foul", "foul", "strike",
  ];

  test("Top 2nd: Geelong 0, Sunshine 3", () => {
    replayActions(game, [...top1, ...bot1, ...top2]);
    expect(game.awayScore).toBe(0);
    expect(game.homeScore).toBe(3);
    expect(game.isTop).toBe(false);  // Now bottom of 2nd
    expect(game.inning).toBe(2);
  });

  // ─── BOTTOM 2nd: Sunshine Knox batting ───────────────────────────
  // Kronk: Ground out 3U (B, S, B, B, Foul, in play)
  // M Hughes: Line out 8 (S, Foul, in play)
  // L Hughes: Fly out 4 (Foul, in play)
  // Result: 0 runs

  const bot2 = [
    // Kronk: Ground out — B1, S1, B2, B3, Foul(S2), in play
    "ball", "strike", "ball", "ball", "foul", "out",
    // M Hughes: Line out 8 — S1, Foul(S2), in play
    "strike", "foul", "out",
    // L Hughes: Fly out 4 — Foul(S1), in play
    "foul", "out",
  ];

  test("Bot 2nd: Geelong 0, Sunshine 3", () => {
    replayActions(game, [...top1, ...bot1, ...top2, ...bot2]);
    expect(game.awayScore).toBe(0);
    expect(game.homeScore).toBe(3);
    expect(game.isTop).toBe(true);   // Now top of 3rd
    expect(game.inning).toBe(3);
  });

  // ─── TOP 3rd: Geelong Northern batting ───────────────────────────
  // Bedwell: Strikeout (S, B, S, S)
  // Psimaris: Strikeout looking (Foul, S, B, Foul, B, S)
  // Macaulay: Walk (Foul, S, Foul, Foul, B, Foul, B, Foul, Foul, B, B) — 11 pitches!
  // Weldon: Strikeout (S, Foul, B, S)
  // Result: 0 runs

  const top3 = [
    // Bedwell: Strikeout — S1 looking, B1, S2 swinging, S3 swinging
    "strike", "ball", "strike", "strike",
    // Psimaris: Strikeout looking — Foul(S1), S2 looking, B1, Foul, B2, S3 looking
    "foul", "strike", "ball", "foul", "ball", "strike",
    // Macaulay: Walk — Foul(S1), S2 looking, Foul, Foul, B1, Foul, B2, Foul, Foul, B3, B4
    "foul", "strike", "foul", "foul", "ball", "foul", "ball", "foul", "foul", "ball", "ball",
    // Weldon: Strikeout — S1, Foul(S2), B1, S3
    "strike", "foul", "ball", "strike",
  ];

  test("Top 3rd: Geelong 0, Sunshine 3", () => {
    replayActions(game, [...top1, ...bot1, ...top2, ...bot2, ...top3]);
    expect(game.awayScore).toBe(0);
    expect(game.homeScore).toBe(3);
    expect(game.isTop).toBe(false);  // Now bottom of 3rd
    expect(game.inning).toBe(3);
  });

  // ─── BOTTOM 3rd: Sunshine Knox batting ───────────────────────────
  // Hotere-Moana: Single (B, in play)
  // McMahon: Strikeout (S, B, S, [SB: runner 1st→2nd], S)
  // Byrne: Ground out 3U (S, Foul, in play) — Hotere-Moana advances to 3rd
  // Stewart: Fly out foul territory (S, B, in play)
  // Result: 0 runs

  const bot3 = [
    // Hotere-Moana: Single — B1, in play
    "ball", "single",
    // McMahon: Strikeout — S1, B1, S2, [stolen base], S3
    "strike", "ball", "strike",
    // Stolen base: Hotere-Moana steals 2nd during at-bat
    "toggle_first", "toggle_second",
    "strike",
    // Byrne: Ground out — S1, Foul(S2), in play
    "strike", "foul", "out",
    // Runner adjust: Hotere-Moana advances from 2nd to 3rd on ground out
    "toggle_second", "toggle_third",
    // Stewart: Fly out foul territory — S1, B1, in play
    "strike", "ball", "out",
  ];

  test("Bot 3rd: Geelong 0, Sunshine 3", () => {
    replayActions(game, [...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3]);
    expect(game.awayScore).toBe(0);
    expect(game.homeScore).toBe(3);
    expect(game.isTop).toBe(true);   // Now top of 4th
    expect(game.inning).toBe(4);
  });

  // ─── TOP 4th: Geelong Northern batting ───────────────────────────
  // Hughes: Walk (Foul, B, S, Foul, B, Foul, B, B) — 8 pitches
  // Blackley: Strikeout looking (B, B, S, S, S)
  // Ferraro: Sac bunt 1-3 (S, B, out) — D'Auria(runner) advances to 2nd
  // Scott: Ground out 5-3 (S, B, [WP: runner 2nd→3rd], Foul, out)
  // Result: 0 runs

  const top4 = [
    // Hughes: Walk — Foul(S1), B1, S2 swinging, Foul, B2, Foul, B3, B4
    "foul", "ball", "strike", "foul", "ball", "foul", "ball", "ball",
    // Blackley: Strikeout looking — B1, B2, S1, S2, S3
    "ball", "ball", "strike", "strike", "strike",
    // Ferraro: Sac bunt — S1, B1, out (sacrifice)
    "strike", "ball", "out",
    // Runner adjust: D'Auria (courtesy runner for Hughes) advances 1st→2nd
    "toggle_first", "toggle_second",
    // Scott: Ground out — S1, B1, [WP advances runner 2nd→3rd], Foul, out
    "strike", "ball",
    // Wild pitch: runner advances from 2nd to 3rd
    "toggle_second", "toggle_third",
    "foul", "out",
  ];

  test("Top 4th: Geelong 0, Sunshine 3", () => {
    replayActions(game, [...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3, ...top4]);
    expect(game.awayScore).toBe(0);
    expect(game.homeScore).toBe(3);
    expect(game.isTop).toBe(false);  // Now bottom of 4th
    expect(game.inning).toBe(4);
  });

  // ─── BOTTOM 4th: Sunshine Knox batting ───────────────────────────
  // Dennis: Fly out SS (in play — 1 pitch)
  // Ainslie: Dropped 3rd strike (B, Foul, B, S, S) — out at first
  // Evans: Ground out 6-3 (in play — 1 pitch)
  // Result: 0 runs

  const bot4 = [
    // Dennis: Fly out — in play
    "out",
    // Ainslie: Dropped 3rd strike — B1, Foul(S1), B2, S2 swinging, S3 swinging (still out)
    "ball", "foul", "ball", "strike", "strike",
    // Evans: Ground out 6-3 — in play
    "out",
  ];

  test("Bot 4th: Geelong 0, Sunshine 3", () => {
    replayActions(game, [
      ...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3, ...top4, ...bot4,
    ]);
    expect(game.awayScore).toBe(0);
    expect(game.homeScore).toBe(3);
    expect(game.isTop).toBe(true);   // Now top of 5th
    expect(game.inning).toBe(5);
  });

  // ─── TOP 5th: Geelong Northern batting ───────────────────────────
  // Baker: Strikeout looking (Foul, B, B, S, Foul, S)
  // Addlem: Reaches on error (B, S, B, Foul, single*) *modeled as single
  // Psimaris: Home Run (in play) — D'Auria scores, Psimaris scores = 2 runs
  // Macaulay: Out on foul tip (Foul, B, S, strike) — foul tip = K
  // Weldon: Strikeout (B, S, B, Foul, S)
  // Result: 2 runs → Geelong 2, Sunshine 3

  const top5 = [
    // Baker: Strikeout looking — Foul(S1), B1, B2, S2 swinging, Foul, S3 looking
    "foul", "ball", "ball", "strike", "foul", "strike",
    // Addlem: Reached on error — B1, S1, B2, Foul(S2), in play (error)
    "ball", "strike", "ball", "foul", "error",
    // Psimaris: Home Run — in play
    // D'Auria (courtesy runner on 1st) scores + Psimaris = 2 runs
    "homerun",
    // Macaulay: Foul tip out — Foul(S1), B1, S2 looking, Foul tip(S3/K)
    "foul", "ball", "strike", "strike",
    // Weldon: Strikeout — B1, S1 looking, B2, Foul(S2), S3 swinging
    "ball", "strike", "ball", "foul", "strike",
  ];

  test("Top 5th: Geelong 2, Sunshine 3 — FINAL", () => {
    replayActions(game, [
      ...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3,
      ...top4, ...bot4, ...top5,
    ]);
    // Game ends: home team leading, bottom 5th not played
    expect(game.awayScore).toBe(2);  // Geelong Northern
    expect(game.homeScore).toBe(3);  // Sunshine Knox
    expect(game.isTop).toBe(false);  // Side changed after top 5
    expect(game.inning).toBe(5);
  });

  // ─── Full game aggregate checks ─────────────────────────────────

  test("Full game: correct total events recorded", () => {
    replayActions(game, [
      ...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3,
      ...top4, ...bot4, ...top5,
    ]);
    const events = game.events;

    // Count event types
    const walks = events.filter((e) => e.type === "walk").length;
    const strikeouts = events.filter((e) => e.type === "strikeout").length;
    const outs = events.filter((e) => e.type === "out").length;
    const hits = events.filter((e) => e.type === "hit").length;
    const errors = events.filter((e) => e.type === "error").length;

    // Walks: Psimaris(T1), Ferraro(T2), Macaulay(T3), Byrne(B1), Hughes(T4) = 5
    expect(walks).toBe(5);

    // Strikeouts: Weldon(T1), Baker(T2), Scott(T2), Bedwell(T3),
    //   Psimaris(T3), Weldon(T3), McMahon(B3), Blackley(T4),
    //   Ainslie(B4), Baker(T5), Macaulay(T5), Weldon(T5),
    //   Dennis(B1), Ainslie(B1) = 14
    expect(strikeouts).toBe(14);

    // Fielded outs: Macaulay(T1), Hughes(T1), Blackley(T2),
    //   Hotere-Moana(B1), Kronk(B2), M.Hughes(B2), L.Hughes(B2),
    //   Byrne(B3), Stewart(B3), Ferraro(T4), Scott(T4),
    //   Dennis(B4), Evans(B4) = 13
    expect(outs).toBe(13);

    // Hits: McMahon single(B1), Stewart HR(B1), Hotere-Moana single(B3),
    //   Psimaris HR(T5) = 4
    expect(hits).toBe(4);

    // Errors: Addlem reached on error(T5) = 1
    expect(errors).toBe(1);
  });

  test("Full game: runs scored per inning match line score", () => {
    // We can verify by checking score at each inning boundary
    const allActions = [
      ...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3,
      ...top4, ...bot4, ...top5,
    ];

    const checkpoints = [
      // After top1: still inning 1 bottom
      { actions: top1, away: 0, home: 0, label: "after Top 1" },
      { actions: [...top1, ...bot1], away: 0, home: 3, label: "after Bot 1" },
      { actions: [...top1, ...bot1, ...top2], away: 0, home: 3, label: "after Top 2" },
      { actions: [...top1, ...bot1, ...top2, ...bot2], away: 0, home: 3, label: "after Bot 2" },
      { actions: [...top1, ...bot1, ...top2, ...bot2, ...top3], away: 0, home: 3, label: "after Top 3" },
      { actions: [...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3], away: 0, home: 3, label: "after Bot 3" },
      { actions: [...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3, ...top4], away: 0, home: 3, label: "after Top 4" },
      { actions: [...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3, ...top4, ...bot4], away: 0, home: 3, label: "after Bot 4" },
      { actions: allActions, away: 2, home: 3, label: "after Top 5 (FINAL)" },
    ];

    for (const cp of checkpoints) {
      const g = createGameState("Sunshine Knox", "Geelong Northern");
      replayActions(g, cp.actions);
      expect(g.awayScore).toBe(cp.away);
      expect(g.homeScore).toBe(cp.home);
    }
  });
});
