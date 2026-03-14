/**
 * Roster helper functions for Scores4Streams V2.
 * Pure functions — no side effects, no React dependencies.
 *
 * Positions: P, C, 1B, 2B, 3B, SS, LF, CF, RF, DP, FLEX, DH, EH, DR
 */

// All valid position codes
export const POSITIONS = [
  "P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF",
  "DP", "FLEX", "DH", "EH", "DR",
];

// Fielding positions (subset that actually take the field)
export const FIELDING_POSITIONS = [
  "P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "FLEX",
];

/**
 * Get the sorted batting lineup from a roster.
 * Returns players with battingOrder > 0, sorted by battingOrder.
 */
export function getBattingLineup(roster) {
  if (!roster) return [];
  return roster
    .filter((p) => p.battingOrder > 0)
    .sort((a, b) => a.battingOrder - b.battingOrder);
}

/**
 * Get the current batter from the active team's roster.
 * Returns the player object or null if no roster.
 */
export function getCurrentBatter(state) {
  const roster = state.isTop ? state.awayRoster : state.homeRoster;
  const index = state.isTop ? state.awayBatterIndex : state.homeBatterIndex;
  const lineup = getBattingLineup(roster);
  if (lineup.length === 0) return null;
  return lineup[index % lineup.length];
}

/**
 * Get the current pitcher (the OTHER team's pitcher).
 * Returns the player object or null.
 */
export function getCurrentPitcher(state) {
  const pitcherId = state.isTop ? state.currentHomePitcher : state.currentAwayPitcher;
  if (!pitcherId) return null;
  const roster = state.isTop ? state.homeRoster : state.awayRoster;
  if (!roster) return null;
  return roster.find((p) => p.id === pitcherId) || null;
}

/**
 * Look up a player by ID across both rosters.
 */
export function getPlayerById(state, playerId) {
  if (!playerId) return null;
  if (state.homeRoster) {
    const found = state.homeRoster.find((p) => p.id === playerId);
    if (found) return found;
  }
  if (state.awayRoster) {
    const found = state.awayRoster.find((p) => p.id === playerId);
    if (found) return found;
  }
  return null;
}

/**
 * Update runnerIdentity after an action, based on before/after runner booleans.
 * Uses a heuristic: runners shift forward (3rd→home, 2nd→3rd, 1st→2nd),
 * and newly occupied bases without a source get the batter's ID.
 *
 * Handles common cases (singles, walks, outs). Complex plays (DP runner
 * removal, extra-base advancement) may need manual correction via toggles.
 */
export function updateRunnerIdentity(
  identityBefore,
  runnersBefore,
  runnersAfter,
  currentBatterId
) {
  const newIdentity = { first: null, second: null, third: null };

  // If all bases are empty after, return all nulls (e.g., changeSides, homerun)
  if (!runnersAfter.first && !runnersAfter.second && !runnersAfter.third) {
    return newIdentity;
  }

  const usedIds = new Set();
  // Sources: same base (stayed), one base back (advanced), two bases back (double/extra-base)
  const prevBases = {
    third: ["second", "first"],
    second: ["first"],
    first: [],
  };

  // Work from furthest base backward to assign identities
  for (const base of ["third", "second", "first"]) {
    if (!runnersAfter[base]) {
      newIdentity[base] = null;
      continue;
    }

    // Check if runner was already on this base and stayed
    if (
      runnersBefore[base] &&
      identityBefore[base] &&
      !usedIds.has(identityBefore[base])
    ) {
      // Only "stayed" if no earlier base runner is advancing here
      const prev = prevBases[base][0]; // immediate previous base
      const prevAdvanced = prev && runnersBefore[prev] && !runnersAfter[prev];
      if (!prevAdvanced) {
        newIdentity[base] = identityBefore[base];
        usedIds.add(identityBefore[base]);
        continue;
      }
    }

    // Check if runner advanced from a previous base (try nearest first, then further)
    let foundPrev = false;
    for (const prev of prevBases[base]) {
      if (
        runnersBefore[prev] &&
        identityBefore[prev] &&
        !usedIds.has(identityBefore[prev])
      ) {
        newIdentity[base] = identityBefore[prev];
        usedIds.add(identityBefore[prev]);
        foundPrev = true;
        break;
      }
    }
    if (foundPrev) continue;

    // Check if runner stayed (fallback for when previous-advance didn't match)
    if (
      runnersBefore[base] &&
      identityBefore[base] &&
      !usedIds.has(identityBefore[base])
    ) {
      newIdentity[base] = identityBefore[base];
      usedIds.add(identityBefore[base]);
      continue;
    }

    // Must be the batter arriving
    if (currentBatterId && !usedIds.has(currentBatterId)) {
      newIdentity[base] = currentBatterId;
      usedIds.add(currentBatterId);
      continue;
    }

    newIdentity[base] = null;
  }

  return newIdentity;
}

/**
 * Validate a lineup for completeness.
 * Returns { valid: boolean, errors: string[] }.
 */
export function validateLineup(roster) {
  const errors = [];
  if (!roster || roster.length === 0) {
    return { valid: false, errors: ["Roster is empty"] };
  }

  const lineup = getBattingLineup(roster);
  if (lineup.length < 9) {
    errors.push(`Only ${lineup.length} batters in lineup (need at least 9)`);
  }

  // Check for duplicate batting order numbers
  const orders = lineup.map((p) => p.battingOrder);
  const dupes = orders.filter((o, i) => orders.indexOf(o) !== i);
  if (dupes.length > 0) {
    errors.push(`Duplicate batting order: ${[...new Set(dupes)].join(", ")}`);
  }

  // Check all players have names
  const unnamed = roster.filter((p) => !p.name || p.name.trim() === "");
  if (unnamed.length > 0) {
    errors.push(`${unnamed.length} player(s) without names`);
  }

  // Check for exactly one pitcher in the lineup
  const pitchers = roster.filter((p) => p.position === "P");
  if (pitchers.length === 0) {
    errors.push("No pitcher assigned");
  }

  // Check for duplicate fielding positions (excluding subs with no position)
  const fieldingPositions = roster
    .filter((p) => p.position && p.position !== "")
    .map((p) => p.position);
  const posCounts = {};
  for (const pos of fieldingPositions) {
    posCounts[pos] = (posCounts[pos] || 0) + 1;
  }
  for (const [pos, count] of Object.entries(posCounts)) {
    if (count > 1 && pos !== "EH" && pos !== "DH") {
      errors.push(`Duplicate position: ${pos} (${count} players)`);
    }
  }

  // DP/FLEX validation
  const dps = roster.filter((p) => p.position === "DP");
  const flexes = roster.filter((p) => p.position === "FLEX");
  if (dps.length > 0 && flexes.length === 0) {
    errors.push("DP requires a FLEX player");
  }
  if (flexes.length > 0 && dps.length === 0) {
    errors.push("FLEX requires a DP player");
  }
  if (dps.length > 1) errors.push("Only one DP allowed");
  if (flexes.length > 1) errors.push("Only one FLEX allowed");

  // FLEX should have battingOrder 0 (doesn't bat — DP bats for them)
  if (flexes.length > 0 && flexes[0].battingOrder > 0) {
    errors.push("FLEX should not be in batting order (DP bats for them)");
  }

  return { valid: errors.length === 0, errors };
}
