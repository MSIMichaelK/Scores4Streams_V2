import { useState } from "react";

/**
 * OutcomePanel — slide-up panel for "In Play" outcomes.
 *
 * Simple mode: 1B, 2B, 3B, HR, Out
 * Advanced mode: hits + expanded outs + plays + base running
 */
const OutcomePanel = ({
  scoringMode,
  hasRunners,
  onHit,
  onOut,
  onAction,
  onOpenFielderPicker,
  onOpenRunnerPicker,
  onClose,
}) => {
  const [showMore, setShowMore] = useState(false);

  // Wrap action handlers to auto-close panel after selection
  const hit = (type) => { onHit(type); onClose(); };
  const out = () => { onOut(); onClose(); };
  const action = (a) => { onAction(a); onClose(); };
  const fielder = (type, title) => { onOpenFielderPicker(type, title); onClose(); };
  const runner = (type, title, multi) => { onOpenRunnerPicker(type, title, multi); onClose(); };

  return (
    <div className="outcome-panel">
      {/* Drag handle */}
      <div className="outcome-handle" />

      {/* Hits — always shown */}
      <div className="outcome-section">
        <div className="outcome-grid outcome-grid-4">
          <button className="outcome-btn hit" onClick={() => hit("Single")} data-testid="btn-1b">1B</button>
          <button className="outcome-btn hit" onClick={() => hit("Double")} data-testid="btn-2b">2B</button>
          <button className="outcome-btn hit" onClick={() => hit("Triple")} data-testid="btn-3b">3B</button>
          <button className="outcome-btn hr" onClick={() => hit("Home Run")} data-testid="btn-hr">HR</button>
        </div>
      </div>

      {/* Simple mode: just Out + Close */}
      {scoringMode === "simple" && (
        <div className="outcome-section">
          <div className="outcome-grid outcome-grid-2">
            <button className="outcome-btn out" onClick={out} data-testid="btn-out">Out</button>
            <button className="outcome-btn close" onClick={onClose}>Cancel</button>
          </div>
        </div>
      )}

      {/* Advanced mode: expanded outs + plays */}
      {scoringMode === "advanced" && (
        <>
          {/* Out types */}
          <div className="outcome-section">
            <div className="outcome-label">Outs</div>
            <div className="outcome-grid outcome-grid-4">
              <button className="outcome-btn out" onClick={() => fielder("ground_out", "Ground Out")} data-testid="btn-go">GO</button>
              <button className="outcome-btn out" onClick={() => fielder("fly_out", "Fly Out")} data-testid="btn-fo">FO</button>
              <button className="outcome-btn out" onClick={() => fielder("line_drive_out", "Line Drive Out")} data-testid="btn-lo">LO</button>
              <button className="outcome-btn out" onClick={() => fielder("popup_out", "Popup Out")} data-testid="btn-po">PO</button>
            </div>
            <div className="outcome-grid outcome-grid-4">
              <button className="outcome-btn out" onClick={() => fielder("double_play", "Double Play")} data-testid="btn-dp">DP</button>
              <button className="outcome-btn out" onClick={() => fielder("triple_play", "Triple Play")} data-testid="btn-tp">TP</button>
              <button className="outcome-btn strike" onClick={() => action({ type: "strikeout_swinging" })} data-testid="btn-k">K</button>
              <button className="outcome-btn strike" onClick={() => action({ type: "strikeout_looking" })} data-testid="btn-kc">KC</button>
            </div>
          </div>

          {/* Plays */}
          <div className="outcome-section">
            <div className="outcome-label">Plays</div>
            <div className="outcome-grid outcome-grid-4">
              <button className="outcome-btn error" onClick={() => fielder("error", "Error")} data-testid="btn-error">E</button>
              <button className="outcome-btn fc" onClick={() => fielder("fc", "Fielder's Choice")} data-testid="btn-fc">FC</button>
              <button className="outcome-btn sacfly" onClick={() => action("sac_fly")} data-testid="btn-sac">SAC-F</button>
              <button className="outcome-btn d3k" onClick={() => action({ type: "dropped_third_strike" })} data-testid="btn-d3k">D3K</button>
            </div>
          </div>

          {/* More plays — expandable */}
          <button
            className="outcome-more-toggle"
            onClick={() => setShowMore(p => !p)}
            data-testid="btn-more-plays"
          >
            {showMore ? "▼" : "▶"} More
          </button>

          {showMore && (
            <>
              <div className="outcome-section">
                <div className="outcome-grid outcome-grid-4">
                  <button className="outcome-btn out" onClick={() => fielder("foul_fly_out", "Foul Fly Out")} data-testid="btn-ff">FF</button>
                  <button className="outcome-btn out" onClick={() => fielder("infield_fly", "Infield Fly")} data-testid="btn-if">IF</button>
                  <button className="outcome-btn int" onClick={() => action({ type: "interference" })} data-testid="btn-int">INT</button>
                  <button className="outcome-btn" onClick={() => { out(); }} data-testid="btn-out-generic">Out</button>
                </div>
              </div>

              <div className="outcome-section">
                <div className="outcome-label">Batting</div>
                <div className="outcome-grid outcome-grid-4">
                  <button className="outcome-btn sacbunt" onClick={() => fielder("sacrifice_bunt", "Sac Bunt")} data-testid="btn-sac-b">SAC-B</button>
                  <button className="outcome-btn bunt" onClick={() => action({ type: "bunt_hit" })} data-testid="btn-bh">BH</button>
                  <button className="outcome-btn bunt" onClick={() => action({ type: "slap_hit" })} data-testid="btn-sl">SL</button>
                  <button className="outcome-btn ibb" onClick={() => action({ type: "intentional_walk" })} data-testid="btn-ibb">IBB</button>
                </div>
                <div className="outcome-grid outcome-grid-3">
                  <button className="outcome-btn obs" onClick={() => action({ type: "obstruction" })} data-testid="btn-obs">OBS</button>
                  <button className="outcome-btn obs" onClick={() => action({ type: "illegal_pitch" })} data-testid="btn-ip">IP</button>
                </div>
              </div>

              {hasRunners && (
                <div className="outcome-section">
                  <div className="outcome-label">Base Running</div>
                  <div className="outcome-grid outcome-grid-3">
                    <button className="outcome-btn sb" onClick={() => runner("stolen_base", "Stolen Base")} data-testid="btn-sb">SB</button>
                    <button className="outcome-btn strike" onClick={() => runner("caught_stealing", "Caught Stealing")} data-testid="btn-cs">CS</button>
                    <button className="outcome-btn strike" onClick={() => runner("pick_off", "Pick Off")} data-testid="btn-pk">PK</button>
                  </div>
                  <div className="outcome-grid outcome-grid-3">
                    <button className="outcome-btn wp" onClick={() => runner("wild_pitch", "Wild Pitch", true)} data-testid="btn-wp">WP</button>
                    <button className="outcome-btn wp" onClick={() => runner("passed_ball", "Passed Ball", true)} data-testid="btn-pb">PB</button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Close button */}
          <button className="outcome-close" onClick={onClose}>✕ Close</button>
        </>
      )}
    </div>
  );
};

export default OutcomePanel;
