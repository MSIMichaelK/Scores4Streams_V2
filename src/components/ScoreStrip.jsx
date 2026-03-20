/**
 * ScoreStrip — ultra-compact scoreboard + BSO in a single ~40px strip.
 *
 * Layout: Away Score | ▲5 | Home Score | B●●○○ S●○ O●○
 * Score +/- revealed via edit toggle. Pitch count toggles on tap.
 */
const ScoreStrip = ({
  state,
  scoringMode,
  pitchCount,
  battingTeam,
  onScoreAdjust,
  onEditLineups,
  onBack,
  currentBatter,
  currentPitcher,
}) => {

  return (
    <div className="score-strip">
      {/* Back button */}
      {onBack && (
        <button className="strip-back-btn" onClick={onBack} title="Back">
          ←
        </button>
      )}

      {/* Away team */}
      <div className={`strip-team ${battingTeam === "away" ? "batting" : ""}`}>
        <span className="strip-team-name">{state.awayTeamName || "Away"}</span>
        <span className="strip-adjust">
          <button onClick={() => onScoreAdjust("away", -1)} data-testid="score-away-minus">-</button>
        </span>
        <span className="strip-score" data-testid="score-away">{state.awayScore}</span>
        <span className="strip-adjust">
          <button onClick={() => onScoreAdjust("away", 1)} data-testid="score-away-plus">+</button>
        </span>
      </div>

      {/* Inning */}
      <div className="strip-inning" data-testid="inning-display">
        <span className="strip-half">{state.isTop ? "\u25B2" : "\u25BC"}</span>
        <span className="strip-inning-num">{state.inning}</span>
      </div>

      {/* Home team */}
      <div className={`strip-team ${battingTeam === "home" ? "batting" : ""}`}>
        <span className="strip-team-name">{state.homeTeamName || "Home"}</span>
        <span className="strip-adjust">
          <button onClick={() => onScoreAdjust("home", -1)} data-testid="score-home-minus">-</button>
        </span>
        <span className="strip-score" data-testid="score-home">{state.homeScore}</span>
        <span className="strip-adjust">
          <button onClick={() => onScoreAdjust("home", 1)} data-testid="score-home-plus">+</button>
        </span>
      </div>

      {/* BSO dots */}
      <div className="strip-bso" data-testid="bso-row">
        <div className="strip-bso-group" data-testid="bso-balls" data-count={state.balls}>
          <span className="strip-bso-label">B</span>
          {[0, 1, 2, 3].map(i => (
            <span key={i} className={`strip-dot ball ${i < state.balls ? "active" : ""}`} />
          ))}
        </div>
        <div className="strip-bso-group" data-testid="bso-strikes" data-count={state.strikes}>
          <span className="strip-bso-label">S</span>
          {[0, 1, 2].map(i => (
            <span key={i} className={`strip-dot strike ${i < state.strikes ? "active" : ""}`} />
          ))}
        </div>
        <div className="strip-bso-group" data-testid="bso-outs" data-count={state.outs}>
          <span className="strip-bso-label">O</span>
          {[0, 1, 2].map(i => (
            <span key={i} className={`strip-dot out ${i < state.outs ? "active" : ""}`} />
          ))}
        </div>
      </div>

      {/* Utility icons: edit scores, pitch count, lineups */}
      <div className="strip-utils">
        <span className="strip-pitch-count" data-testid="pitch-count" title="Pitch count">
          {pitchCount}
        </span>
        {scoringMode === "advanced" && (
          <button
            className="strip-icon-btn"
            onClick={onEditLineups}
            data-testid="btn-lineups"
            title="Edit lineups"
          >
            ⚙
          </button>
        )}
      </div>

      {/* Matchup bar — Advanced mode only, shown below main strip */}
      {scoringMode === "advanced" && currentBatter && (
        <div className="strip-matchup">
          <span className="matchup-batter" data-testid="matchup-batter">
            <span className="matchup-label">AB</span>
            #{currentBatter.number} {currentBatter.name}
          </span>
          {currentPitcher && (
            <span className="matchup-pitcher" data-testid="matchup-pitcher">
              <span className="matchup-label">P</span>
              #{currentPitcher.number} {currentPitcher.name}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ScoreStrip;
