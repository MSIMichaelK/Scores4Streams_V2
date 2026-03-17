/**
 * Lightweight modal for selecting which runner(s) for base running plays.
 * Used by SB, CS, PK, WP, PB actions.
 *
 * Props:
 *   title     - e.g. "Stolen Base", "Wild Pitch"
 *   runners   - { first: bool, second: bool, third: bool }
 *   onSelect  - (runner: string) => void — "first" | "second" | "third"
 *   onCancel  - () => void
 *   multiSelect - allow selecting multiple runners (for WP/PB)
 *   onMultiSelect - (runners: string[]) => void — for multi-select mode
 */
import { useState } from "react";

const BASES = [
  { key: "third", label: "3B" },
  { key: "second", label: "2B" },
  { key: "first", label: "1B" },
];

const RunnerPickerModal = ({
  title = "Select Runner",
  runners,
  onSelect,
  onCancel,
  multiSelect = false,
  onMultiSelect,
}) => {
  const [selected, setSelected] = useState([]);

  const availableBases = BASES.filter((b) => runners[b.key]);

  const handleTap = (base) => {
    if (multiSelect) {
      setSelected((prev) =>
        prev.includes(base)
          ? prev.filter((b) => b !== base)
          : [...prev, base]
      );
    } else {
      onSelect(base);
    }
  };

  const handleConfirm = () => {
    if (multiSelect && onMultiSelect) {
      onMultiSelect(selected);
    }
  };

  return (
    <div className="picker-overlay" onClick={onCancel}>
      <div className="picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="picker-title">{title}</div>
        {availableBases.length === 0 ? (
          <div className="picker-empty">No runners on base</div>
        ) : (
          <div className="runner-grid">
            {availableBases.map(({ key, label }) => (
              <button
                key={key}
                className={`runner-btn ${
                  multiSelect && selected.includes(key) ? "selected" : ""
                }`}
                onClick={() => handleTap(key)}
                data-testid={`rpm-btn-${key}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <div className="picker-actions">
          <button className="picker-btn picker-cancel" onClick={onCancel} data-testid="rpm-btn-cancel">
            Cancel
          </button>
          {multiSelect && (
            <button
              className="picker-btn picker-confirm"
              onClick={handleConfirm}
              disabled={selected.length === 0}
              data-testid="rpm-btn-confirm"
            >
              Confirm
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RunnerPickerModal;
