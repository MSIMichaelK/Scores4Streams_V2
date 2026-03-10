/**
 * Pure scoring engine for Scores4Streams V2.
 * Single source of truth for all game logic — used by tests and UI.
 *
 * Actions can be strings (backward compat) or objects (new features):
 *   applyAction(state, "single")                                    // string
 *   applyAction(state, { type: "ground_out", positions: [6, 3] })   // object
 */

import { getBattingLineup } from "./rosterHelpers.js";

// ─── Plate Appearance Event Types (for batter auto-advance) ──────

const PA_EVENT_TYPES = new Set([
  "walk", "strikeout", "out", "ground_out", "fly_out", "line_drive_out",
  "popup_out", "foul_fly_out", "infield_fly", "strikeout_swinging",
  "strikeout_looking", "double_play", "triple_play", "interference",
  "hit", "error", "hbp", "fc", "sac_fly", "sacrifice_bunt",
  "bunt_hit", "slap_hit", "dropped_third_strike", "intentional_walk",
  "obstruction",
]);

// ─── State Factory ────────────────────────────────────────────────

export function createGameState(homeTeam = "Home", awayTeam = "Away") {
  return {
    homeScore: 0,
    awayScore: 0,
    balls: 0,
    strikes: 0,
    outs: 0,
    runners: { first: false, second: false, third: false },
    inning: 1,
    isTop: true,
    homeTeamName: homeTeam,
    awayTeamName: awayTeam,
    pitchCount: 0,
    events: [],
    // Phase 3: Roster fields (null = no roster, backward compat)
    homeRoster: null,
    awayRoster: null,
    homeBatterIndex: 0,
    awayBatterIndex: 0,
    currentHomePitcher: null,
    currentAwayPitcher: null,
    runnerIdentity: { first: null, second: null, third: null },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────

function addRun(state) {
  if (state.isTop) {
    state.awayScore++;
  } else {
    state.homeScore++;
  }
}

function changeSides(state) {
  state.outs = 0;
  state.balls = 0;
  state.strikes = 0;
  state.runners = { first: false, second: false, third: false };
  state.runnerIdentity = { first: null, second: null, third: null };
  if (state.isTop) {
    state.isTop = false;
  } else {
    state.isTop = true;
    state.inning++;
  }
}

function recordOut(state) {
  state.outs++;
  if (state.outs >= 3) {
    changeSides(state);
  }
  state.balls = 0;
  state.strikes = 0;
}

function recordEvent(state, eventData) {
  state.events.push({
    seq: state.events.length + 1,
    inning: state.inning,
    isTop: state.isTop,
    type: eventData.type,
    subType: eventData.subType || null,
    isPitch: eventData.isPitch || false,
    resultedInOut: eventData.resultedInOut || false,
    outsRecorded: eventData.outsRecorded || (eventData.resultedInOut ? 1 : 0),
    runsScored: eventData.runsScored || 0,
    positions: eventData.positions || null,
    description: eventData.description || "",
  });
  if (eventData.isPitch) {
    state.pitchCount++;
  }
}

// ─── Extracted Helpers (AB-004 force-chain, hit advancement) ─────

/**
 * Force-chain advancement for walk/HBP/IBB (AB-004).
 * Only runners in a continuous chain from 1st are forced.
 * Returns number of runs scored.
 */
function handleForceAdvance(state) {
  const was = { ...state.runners };
  let runsScored = 0;
  if (was.first) {
    if (was.second) {
      if (was.third) {
        addRun(state);
        runsScored++;
      }
      state.runners.third = true;
    }
    state.runners.second = true;
  }
  state.runners.first = true;
  state.balls = 0;
  state.strikes = 0;
  return runsScored;
}

/**
 * Advance runners for a single. Returns runs scored.
 * 3rd scores, 2nd→3rd, 1st→2nd, batter→1st.
 */
function handleSingleAdvance(state) {
  let runsScored = 0;
  if (state.runners.third) { addRun(state); runsScored++; }
  const updated = { ...state.runners };
  updated.third = state.runners.second;
  updated.second = state.runners.first;
  updated.first = true;
  state.runners = updated;
  state.balls = 0;
  state.strikes = 0;
  return runsScored;
}

/**
 * Format fielder positions for display (e.g. [6, 3] → "6-3").
 */
function formatPositions(positions) {
  if (!positions || positions.length === 0) return "";
  return positions.join("-");
}

// ─── Position names for descriptions ─────────────────────────────

const POSITION_NAMES = {
  1: "P", 2: "C", 3: "1B", 4: "2B", 5: "3B", 6: "SS", 7: "LF", 8: "CF", 9: "RF",
};

function positionName(num) {
  return POSITION_NAMES[num] || String(num);
}

// ─── Main Engine ─────────────────────────────────────────────────

/**
 * Apply a single action to the game state. Mutates state in place.
 * Accepts string actions (backward compat) or object actions (new).
 */
export function applyAction(state, action) {
  // Normalize: string → { type: string }
  const act = typeof action === "string" ? { type: action } : action;

  // Capture pre-action state for batter auto-advance (isTop may flip on changeSides)
  const isTopBefore = state.isTop;
  const eventsLenBefore = state.events.length;

  switch (act.type) {
    // ─── Count Actions ───────────────────────────────────

    case "ball": {
      const newBalls = state.balls + 1;
      if (newBalls >= 4) {
        // Walk — force-advance (AB-004)
        const runsScored = handleForceAdvance(state);
        recordEvent(state, {
          type: "walk",
          isPitch: true,
          runsScored,
          description: runsScored > 0 ? `Walk - ${runsScored} run scored` : "Walk",
        });
      } else {
        recordEvent(state, {
          type: "ball",
          isPitch: true,
          description: `Ball (${newBalls}-${state.strikes})`,
        });
        state.balls = newBalls;
      }
      break;
    }

    case "strike": {
      const newStrikes = state.strikes + 1;
      if (newStrikes >= 3) {
        recordEvent(state, {
          type: "strikeout",
          isPitch: true,
          resultedInOut: true,
          description: "Strikeout",
        });
        recordOut(state);
      } else {
        recordEvent(state, {
          type: "strike",
          isPitch: true,
          description: `Strike (${state.balls}-${newStrikes})`,
        });
        state.strikes = newStrikes;
      }
      break;
    }

    case "foul": {
      if (state.strikes < 2) {
        recordEvent(state, {
          type: "foul",
          isPitch: true,
          description: `Foul (${state.balls}-${state.strikes + 1})`,
        });
        state.strikes++;
      } else {
        recordEvent(state, {
          type: "foul",
          isPitch: true,
          description: `Foul (${state.balls}-2)`,
        });
      }
      break;
    }

    // ─── Generic Out (backward compat) ───────────────────

    case "out": {
      recordEvent(state, {
        type: "out",
        isPitch: true,
        resultedInOut: true,
        description: "Out",
      });
      recordOut(state);
      break;
    }

    // ─── Expanded Out Types (Advanced mode) ──────────────

    case "ground_out": {
      const pos = formatPositions(act.positions);
      recordEvent(state, {
        type: "ground_out",
        subType: pos || null,
        isPitch: true,
        resultedInOut: true,
        positions: act.positions || null,
        description: pos ? `Ground out ${pos}` : "Ground out",
      });
      recordOut(state);
      break;
    }

    case "fly_out": {
      const pos = formatPositions(act.positions);
      recordEvent(state, {
        type: "fly_out",
        subType: pos || null,
        isPitch: true,
        resultedInOut: true,
        positions: act.positions || null,
        description: pos ? `Fly out F${pos}` : "Fly out",
      });
      recordOut(state);
      break;
    }

    case "line_drive_out": {
      const pos = formatPositions(act.positions);
      recordEvent(state, {
        type: "line_drive_out",
        subType: pos || null,
        isPitch: true,
        resultedInOut: true,
        positions: act.positions || null,
        description: pos ? `Line drive out LD${pos}` : "Line drive out",
      });
      recordOut(state);
      break;
    }

    case "popup_out": {
      const pos = formatPositions(act.positions);
      recordEvent(state, {
        type: "popup_out",
        subType: pos || null,
        isPitch: true,
        resultedInOut: true,
        positions: act.positions || null,
        description: pos ? `Popup out PO${pos}` : "Popup out",
      });
      recordOut(state);
      break;
    }

    case "foul_fly_out": {
      const pos = formatPositions(act.positions);
      recordEvent(state, {
        type: "foul_fly_out",
        subType: pos || null,
        isPitch: true,
        resultedInOut: true,
        positions: act.positions || null,
        description: pos ? `Foul fly out FF${pos}` : "Foul fly out",
      });
      recordOut(state);
      break;
    }

    case "infield_fly": {
      const pos = formatPositions(act.positions);
      recordEvent(state, {
        type: "infield_fly",
        subType: pos || null,
        isPitch: true,
        resultedInOut: true,
        positions: act.positions || null,
        description: pos ? `Infield fly IF${pos}` : "Infield fly",
      });
      recordOut(state);
      break;
    }

    case "strikeout_swinging": {
      recordEvent(state, {
        type: "strikeout_swinging",
        isPitch: true,
        resultedInOut: true,
        description: "Strikeout swinging (K)",
      });
      recordOut(state);
      break;
    }

    case "strikeout_looking": {
      recordEvent(state, {
        type: "strikeout_looking",
        isPitch: true,
        resultedInOut: true,
        description: "Strikeout looking (KC)",
      });
      recordOut(state);
      break;
    }

    // ─── Multi-Out Plays ─────────────────────────────────

    case "double_play": {
      // 2 outs from 1 pitch (fixes AB-006 pitch overcount)
      const pos = formatPositions(act.positions);
      // Remove the specified runner(s) from bases
      if (act.runnersOut) {
        for (const base of act.runnersOut) {
          state.runners[base] = false;
        }
      }
      let runsScored = 0;
      // Check if a runner scored before the DP completed (timing play)
      if (act.runsScored) {
        const outsSet = new Set(act.runnersOut || []);
        // Clear scoring runners from furthest base first
        const scoringBases = ["third", "second", "first"].filter(
          (b) => state.runners[b] && !outsSet.has(b)
        );
        for (let i = 0; i < act.runsScored; i++) {
          addRun(state);
          runsScored++;
          if (scoringBases[i]) {
            state.runners[scoringBases[i]] = false;
          }
        }
      }
      recordEvent(state, {
        type: "double_play",
        subType: pos || null,
        isPitch: true,
        resultedInOut: true,
        outsRecorded: 2,
        runsScored,
        positions: act.positions || null,
        description: pos ? `Double play ${pos}` : "Double play",
      });
      state.outs += 2;
      if (state.outs >= 3) {
        changeSides(state);
      }
      state.balls = 0;
      state.strikes = 0;
      break;
    }

    case "triple_play": {
      const pos = formatPositions(act.positions);
      if (act.runnersOut) {
        for (const base of act.runnersOut) {
          state.runners[base] = false;
        }
      }
      recordEvent(state, {
        type: "triple_play",
        subType: pos || null,
        isPitch: true,
        resultedInOut: true,
        outsRecorded: 3,
        runsScored: 0,
        positions: act.positions || null,
        description: pos ? `Triple play ${pos}` : "Triple play",
      });
      state.outs += 3;
      if (state.outs >= 3) {
        changeSides(state);
      }
      state.balls = 0;
      state.strikes = 0;
      break;
    }

    // ─── Hits ────────────────────────────────────────────

    case "single": {
      const runsScored = handleSingleAdvance(state);
      recordEvent(state, {
        type: "hit",
        subType: "Single",
        isPitch: true,
        runsScored,
        positions: act.positions || null,
        description: runsScored > 0 ? `Single - ${runsScored} run scored` : "Single",
      });
      break;
    }

    case "double": {
      let runsScored = 0;
      if (state.runners.third) { addRun(state); runsScored++; }
      if (state.runners.second) { addRun(state); runsScored++; }
      const updated = { ...state.runners };
      updated.third = state.runners.first;
      updated.second = true;
      updated.first = false;
      recordEvent(state, {
        type: "hit",
        subType: "Double",
        isPitch: true,
        runsScored,
        positions: act.positions || null,
        description: runsScored > 0 ? `Double - ${runsScored} run${runsScored > 1 ? "s" : ""} scored` : "Double",
      });
      state.runners = updated;
      state.balls = 0;
      state.strikes = 0;
      break;
    }

    case "triple": {
      let runsScored = 0;
      if (state.runners.third) { addRun(state); runsScored++; }
      if (state.runners.second) { addRun(state); runsScored++; }
      if (state.runners.first) { addRun(state); runsScored++; }
      const updated = { third: true, second: false, first: false };
      recordEvent(state, {
        type: "hit",
        subType: "Triple",
        isPitch: true,
        runsScored,
        positions: act.positions || null,
        description: runsScored > 0 ? `Triple - ${runsScored} run${runsScored > 1 ? "s" : ""} scored` : "Triple",
      });
      state.runners = updated;
      state.balls = 0;
      state.strikes = 0;
      break;
    }

    case "homerun": {
      let runsScored = 1;
      if (state.runners.first) runsScored++;
      if (state.runners.second) runsScored++;
      if (state.runners.third) runsScored++;
      for (let i = 0; i < runsScored; i++) addRun(state);
      recordEvent(state, {
        type: "hit",
        subType: "Home Run",
        isPitch: true,
        runsScored,
        positions: act.positions || null,
        description: `Home Run - ${runsScored} run${runsScored > 1 ? "s" : ""} scored`,
      });
      state.runners = { first: false, second: false, third: false };
      state.balls = 0;
      state.strikes = 0;
      break;
    }

    // ─── Special Plays ───────────────────────────────────

    case "error": {
      // Single-equivalent advancement (AB-005)
      const runsScored = handleSingleAdvance(state);
      recordEvent(state, {
        type: "error",
        subType: act.errorType || null,
        isPitch: true,
        runsScored,
        positions: act.positions || null,
        description: runsScored > 0 ? `Error - ${runsScored} run scored` : "Error",
      });
      break;
    }

    case "hbp": {
      // Hit By Pitch — force-advance (AB-004)
      const runsScored = handleForceAdvance(state);
      recordEvent(state, {
        type: "hbp",
        isPitch: true,
        runsScored,
        description: runsScored > 0 ? `HBP - ${runsScored} run scored` : "HBP",
      });
      break;
    }

    case "fc": {
      // Fielder's Choice — out recorded, batter reaches 1st
      const pos = formatPositions(act.positions);
      recordEvent(state, {
        type: "fc",
        subType: pos || null,
        isPitch: true,
        resultedInOut: true,
        runsScored: 0,
        positions: act.positions || null,
        description: pos ? `Fielder's Choice FC${pos}` : "Fielder's Choice",
      });
      state.outs++;
      if (state.outs >= 3) {
        changeSides(state);
      } else {
        state.runners.first = true;
      }
      state.balls = 0;
      state.strikes = 0;
      break;
    }

    case "sac_fly": {
      // Sacrifice Fly — out recorded, runner on 3rd scores (AB-009)
      let runsScored = 0;
      if (state.runners.third) {
        addRun(state);
        runsScored++;
      }
      recordEvent(state, {
        type: "sac_fly",
        isPitch: true,
        resultedInOut: true,
        runsScored,
        positions: act.positions || null,
        description: runsScored > 0 ? `Sac Fly - ${runsScored} run scored` : "Sac Fly",
      });
      state.outs++;
      if (state.outs >= 3) {
        changeSides(state);
      } else {
        state.runners.third = false;
      }
      state.balls = 0;
      state.strikes = 0;
      break;
    }

    // ─── Base Running (isPitch: false — between pitches) ──

    case "stolen_base": {
      // Runner advances one base on a steal
      const from = act.runner; // "first", "second", or "third"
      const toMap = { first: "second", second: "third", third: null };
      const to = toMap[from];
      if (to) {
        state.runners[to] = true;
      } else {
        // Steal of home
        addRun(state);
      }
      state.runners[from] = false;
      const fromLabel = from === "first" ? "1B" : from === "second" ? "2B" : "3B";
      const toLabel = to === "second" ? "2B" : to === "third" ? "3B" : "Home";
      recordEvent(state, {
        type: "stolen_base",
        subType: `${fromLabel}-${toLabel}`,
        isPitch: false,
        runsScored: to ? 0 : 1,
        description: `Stolen base ${fromLabel} to ${toLabel}`,
      });
      break;
    }

    case "caught_stealing": {
      // Runner out on steal attempt
      const from = act.runner;
      state.runners[from] = false;
      const pos = formatPositions(act.positions);
      const fromLabel = from === "first" ? "1B" : from === "second" ? "2B" : "3B";
      recordEvent(state, {
        type: "caught_stealing",
        subType: pos || null,
        isPitch: false,
        resultedInOut: true,
        positions: act.positions || null,
        description: pos ? `CS ${fromLabel} ${pos}` : `CS ${fromLabel}`,
      });
      state.outs++;
      if (state.outs >= 3) {
        changeSides(state);
      }
      break;
    }

    case "pick_off": {
      // Runner out returning to base
      const from = act.runner;
      state.runners[from] = false;
      const pos = formatPositions(act.positions);
      const fromLabel = from === "first" ? "1B" : from === "second" ? "2B" : "3B";
      recordEvent(state, {
        type: "pick_off",
        subType: pos || null,
        isPitch: false,
        resultedInOut: true,
        positions: act.positions || null,
        description: pos ? `Pick off ${fromLabel} ${pos}` : `Pick off ${fromLabel}`,
      });
      state.outs++;
      if (state.outs >= 3) {
        changeSides(state);
      }
      break;
    }

    case "wild_pitch": {
      // Runner(s) advance on wild pitch. Advance specified runners or lead runner.
      let runsScored = 0;
      const runners = act.runners || [];
      if (runners.length > 0) {
        // Advance specified runners (furthest first to avoid collisions)
        const ordered = ["third", "second", "first"].filter((b) => runners.includes(b));
        for (const base of ordered) {
          const toMap = { first: "second", second: "third", third: null };
          const to = toMap[base];
          if (to) {
            state.runners[to] = true;
          } else {
            addRun(state);
            runsScored++;
          }
          state.runners[base] = false;
        }
      } else {
        // Default: advance lead runner
        if (state.runners.third) {
          addRun(state);
          runsScored++;
          state.runners.third = false;
        } else if (state.runners.second) {
          state.runners.third = true;
          state.runners.second = false;
        } else if (state.runners.first) {
          state.runners.second = true;
          state.runners.first = false;
        }
      }
      recordEvent(state, {
        type: "wild_pitch",
        isPitch: false,
        runsScored,
        description: runsScored > 0 ? `Wild pitch - ${runsScored} run scored` : "Wild pitch",
      });
      break;
    }

    case "passed_ball": {
      // Same mechanics as wild pitch (runner advancement)
      let runsScored = 0;
      const runners = act.runners || [];
      if (runners.length > 0) {
        const ordered = ["third", "second", "first"].filter((b) => runners.includes(b));
        for (const base of ordered) {
          const toMap = { first: "second", second: "third", third: null };
          const to = toMap[base];
          if (to) {
            state.runners[to] = true;
          } else {
            addRun(state);
            runsScored++;
          }
          state.runners[base] = false;
        }
      } else {
        if (state.runners.third) {
          addRun(state);
          runsScored++;
          state.runners.third = false;
        } else if (state.runners.second) {
          state.runners.third = true;
          state.runners.second = false;
        } else if (state.runners.first) {
          state.runners.second = true;
          state.runners.first = false;
        }
      }
      recordEvent(state, {
        type: "passed_ball",
        isPitch: false,
        runsScored,
        description: runsScored > 0 ? `Passed ball - ${runsScored} run scored` : "Passed ball",
      });
      break;
    }

    case "illegal_pitch": {
      // All runners advance one base + ball to batter
      let runsScored = 0;
      if (state.runners.third) {
        addRun(state);
        runsScored++;
      }
      const updated = { ...state.runners };
      updated.third = state.runners.second;
      updated.second = state.runners.first;
      updated.first = false;
      state.runners = updated;
      // Ball to batter
      state.balls++;
      if (state.balls >= 4) {
        // Walk from illegal pitch
        const walkRuns = handleForceAdvance(state);
        runsScored += walkRuns;
      }
      recordEvent(state, {
        type: "illegal_pitch",
        isPitch: false,
        runsScored,
        description: runsScored > 0 ? `Illegal pitch - ${runsScored} run${runsScored > 1 ? "s" : ""} scored` : "Illegal pitch",
      });
      break;
    }

    // ─── Batting Variants ─────────────────────────────────

    case "sacrifice_bunt": {
      // Out recorded, runners advance one base
      let runsScored = 0;
      if (state.runners.third) {
        addRun(state);
        runsScored++;
      }
      const updated = { ...state.runners };
      updated.third = state.runners.second;
      updated.second = state.runners.first;
      updated.first = false;
      state.runners = updated;
      const pos = formatPositions(act.positions);
      recordEvent(state, {
        type: "sacrifice_bunt",
        subType: pos || null,
        isPitch: true,
        resultedInOut: true,
        runsScored,
        positions: act.positions || null,
        description: pos ? `Sac bunt ${pos}` : "Sac bunt",
      });
      state.outs++;
      if (state.outs >= 3) {
        changeSides(state);
      }
      state.balls = 0;
      state.strikes = 0;
      break;
    }

    case "bunt_hit": {
      // Bunt safe hit — same as single but tracked as bunt for stats
      const runsScored = handleSingleAdvance(state);
      const pos = formatPositions(act.positions);
      recordEvent(state, {
        type: "bunt_hit",
        subType: pos || null,
        isPitch: true,
        runsScored,
        positions: act.positions || null,
        description: runsScored > 0 ? `Bunt hit - ${runsScored} run scored` : "Bunt hit",
      });
      break;
    }

    case "slap_hit": {
      // Slap hit — same as single but tracked as slap for stats
      const runsScored = handleSingleAdvance(state);
      recordEvent(state, {
        type: "slap_hit",
        isPitch: true,
        runsScored,
        positions: act.positions || null,
        description: runsScored > 0 ? `Slap hit - ${runsScored} run scored` : "Slap hit",
      });
      break;
    }

    case "dropped_third_strike": {
      // Batter reaches 1st on dropped 3rd strike (K2-3, KE2, KWP)
      const pos = formatPositions(act.positions);
      recordEvent(state, {
        type: "dropped_third_strike",
        subType: pos || null,
        isPitch: true,
        runsScored: 0,
        positions: act.positions || null,
        description: pos ? `Dropped 3rd strike ${pos}` : "Dropped 3rd strike",
      });
      state.runners.first = true;
      state.balls = 0;
      state.strikes = 0;
      break;
    }

    case "intentional_walk": {
      // IBB — force-chain advancement, counts as 1 pitch
      const runsScored = handleForceAdvance(state);
      recordEvent(state, {
        type: "intentional_walk",
        isPitch: true,
        runsScored,
        description: runsScored > 0 ? `IBB - ${runsScored} run scored` : "IBB",
      });
      break;
    }

    case "obstruction": {
      // Batter awarded 1st base (OBS/OBS2)
      const runsScored = handleForceAdvance(state);
      recordEvent(state, {
        type: "obstruction",
        subType: act.subType || null,
        isPitch: true,
        runsScored,
        description: runsScored > 0 ? `Obstruction - ${runsScored} run scored` : "Obstruction",
      });
      break;
    }

    case "interference": {
      // Out on offending player
      const pos = formatPositions(act.positions);
      recordEvent(state, {
        type: "interference",
        subType: pos || null,
        isPitch: true,
        resultedInOut: true,
        positions: act.positions || null,
        description: pos ? `Interference INT${pos}` : "Interference",
      });
      recordOut(state);
      break;
    }

    // ─── Runner Toggles (manual adjustments) ─────────────

    case "toggle_first":
      state.runners.first = !state.runners.first;
      break;
    case "toggle_second":
      state.runners.second = !state.runners.second;
      break;
    case "toggle_third":
      state.runners.third = !state.runners.third;
      break;
    case "runner_toggle": {
      const base = act.base;
      const wasOn = state.runners[base];
      const baseLabel = base === "first" ? "1B" : base === "second" ? "2B" : "3B";
      state.runners[base] = !wasOn;
      recordEvent(state, {
        type: "runner_toggle",
        subType: base,
        isPitch: false,
        resultedInOut: false,
        description: `Runner ${wasOn ? "off" : "on"} ${baseLabel}`,
      });
      break;
    }

    // ─── Score Adjustments ───────────────────────────────

    case "score_home":
      state.homeScore++;
      break;
    case "score_away":
      state.awayScore++;
      break;
    case "score_adjust": {
      const delta = act.delta || 0;
      if (act.team === "home") {
        state.homeScore = Math.max(0, state.homeScore + delta);
      } else {
        state.awayScore = Math.max(0, state.awayScore + delta);
      }
      const teamName = act.team === "home" ? state.homeTeamName : state.awayTeamName;
      recordEvent(state, {
        type: "score_adjust",
        subType: `${delta > 0 ? "+" : ""}${delta}`,
        isPitch: false,
        resultedInOut: false,
        runsScored: delta,
        description: `${teamName} ${delta > 0 ? "+" : ""}${delta}`,
      });
      break;
    }

    // ─── Pitcher Change ─────────────────────────────────

    case "pitcher_change": {
      if (act.team === "home") {
        state.currentHomePitcher = act.pitcherId;
      } else {
        state.currentAwayPitcher = act.pitcherId;
      }
      recordEvent(state, {
        type: "pitcher_change",
        isPitch: false,
        description: act.playerName
          ? `Pitching change: ${act.playerName}`
          : "Pitching change",
      });
      break;
    }

    default:
      throw new Error(`Unknown action: ${act.type}`);
  }

  // ─── Auto-advance batter after plate appearances ────────────
  // Only when rosters are loaded. Uses isTopBefore to handle changeSides.
  const newEvents = state.events.slice(eventsLenBefore);
  const hasPAEvent = newEvents.some((e) => PA_EVENT_TYPES.has(e.type));
  if (hasPAEvent) {
    const roster = isTopBefore ? state.awayRoster : state.homeRoster;
    const lineup = getBattingLineup(roster);
    if (lineup.length > 0) {
      const indexKey = isTopBefore ? "awayBatterIndex" : "homeBatterIndex";
      state[indexKey] = (state[indexKey] + 1) % lineup.length;
    }
  }

  return state;
}

/**
 * Apply a sequence of actions to a game state.
 * Actions can be strings or objects (mixed is fine).
 */
export function replayActions(state, actions) {
  for (const action of actions) {
    applyAction(state, action);
  }
  return state;
}
