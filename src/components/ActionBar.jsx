/**
 * ActionBar — fixed bottom bar with 6 pitch-outcome buttons.
 *
 * Simple mode:  Ball | Called | Swing | Foul | In Play | Out
 * Advanced mode: Ball | Called | Swing | Foul | In Play | HBP
 */
const ActionBar = ({
  scoringMode,
  onBall,
  onStrike,
  onFoul,
  onOut,
  onHBP,
  onInPlay,
  inPlayOpen,
}) => {
  return (
    <div className="action-bar">
      <button
        className="ab-btn ball"
        onClick={onBall}
        data-testid="btn-ball"
      >
        Ball
      </button>
      <button
        className="ab-btn called"
        onClick={onStrike}
        data-testid="btn-strike"
      >
        Called
      </button>
      <button
        className="ab-btn swing"
        onClick={onStrike}
        data-testid="btn-strike-swing"
      >
        Swing
      </button>
      <button
        className="ab-btn foul"
        onClick={onFoul}
        data-testid="btn-foul"
      >
        Foul
      </button>
      <button
        className={`ab-btn in-play ${inPlayOpen ? "active" : ""}`}
        onClick={onInPlay}
        data-testid="btn-in-play"
      >
        In Play
      </button>
      {scoringMode === "advanced" ? (
        <button
          className="ab-btn hbp"
          onClick={onHBP}
          data-testid="btn-hbp"
        >
          HBP
        </button>
      ) : (
        <button
          className="ab-btn out"
          onClick={onOut}
          data-testid="btn-out"
        >
          Out
        </button>
      )}
    </div>
  );
};

export default ActionBar;
