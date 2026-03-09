/**
 * Pure scoring engine extracted for testing.
 * Mirrors the logic in ManualScoreController's action handlers.
 * Can be driven with action sequences to replay full games.
 */

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
  };
}

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
    runsScored: eventData.runsScored || 0,
    description: eventData.description || "",
  });
  if (eventData.isPitch) {
    state.pitchCount++;
  }
}

/**
 * Apply a single action to the game state. Mutates state in place.
 * Actions: "ball", "strike", "foul", "out",
 *          "single", "double", "triple", "homerun",
 *          "error", "hbp", "fc", "sac_fly",
 *          "toggle_first", "toggle_second", "toggle_third",
 *          "score_home", "score_away"
 */
export function applyAction(state, action) {
  switch (action) {
    case "ball": {
      const newBalls = state.balls + 1;
      if (newBalls >= 4) {
        // Walk — force-advance runners in continuous chain from 1st (same as HBP, AB-004)
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
        recordEvent(state, {
          type: "walk",
          isPitch: true,
          runsScored,
          description: runsScored > 0 ? `Walk - ${runsScored} run scored` : "Walk",
        });
        state.balls = 0;
        state.strikes = 0;
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

    case "single": {
      let runsScored = 0;
      if (state.runners.third) { addRun(state); runsScored++; }
      const updated = { ...state.runners };
      updated.third = state.runners.second;
      updated.second = state.runners.first;
      updated.first = true;
      recordEvent(state, {
        type: "hit",
        subType: "Single",
        isPitch: true,
        runsScored,
        description: runsScored > 0 ? `Single - ${runsScored} run scored` : "Single",
      });
      state.runners = updated;
      state.balls = 0;
      state.strikes = 0;
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
        description: `Home Run - ${runsScored} run${runsScored > 1 ? "s" : ""} scored`,
      });
      state.runners = { first: false, second: false, third: false };
      state.balls = 0;
      state.strikes = 0;
      break;
    }

    case "error": {
      // Batter reaches on error — runner advancement like a single
      let runsScored = 0;
      if (state.runners.third) { addRun(state); runsScored++; }
      const updated = { ...state.runners };
      updated.third = state.runners.second;
      updated.second = state.runners.first;
      updated.first = true;
      recordEvent(state, {
        type: "error",
        isPitch: true,
        runsScored,
        description: runsScored > 0 ? `Error - ${runsScored} run scored` : "Error",
      });
      state.runners = updated;
      state.balls = 0;
      state.strikes = 0;
      break;
    }

    case "hbp": {
      // Hit By Pitch — batter to 1st, force-advance runners in chain from 1st
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
      recordEvent(state, {
        type: "hbp",
        isPitch: true,
        runsScored,
        description: runsScored > 0 ? `HBP - ${runsScored} run scored` : "HBP",
      });
      state.balls = 0;
      state.strikes = 0;
      break;
    }

    case "fc": {
      // Fielder's Choice — out recorded, batter reaches 1st
      // Scorer manually adjusts which runner was put out via toggle
      recordEvent(state, {
        type: "fc",
        isPitch: true,
        resultedInOut: true,
        runsScored: 0,
        description: "Fielder's Choice",
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
      // Sacrifice Fly — out recorded, runner on 3rd scores
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

    case "toggle_first":
      state.runners.first = !state.runners.first;
      break;
    case "toggle_second":
      state.runners.second = !state.runners.second;
      break;
    case "toggle_third":
      state.runners.third = !state.runners.third;
      break;

    // Manual score adjustments for extra runner advancement our auto doesn't cover
    case "score_home":
      state.homeScore++;
      break;
    case "score_away":
      state.awayScore++;
      break;

    default:
      throw new Error(`Unknown action: ${action}`);
  }

  return state;
}

/**
 * Apply a sequence of actions to a game state.
 */
export function replayActions(state, actions) {
  for (const action of actions) {
    applyAction(state, action);
  }
  return state;
}
