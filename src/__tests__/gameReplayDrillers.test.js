/**
 * Full game replay: NorthEast Drillers 18O vs HILL UNITED CHIEFS
 * GameChanger scoresheet — 7 innings
 * Final: Drillers (Away) 5 - Chiefs (Home) 6 (walkoff)
 * Line: NRTH 0 0 0 0 0 3 2 = 5 | HLLN 3 1 1 0 0 0 1 = 6
 *
 * Features exercised: HBP, Sac Fly, Fielder's Choice, Double Plays,
 * stolen bases, pickoffs, extra runner advancement (score_home/score_away)
 *
 * Known limitations:
 * - DPs modeled as 2x "out" (overcounts pitches by 1 per DP)
 * - Stolen bases / wild pitches modeled as manual runner toggles
 * - Extra runner advancement (scoring from 2nd on single, etc.) modeled
 *   as toggles + score_home/score_away
 * - FC without out (Bot 3, A PEKER) modeled as pitch sequence + toggles
 * - Pickoff modeled as "out" (overcounts 1 pitch)
 */

import { createGameState, replayActions } from "../utils/scoringEngine";

describe("Game Replay: NE Drillers vs Hill United Chiefs", () => {
  let game;

  beforeEach(() => {
    game = createGameState("Hill United Chiefs", "NE Drillers");
  });

  // ─── TOP 1: NE Drillers (Away) ─────────────────────────────────
  // Migliavacca: Ground out 1B (S, B, B, out)
  // Shaw: Strikeout looking (S, B, S, S)
  // Enoka: Fly out RF (S, B, B, B, S, out)
  const top1 = [
    "strike", "ball", "ball", "out",
    "strike", "ball", "strike", "strike",
    "strike", "ball", "ball", "ball", "strike", "out",
  ];

  test("Top 1: NRTH 0, HLLN 0", () => {
    replayActions(game, top1);
    expect(game.awayScore).toBe(0);
    expect(game.homeScore).toBe(0);
    expect(game.isTop).toBe(false);
    expect(game.inning).toBe(1);
  });

  // ─── BOT 1: Hill United Chiefs (Home) ──────────────────────────
  // Boland: Double (S, B, S, double)
  // B Ezekiel: 2-run HR (B, B, HR) — Boland scores
  // N Shailes: Fly out CF (B, out)
  // B Motroni: Fly out CF (S, out)
  // Q Bruce: Solo HR (B, B, HR)
  // T Gonzalez: Ground out SS-1B (Foul, B, B, S, B, out)
  const bot1 = [
    "strike", "ball", "strike", "double",
    "ball", "ball", "homerun",
    "ball", "out",
    "strike", "out",
    "ball", "ball", "homerun",
    "foul", "ball", "ball", "strike", "ball", "out",
  ];

  test("Bot 1: NRTH 0, HLLN 3", () => {
    replayActions(game, [...top1, ...bot1]);
    expect(game.awayScore).toBe(0);
    expect(game.homeScore).toBe(3);
    expect(game.isTop).toBe(true);
    expect(game.inning).toBe(2);
  });

  // ─── TOP 2: NE Drillers (Away) ─────────────────────────────────
  // Makea: Walk (B, B, Foul, Foul, B, B)
  // Kronk: Fly out RF (S, out)
  // Schiller: Single LF (Foul, single) — Makea to 2nd
  // Zara: DP SS-2B-1B (out, out) — Schiller out at 2nd
  const top2 = [
    "ball", "ball", "foul", "foul", "ball", "ball",
    "strike", "out",
    "foul", "single",
    "out", "out",
  ];

  test("Top 2: NRTH 0, HLLN 3", () => {
    replayActions(game, [...top1, ...bot1, ...top2]);
    expect(game.awayScore).toBe(0);
    expect(game.homeScore).toBe(3);
    expect(game.isTop).toBe(false);
    expect(game.inning).toBe(2);
  });

  // ─── BOT 2: Hill United Chiefs (Home) ──────────────────────────
  // Lopez: Double (S, double)
  // A Peker: Ground out 1B (B, S, B, out) — Lopez to 3rd (toggle)
  // N White: Single RF (B, B, S, single) — Lopez scores from 3rd (auto)
  // Boland: Fly out RF (out)
  // B Ezekiel: Ground out 3B-1B (B, SB:toggle, S, B, B, out)
  const bot2 = [
    "strike", "double",
    "ball", "strike", "ball", "out", "toggle_second", "toggle_third",
    "ball", "ball", "strike", "single",
    "out",
    "ball", "toggle_first", "toggle_second", "strike", "ball", "ball", "out",
  ];

  test("Bot 2: NRTH 0, HLLN 4", () => {
    replayActions(game, [...top1, ...bot1, ...top2, ...bot2]);
    expect(game.awayScore).toBe(0);
    expect(game.homeScore).toBe(4);
    expect(game.isTop).toBe(true);
    expect(game.inning).toBe(3);
  });

  // ─── TOP 3: NE Drillers (Away) ─────────────────────────────────
  // Solorio: Ground out 1B (B, out)
  // Masmu: HBP (B, hbp)
  // Migliavacca: Fly out LF (S, B, B, Foul, out) — Masmu stays 1st
  // Shaw: Ground out 3B-1B (S, S, out)
  const top3 = [
    "ball", "out",
    "ball", "hbp",
    "strike", "ball", "ball", "foul", "out",
    "strike", "strike", "out",
  ];

  test("Top 3: NRTH 0, HLLN 4", () => {
    replayActions(game, [...top1, ...bot1, ...top2, ...bot2, ...top3]);
    expect(game.awayScore).toBe(0);
    expect(game.homeScore).toBe(4);
    expect(game.isTop).toBe(false);
    expect(game.inning).toBe(3);
  });

  // ─── BOT 3: Hill United Chiefs (Home) ──────────────────────────
  // Shailes: Strikeout (S, S, S)
  // Motroni: Pop out 2B (out)
  // Q Bruce: Single RF (Foul, B, B, Foul, single)
  // Gonzalez: Single SS (B, S, single) — Bruce to 2nd
  // Lopez: Single RF (Foul, single) — Bruce scores (extra adv: toggle+score_home),
  //   Gonzalez to 3rd (toggle)
  // A Peker: FC no-out (B, B, S, S, Foul, toggles for result)
  // Lopez: Picked off at 2nd (out) — 3rd out
  const bot3 = [
    "strike", "strike", "strike",
    "out",
    "foul", "ball", "ball", "foul", "single",
    "ball", "strike", "single",
    // Lopez single: auto puts Bruce 2nd→3rd, Gonzalez 1st→2nd, Lopez 1st
    // Reality: Bruce scores, Gonzalez to 3rd
    "foul", "single",
    "toggle_third", "toggle_second", "toggle_third", "score_home",
    // Peker FC (no out recorded) — pitches then manual toggles
    // Lopez 1st→2nd, Peker on 1st, Gonzalez stays 3rd
    "ball", "ball", "strike", "strike", "foul",
    "toggle_first", "toggle_second", "toggle_first",
    // Lopez picked off at 2nd — 3rd out
    "out",
  ];

  test("Bot 3: NRTH 0, HLLN 5", () => {
    replayActions(game, [
      ...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3,
    ]);
    expect(game.awayScore).toBe(0);
    expect(game.homeScore).toBe(5);
    expect(game.isTop).toBe(true);
    expect(game.inning).toBe(4);
  });

  // ─── TOP 4: NE Drillers (Away) ─────────────────────────────────
  // Enoka: Ground out 2B-1B (out)
  // Makea: Strikeout (S, S, B, Foul, S)
  // Kronk: Single LF (B, single)
  // Schiller: Single LF (S, Foul, single) — Kronk to 2nd
  // Zara: Ground out 1B (S, Foul, out)
  const top4 = [
    "out",
    "strike", "strike", "ball", "foul", "strike",
    "ball", "single",
    "strike", "foul", "single",
    "strike", "foul", "out",
  ];

  test("Top 4: NRTH 0, HLLN 5", () => {
    replayActions(game, [
      ...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3, ...top4,
    ]);
    expect(game.awayScore).toBe(0);
    expect(game.homeScore).toBe(5);
    expect(game.isTop).toBe(false);
    expect(game.inning).toBe(4);
  });

  // ─── BOT 4: Hill United Chiefs (Home) ──────────────────────────
  // White: Single LF (S, single)
  // Boland: Ground out P-1B (B, SB:toggle, S, Foul, B, out, toggle to 3rd)
  // B Ezekiel: Line drive DP to 3B (B, B, out, out) — White doubled off
  const bot4 = [
    "strike", "single",
    "ball", "toggle_first", "toggle_second", "strike", "foul", "ball", "out",
    "toggle_second", "toggle_third",
    "ball", "ball", "out", "out",
  ];

  test("Bot 4: NRTH 0, HLLN 5", () => {
    replayActions(game, [
      ...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3,
      ...top4, ...bot4,
    ]);
    expect(game.awayScore).toBe(0);
    expect(game.homeScore).toBe(5);
    expect(game.isTop).toBe(true);
    expect(game.inning).toBe(5);
  });

  // ─── TOP 5: NE Drillers (Away) ─────────────────────────────────
  // Solorio: Ground out SS-1B (Foul, S, B, B, Foul, out)
  // Masmu: Ground out 3B-1B (out)
  // Migliavacca: Ground out SS-1B (Foul, S, B, B, Foul, out)
  const top5 = [
    "foul", "strike", "ball", "ball", "foul", "out",
    "out",
    "foul", "strike", "ball", "ball", "foul", "out",
  ];

  test("Top 5: NRTH 0, HLLN 5", () => {
    replayActions(game, [
      ...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3,
      ...top4, ...bot4, ...top5,
    ]);
    expect(game.awayScore).toBe(0);
    expect(game.homeScore).toBe(5);
    expect(game.isTop).toBe(false);
    expect(game.inning).toBe(5);
  });

  // ─── BOT 5: Hill United Chiefs (Home) ──────────────────────────
  // Shailes: Single SS (B, S, B, single)
  // Motroni: Single LF (B, Foul, single) — Shailes/Biondi to 2nd
  // Q Bruce: Strikeout (S, B, S, Foul, Foul, S)
  // Gonzalez: DP 2B-SS-1B (S, out, out) — Ezekiel out at 2nd
  const bot5 = [
    "ball", "strike", "ball", "single",
    "ball", "foul", "single",
    "strike", "ball", "strike", "foul", "foul", "strike",
    "strike", "out", "out",
  ];

  test("Bot 5: NRTH 0, HLLN 5", () => {
    replayActions(game, [
      ...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3,
      ...top4, ...bot4, ...top5, ...bot5,
    ]);
    expect(game.awayScore).toBe(0);
    expect(game.homeScore).toBe(5);
    expect(game.isTop).toBe(true);
    expect(game.inning).toBe(6);
  });

  // ─── TOP 6: NE Drillers (Away) — THE COMEBACK ─────────────────
  // Shaw: Single CF (S, single)
  // Enoka: Single bunt (single) — Shaw to 2nd
  // Makea: Strikeout (S, Foul, B, S)
  // Kronk: Single LF (S, S, Foul, B, single) — Shaw scores (extra adv),
  //   Enoka to 3rd, Kronk to 2nd (toggles + score_away)
  // Schiller: Single CF (B, single) — Enoka scores from 3rd (auto), Kronk to 3rd
  // Zara: Single SS (B, single) — Kronk scores from 3rd (auto), Schiller to 2nd
  // Solorio: Strikeout looking (B, S, B, S, S)
  // Masmu: Ground out SS-1B (B, out)
  const top6 = [
    "strike", "single",
    "single",
    "strike", "foul", "ball", "strike",
    // Kronk single: auto puts Shaw 2nd→3rd, Enoka 1st→2nd, Kronk 1st
    // Reality: Shaw scores from 2nd, Enoka to 3rd, Kronk to 2nd
    "strike", "strike", "foul", "ball", "single",
    "toggle_third", "toggle_second", "toggle_third",
    "toggle_first", "toggle_second", "score_away",
    // Schiller single: Enoka 3rd scores (auto), Kronk 2nd→3rd, Schiller 1st
    "ball", "single",
    // Zara single: Kronk 3rd scores (auto), Schiller 1st→2nd, Zara 1st
    "ball", "single",
    // Solorio K, Masmu ground out
    "ball", "strike", "ball", "strike", "strike",
    "ball", "out",
  ];

  test("Top 6: NRTH 3, HLLN 5", () => {
    replayActions(game, [
      ...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3,
      ...top4, ...bot4, ...top5, ...bot5, ...top6,
    ]);
    expect(game.awayScore).toBe(3);
    expect(game.homeScore).toBe(5);
    expect(game.isTop).toBe(false);
    expect(game.inning).toBe(6);
  });

  // ─── BOT 6: Hill United Chiefs (Home) ──────────────────────────
  // Lopez: Ground out 2B-1B (S, Foul, B, out)
  // A Peker: Ground out 2B-1B (out)
  // N White: Strikeout (S, S, Foul, B, Foul, Foul, B, S)
  const bot6 = [
    "strike", "foul", "ball", "out",
    "out",
    "strike", "strike", "foul", "ball", "foul", "foul", "ball", "strike",
  ];

  test("Bot 6: NRTH 3, HLLN 5", () => {
    replayActions(game, [
      ...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3,
      ...top4, ...bot4, ...top5, ...bot5, ...top6, ...bot6,
    ]);
    expect(game.awayScore).toBe(3);
    expect(game.homeScore).toBe(5);
    expect(game.isTop).toBe(true);
    expect(game.inning).toBe(7);
  });

  // ─── TOP 7: NE Drillers (Away) — THE RALLY ────────────────────
  // Migliavacca: Walk (S, B, S, Foul, B, B, Foul, B)
  // Shaw: Single CF (B, single, toggle to advance Migliavacca to 3rd)
  // Enoka: Sac Fly CF (sac_fly) — Migliavacca scores
  // Makea: Single RF (single, toggle Shaw to 3rd)
  // Kronk: Sac Fly RF (B, B, Foul, sac_fly) — Shaw scores
  // Schiller: FC 2B (B, B, S, B, fc) — Makea out at 2nd, 3rd out
  const top7 = [
    "strike", "ball", "strike", "foul", "ball", "ball", "foul", "ball",
    // Shaw single: auto puts Migliavacca 1st→2nd. Needs 3rd.
    "ball", "single", "toggle_second", "toggle_third",
    // Enoka sac fly: Migliavacca scores from 3rd, out recorded
    "sac_fly",
    // Makea single: auto puts Shaw 1st→2nd. Needs 3rd.
    "single", "toggle_second", "toggle_third",
    // Kronk sac fly: Shaw scores from 3rd, out recorded
    "ball", "ball", "foul", "sac_fly",
    // Schiller FC: Makea out at 2nd, 3rd out, side retired
    "ball", "ball", "strike", "ball", "fc",
  ];

  test("Top 7: NRTH 5, HLLN 5", () => {
    replayActions(game, [
      ...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3,
      ...top4, ...bot4, ...top5, ...bot5, ...top6, ...bot6, ...top7,
    ]);
    expect(game.awayScore).toBe(5);
    expect(game.homeScore).toBe(5);
    expect(game.isTop).toBe(false);
    expect(game.inning).toBe(7);
  });

  // ─── BOT 7: Hill United Chiefs (Home) — WALKOFF ────────────────
  // Boland: Ground out SS-1B (out)
  // B Ezekiel: Single RF (single)
  // N Shailes: Single RF (S, Foul, Foul, single) — Ezekiel scores (extra adv)
  const bot7 = [
    "out",
    "single",
    // Shailes single: auto puts Ezekiel 1st→2nd. Reality: Ezekiel scores.
    "strike", "foul", "foul", "single",
    "toggle_second", "score_home",
  ];

  test("Bot 7: NRTH 5, HLLN 6 — WALKOFF FINAL", () => {
    replayActions(game, [
      ...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3,
      ...top4, ...bot4, ...top5, ...bot5, ...top6, ...bot6,
      ...top7, ...bot7,
    ]);
    expect(game.awayScore).toBe(5);
    expect(game.homeScore).toBe(6);
  });

  // ─── Aggregate checks ─────────────────────────────────────────

  test("Full game: correct event types", () => {
    replayActions(game, [
      ...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3,
      ...top4, ...bot4, ...top5, ...bot5, ...top6, ...bot6,
      ...top7, ...bot7,
    ]);
    const events = game.events;

    const walks = events.filter((e) => e.type === "walk").length;
    const strikeouts = events.filter((e) => e.type === "strikeout").length;
    const outs = events.filter((e) => e.type === "out").length;
    const hits = events.filter((e) => e.type === "hit").length;
    const hbps = events.filter((e) => e.type === "hbp").length;
    const sacFlies = events.filter((e) => e.type === "sac_fly").length;
    const fcs = events.filter((e) => e.type === "fc").length;

    // Walks: Makea(T2), Migliavacca(T7) = 2
    expect(walks).toBe(2);

    // Strikeouts: Shaw(T1), Shailes(B3), Makea(T4), Bruce(B5),
    //   Makea(T6), Solorio(T6), White(B6) = 7
    expect(strikeouts).toBe(7);

    // HBPs: Masmu(T3) = 1
    expect(hbps).toBe(1);

    // Sac Flies: Enoka(T7), Kronk(T7) = 2
    expect(sacFlies).toBe(2);

    // FCs: Schiller(T7) = 1 (Peker FC in B3 modeled as toggles, no FC action)
    expect(fcs).toBe(1);

    // Hits: Boland dbl(B1), Ezekiel HR(B1), Bruce HR(B1), Schiller(T2),
    //   Lopez dbl(B2), White(B2), Bruce(B3), Gonzalez(B3), Lopez(B3),
    //   Kronk(T4), Schiller(T4), White(B4), Shailes(B5), Motroni(B5),
    //   Shaw(T6), Enoka(T6), Kronk(T6), Schiller(T6), Zara(T6),
    //   Shaw(T7), Makea(T7), Ezekiel(B7), Shailes(B7) = 23
    expect(hits).toBe(23);
  });

  test("Full game: runs per inning match line score", () => {
    const allActions = [
      ...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3,
      ...top4, ...bot4, ...top5, ...bot5, ...top6, ...bot6,
      ...top7, ...bot7,
    ];

    const checkpoints = [
      { actions: top1, away: 0, home: 0, label: "after Top 1" },
      { actions: [...top1, ...bot1], away: 0, home: 3, label: "after Bot 1" },
      { actions: [...top1, ...bot1, ...top2], away: 0, home: 3, label: "after Top 2" },
      { actions: [...top1, ...bot1, ...top2, ...bot2], away: 0, home: 4, label: "after Bot 2" },
      { actions: [...top1, ...bot1, ...top2, ...bot2, ...top3], away: 0, home: 4, label: "after Top 3" },
      { actions: [...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3], away: 0, home: 5, label: "after Bot 3" },
      { actions: [...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3, ...top4], away: 0, home: 5, label: "after Top 4" },
      { actions: [...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3, ...top4, ...bot4], away: 0, home: 5, label: "after Bot 4" },
      { actions: [...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3, ...top4, ...bot4, ...top5], away: 0, home: 5, label: "after Top 5" },
      { actions: [...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3, ...top4, ...bot4, ...top5, ...bot5], away: 0, home: 5, label: "after Bot 5" },
      { actions: [...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3, ...top4, ...bot4, ...top5, ...bot5, ...top6], away: 3, home: 5, label: "after Top 6" },
      { actions: [...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3, ...top4, ...bot4, ...top5, ...bot5, ...top6, ...bot6], away: 3, home: 5, label: "after Bot 6" },
      { actions: [...top1, ...bot1, ...top2, ...bot2, ...top3, ...bot3, ...top4, ...bot4, ...top5, ...bot5, ...top6, ...bot6, ...top7], away: 5, home: 5, label: "after Top 7" },
      { actions: allActions, away: 5, home: 6, label: "after Bot 7 (FINAL)" },
    ];

    for (const cp of checkpoints) {
      const g = createGameState("Hill United Chiefs", "NE Drillers");
      replayActions(g, cp.actions);
      expect(g.awayScore).toBe(cp.away);
      expect(g.homeScore).toBe(cp.home);
    }
  });
});
