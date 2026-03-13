/**
 * Per-game statistics engine for Scores4Streams V2.
 * Pure functions — no React, no Firebase, no side effects.
 *
 * Computes batting, pitching, and fielding stats from the event stream.
 * Handles both team-level (always available) and per-player (when rosters exist).
 *
 * Known limitations:
 * - All runs treated as earned (earned/unearned classification deferred)
 * - Fielding stats require positions arrays (Advanced mode only)
 * - Softball 7-inning game assumed for rate stats (ERA, K/9, BB/9)
 * - Inherited runner attribution requires `inheritedRunnerPitcherIds` on events
 */

// ─── Constants ──────────────────────────────────────────────────

/** Event types that constitute a plate appearance */
const PA_TYPES = new Set([
  "walk", "strikeout", "out", "ground_out", "fly_out", "line_drive_out",
  "popup_out", "foul_fly_out", "infield_fly", "strikeout_swinging",
  "strikeout_looking", "double_play", "triple_play", "interference",
  "hit", "error", "hbp", "fc", "sac_fly", "sacrifice_bunt",
  "bunt_hit", "slap_hit", "dropped_third_strike", "intentional_walk",
  "obstruction",
]);

/** Event types that are NOT at-bats (PA but excluded from AB) */
const NOT_AB_TYPES = new Set([
  "walk", "intentional_walk", "hbp", "sac_fly", "sacrifice_bunt", "obstruction",
]);

/** Event types that count as hits */
const HIT_TYPES = new Set(["hit", "bunt_hit", "slap_hit"]);

/** Event types that count as strikeouts */
const K_TYPES = new Set([
  "strikeout", "strikeout_swinging", "strikeout_looking", "dropped_third_strike",
]);

/** Event types that count as walks (BB total) */
const BB_TYPES = new Set(["walk", "intentional_walk"]);

/** Event types that count as outs (for IP calculation) */
const OUT_EVENT_TYPES = new Set([
  "out", "ground_out", "fly_out", "line_drive_out", "popup_out",
  "foul_fly_out", "infield_fly", "strikeout", "strikeout_swinging",
  "strikeout_looking", "fc", "sac_fly", "sacrifice_bunt", "interference",
  "caught_stealing", "pick_off",
]);

/**
 * Non-stat events to filter out before processing.
 * NOTE: ball/strike/foul are NOT filtered — they carry isPitch:true
 * which is needed for accurate pitch counts in pitching stats.
 */
const IGNORED_TYPES = new Set([
  "runner_toggle", "toggle_first", "toggle_second", "toggle_third",
  "score_home", "score_away", "score_adjust", "pitcher_change",
]);

/** Base running events — not PA types, credited to team not individual */
const BASE_RUNNING_TYPES = new Set([
  "stolen_base", "caught_stealing", "pick_off",
  "wild_pitch", "passed_ball", "illegal_pitch",
]);

/** Softball uses 7 innings for rate stats */
const INNINGS_PER_GAME = 7;

// ─── IP Formatting ──────────────────────────────────────────────

/**
 * Format outs recorded as innings pitched display.
 * 16 outs → "5.1" (5 full innings + 1 out)
 */
export function formatIP(outsRecorded) {
  const full = Math.floor(outsRecorded / 3);
  const remainder = outsRecorded % 3;
  return `${full}.${remainder}`;
}

/**
 * Convert outs recorded to numeric IP for calculations.
 * 16 outs → 5.333...
 */
function outsToIP(outsRecorded) {
  return outsRecorded / 3;
}

// ─── Batting Stats ──────────────────────────────────────────────

/**
 * Create an empty batting stat line.
 */
function emptyBattingLine() {
  return {
    PA: 0, AB: 0, H: 0,
    "1B": 0, "2B": 0, "3B": 0, HR: 0,
    RBI: 0, BB: 0, IBB: 0, HBP: 0, K: 0,
    SF: 0, SH: 0, SB: 0, CS: 0, GDP: 0,
    R: 0, TB: 0, XBH: 0,
    BA: 0, OBP: 0, SLG: 0, OPS: 0,
  };
}

/**
 * Accumulate a single event into a batting stat line.
 */
function accumulateBattingEvent(line, event) {
  const t = event.type;

  // Plate appearances
  if (PA_TYPES.has(t)) {
    line.PA++;

    // At-bats (PA minus excluded types)
    // Error is also not an AB in official scoring
    if (!NOT_AB_TYPES.has(t) && t !== "error") {
      line.AB++;
    }
  }

  // Hits
  if (HIT_TYPES.has(t)) {
    line.H++;
    if (t === "bunt_hit" || t === "slap_hit") {
      line["1B"]++;
      line.TB += 1;
    } else {
      // Standard hit — check subType
      switch (event.subType) {
        case "Single": line["1B"]++; line.TB += 1; break;
        case "Double": line["2B"]++; line.TB += 2; line.XBH++; break;
        case "Triple": line["3B"]++; line.TB += 3; line.XBH++; break;
        case "Home Run": line.HR++; line.TB += 4; line.XBH++; break;
      }
    }
  }

  // Walks
  if (t === "walk") line.BB++;
  if (t === "intentional_walk") { line.BB++; line.IBB++; }

  // HBP
  if (t === "hbp") line.HBP++;

  // Strikeouts
  if (K_TYPES.has(t)) line.K++;

  // Sacrifices
  if (t === "sac_fly") line.SF++;
  if (t === "sacrifice_bunt") line.SH++;

  // GDP (batter grounded into double play)
  if (t === "double_play") line.GDP++;

  // RBI — runs scored from batting events (not base running)
  if (!BASE_RUNNING_TYPES.has(t) && event.runsScored) {
    line.RBI += event.runsScored;
  }

  // Runs scored on batting events are counted per-event for team totals
  if (event.runsScored) {
    line.R += event.runsScored;
  }
}

/**
 * Accumulate base running events into a batting line.
 * SB/CS are credited to the batting team.
 */
function accumulateBaseRunning(line, event) {
  if (event.type === "stolen_base") {
    line.SB++;
    if (event.runsScored) line.R += event.runsScored;
  }
  if (event.type === "caught_stealing") line.CS++;
  // WP/PB/IP runs also count toward team runs
  if (event.runsScored && event.type !== "stolen_base") {
    line.R += event.runsScored;
  }
}

/**
 * Compute batting rate stats from counting stats.
 */
function computeBattingRates(line) {
  line.BA = line.AB > 0 ? round3(line.H / line.AB) : 0;
  const obpDenom = line.AB + line.BB + line.HBP + line.SF;
  line.OBP = obpDenom > 0 ? round3((line.H + line.BB + line.HBP) / obpDenom) : 0;
  line.SLG = line.AB > 0 ? round3(line.TB / line.AB) : 0;
  line.OPS = round3(line.OBP + line.SLG);
}

// ─── Pitching Stats ─────────────────────────────────────────────

/**
 * Create an empty pitching stat line.
 */
function emptyPitchingLine() {
  return {
    BF: 0, outsRecorded: 0, IP: "0.0",
    H: 0, R: 0, ER: 0, BB: 0, IBB: 0, HBP: 0, K: 0, WP: 0,
    pitches: 0,
    ERA: 0, WHIP: 0, "K/9": 0, "BB/9": 0, "K/BB": 0,
  };
}

/**
 * Accumulate a single event into a pitching stat line.
 * Events are from the perspective of the opposing team batting.
 */
function accumulatePitchingEvent(line, event) {
  const t = event.type;

  // Batters faced
  if (PA_TYPES.has(t)) line.BF++;

  // Outs recorded
  if (event.outsRecorded) {
    line.outsRecorded += event.outsRecorded;
  } else if (event.resultedInOut) {
    line.outsRecorded += 1;
  }

  // Hits allowed
  if (HIT_TYPES.has(t)) line.H++;

  // Runs allowed (all events including base running)
  if (event.runsScored) {
    line.R += event.runsScored;
    line.ER += event.runsScored; // All earned for now (earned/unearned deferred)
  }

  // Walks
  if (t === "walk") line.BB++;
  if (t === "intentional_walk") { line.BB++; line.IBB++; }

  // HBP
  if (t === "hbp") line.HBP++;

  // Strikeouts
  if (K_TYPES.has(t)) line.K++;

  // Wild pitches
  if (t === "wild_pitch") line.WP++;

  // Pitch count
  if (event.isPitch) line.pitches++;
}

/**
 * Compute pitching rate stats from counting stats.
 */
function computePitchingRates(line) {
  const ip = outsToIP(line.outsRecorded);
  line.IP = formatIP(line.outsRecorded);

  if (ip > 0) {
    line.ERA = round2((line.ER * INNINGS_PER_GAME) / ip);
    // WHIP: walks (excluding IBB) + hits per inning
    const bbForWhip = line.BB - line.IBB;
    line.WHIP = round2((bbForWhip + line.H) / ip);
    line["K/9"] = round2((line.K * INNINGS_PER_GAME) / ip);
    line["BB/9"] = round2((line.BB * INNINGS_PER_GAME) / ip);
  }
  line["K/BB"] = line.BB > 0 ? round2(line.K / line.BB) : 0;
}

// ─── Fielding Stats ─────────────────────────────────────────────

/**
 * Create an empty fielding stat line.
 */
function emptyFieldingLine() {
  return { PO: 0, A: 0, E: 0, DP: 0, FPCT: 0, TC: 0 };
}

/**
 * Compute fielding stats from events with positions arrays.
 * Returns a map of position number → fielding line.
 */
function computeFieldingFromEvents(events) {
  const byPosition = {}; // posNumber → fieldingLine

  function getLine(pos) {
    if (!byPosition[pos]) byPosition[pos] = emptyFieldingLine();
    return byPosition[pos];
  }

  for (const event of events) {
    const positions = event.positions;
    if (!positions || positions.length === 0) continue;

    if (event.type === "error") {
      // Error: first position is the fielder who committed the error
      const errorFielder = positions[0];
      getLine(errorFielder).E++;
    } else if (event.resultedInOut || event.outsRecorded) {
      // Out play: last position = putout, others = assists
      const last = positions[positions.length - 1];
      getLine(last).PO++;
      for (let i = 0; i < positions.length - 1; i++) {
        getLine(positions[i]).A++;
      }
    }

    // DP participation
    if (event.type === "double_play") {
      for (const pos of positions) {
        getLine(pos).DP++;
      }
    }
  }

  // Compute TC and FPCT
  for (const pos of Object.keys(byPosition)) {
    const line = byPosition[pos];
    line.TC = line.PO + line.A + line.E;
    line.FPCT = line.TC > 0 ? round3((line.PO + line.A) / line.TC) : 0;
  }

  return byPosition;
}

// ─── Main API ───────────────────────────────────────────────────

/**
 * Compute all game statistics from the event stream.
 *
 * @param {Array} events - The game's events array (from state.events or Firestore)
 * @param {Array|null} homeRoster - Home team roster (null if no roster)
 * @param {Array|null} awayRoster - Away team roster (null if no roster)
 * @returns {{ home: TeamStats, away: TeamStats }}
 */
export function computeGameStats(events, homeRoster = null, awayRoster = null) {
  // Step 1: Filter out undone and non-stat events
  const active = events.filter(
    (e) => !e.undone && !IGNORED_TYPES.has(e.type)
  );

  // Step 2: Split by half-inning (isTop=true → away batting, isTop=false → home batting)
  const awayBattingEvents = active.filter((e) => e.isTop === true);
  const homeBattingEvents = active.filter((e) => e.isTop === false);

  // Step 3: Team batting stats
  const homeBatting = computeTeamBatting(homeBattingEvents);
  const awayBatting = computeTeamBatting(awayBattingEvents);

  // Step 4: Team pitching stats
  // Home pitching = when away bats (isTop=true)
  // Away pitching = when home bats (isTop=false)
  const homePitching = computeTeamPitching(awayBattingEvents);
  const awayPitching = computeTeamPitching(homeBattingEvents);

  // Step 5: Fielding stats (from events with positions)
  const homeFielding = computeFieldingFromEvents(
    awayBattingEvents.filter((e) => e.positions && e.positions.length > 0)
  );
  const awayFielding = computeFieldingFromEvents(
    homeBattingEvents.filter((e) => e.positions && e.positions.length > 0)
  );

  // Step 6: Per-player stats (only when rosters exist)
  const homePlayers = homeRoster
    ? computePlayerStats(active, homeRoster, false)
    : null;
  const awayPlayers = awayRoster
    ? computePlayerStats(active, awayRoster, true)
    : null;

  return {
    home: {
      batting: homeBatting,
      pitching: homePitching,
      fielding: Object.keys(homeFielding).length > 0 ? homeFielding : null,
      players: homePlayers,
    },
    away: {
      batting: awayBatting,
      pitching: awayPitching,
      fielding: Object.keys(awayFielding).length > 0 ? awayFielding : null,
      players: awayPlayers,
    },
  };
}

// ─── Team-Level Computation ─────────────────────────────────────

/**
 * Compute team batting stats from events for one team's at-bats.
 */
function computeTeamBatting(battingEvents) {
  const line = emptyBattingLine();

  for (const event of battingEvents) {
    if (BASE_RUNNING_TYPES.has(event.type)) {
      accumulateBaseRunning(line, event);
    } else {
      accumulateBattingEvent(line, event);
    }
  }

  computeBattingRates(line);
  return line;
}

/**
 * Compute team pitching stats from events when that team is pitching.
 * Input: events from the opposing team's batting half-innings.
 */
function computeTeamPitching(opposingBattingEvents) {
  const line = emptyPitchingLine();

  for (const event of opposingBattingEvents) {
    accumulatePitchingEvent(line, event);
  }

  computePitchingRates(line);
  return line;
}

// ─── Per-Player Computation ─────────────────────────────────────

/**
 * Compute per-player batting and pitching stats.
 *
 * @param {Array} allEvents - All active events (both halves)
 * @param {Array} roster - The team's roster
 * @param {boolean} isAway - true if this team is the away team
 * @returns {{ batting: Array, pitching: Array }}
 */
function computePlayerStats(allEvents, roster, isAway) {
  // This team bats when isTop matches their role
  const battingIsTop = isAway; // Away bats in top, home in bottom
  const battingEvents = allEvents.filter((e) => e.isTop === battingIsTop);
  const pitchingEvents = allEvents.filter((e) => e.isTop !== battingIsTop);

  // Per-player batting: group by batterId
  const battingByPlayer = {};
  for (const event of battingEvents) {
    if (!event.batterId) continue;
    if (!PA_TYPES.has(event.type) && !BASE_RUNNING_TYPES.has(event.type)) continue;

    if (!battingByPlayer[event.batterId]) {
      battingByPlayer[event.batterId] = emptyBattingLine();
    }
    const line = battingByPlayer[event.batterId];
    if (BASE_RUNNING_TYPES.has(event.type)) {
      accumulateBaseRunning(line, event);
    } else {
      accumulateBattingEvent(line, event);
    }
  }

  // Compute rates and attach player info
  const battingLines = [];
  for (const player of roster) {
    const line = battingByPlayer[player.id] || emptyBattingLine();
    computeBattingRates(line);
    battingLines.push({
      playerId: player.id,
      name: player.name,
      number: player.number,
      ...line,
    });
  }

  // Per-player pitching: group by pitcherId
  const pitchingByPlayer = {};
  for (const event of pitchingEvents) {
    if (!event.pitcherId) continue;

    if (!pitchingByPlayer[event.pitcherId]) {
      pitchingByPlayer[event.pitcherId] = emptyPitchingLine();
    }
    accumulatePitchingEvent(pitchingByPlayer[event.pitcherId], event);

    // Inherited runner attribution: redistribute runs to original pitchers
    if (event.inheritedRunnerPitcherIds && event.runsScored > 0) {
      const currentLine = pitchingByPlayer[event.pitcherId];
      for (const origPitcherId of event.inheritedRunnerPitcherIds) {
        if (origPitcherId !== event.pitcherId) {
          // Move 1 R + 1 ER from current pitcher to original pitcher
          currentLine.R--;
          currentLine.ER--;
          if (!pitchingByPlayer[origPitcherId]) {
            pitchingByPlayer[origPitcherId] = emptyPitchingLine();
          }
          pitchingByPlayer[origPitcherId].R++;
          pitchingByPlayer[origPitcherId].ER++;
        }
      }
    }
  }

  // Compute rates and attach player info
  const pitchingLines = [];
  for (const player of roster) {
    if (!pitchingByPlayer[player.id]) continue;
    const line = pitchingByPlayer[player.id];
    computePitchingRates(line);
    pitchingLines.push({
      playerId: player.id,
      name: player.name,
      number: player.number,
      ...line,
    });
  }

  return { batting: battingLines, pitching: pitchingLines };
}

// ─── Utilities ──────────────────────────────────────────────────

/** Round to 3 decimal places (batting averages). */
function round3(n) {
  return Math.round(n * 1000) / 1000;
}

/** Round to 2 decimal places (ERA, WHIP). */
function round2(n) {
  return Math.round(n * 100) / 100;
}
