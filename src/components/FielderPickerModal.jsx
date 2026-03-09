import { useState } from "react";

/**
 * 3x3 position grid for building fielder play chains.
 * Tap fielders in order (e.g., 6 → 4 → 3 for a DP).
 *
 * Props:
 *   title     - e.g. "Ground Out", "Double Play"
 *   onConfirm - (positions: number[]) => void
 *   onCancel  - () => void
 *   minPositions - minimum positions required (default 0)
 *   maxPositions - maximum positions allowed (default 5)
 */

const POSITIONS = [
  { num: 7, label: "LF" },
  { num: 8, label: "CF" },
  { num: 9, label: "RF" },
  { num: 4, label: "2B" },
  { num: 5, label: "3B" },
  { num: 6, label: "SS" },
  { num: 1, label: "P" },
  { num: 2, label: "C" },
  { num: 3, label: "1B" },
];

const FielderPickerModal = ({
  title = "Select Fielders",
  onConfirm,
  onCancel,
  minPositions = 0,
  maxPositions = 5,
}) => {
  const [chain, setChain] = useState([]);

  const handleTap = (num) => {
    if (chain.length >= maxPositions) return;
    setChain((prev) => [...prev, num]);
  };

  const handleBackspace = () => {
    setChain((prev) => prev.slice(0, -1));
  };

  const handleConfirm = () => {
    onConfirm(chain.length > 0 ? chain : null);
  };

  const handleSkip = () => {
    onConfirm(null);
  };

  const chainDisplay = chain.length > 0 ? chain.join("-") : "—";

  return (
    <div className="picker-overlay" onClick={onCancel}>
      <div className="picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="picker-title">{title}</div>
        <div className="picker-chain">
          <span className="picker-chain-text">{chainDisplay}</span>
          {chain.length > 0 && (
            <button className="picker-backspace" onClick={handleBackspace}>
              &larr;
            </button>
          )}
        </div>
        <div className="fielder-grid">
          {POSITIONS.map(({ num, label }) => (
            <button
              key={num}
              className={`fielder-btn ${chain.includes(num) ? "selected" : ""}`}
              onClick={() => handleTap(num)}
            >
              <span className="fielder-num">{num}</span>
              <span className="fielder-label">{label}</span>
            </button>
          ))}
        </div>
        <div className="picker-actions">
          {minPositions === 0 && (
            <button className="picker-btn picker-skip" onClick={handleSkip}>
              Skip
            </button>
          )}
          <button className="picker-btn picker-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="picker-btn picker-confirm"
            onClick={handleConfirm}
            disabled={chain.length < minPositions}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default FielderPickerModal;
