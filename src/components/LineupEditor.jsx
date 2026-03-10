import { useState, useCallback } from "react";
import { POSITIONS as VALID_POSITIONS } from "../utils/rosterHelpers";

/**
 * Full-screen lineup editor for entering a team's batting order.
 * Mobile-first: compact rows with name, number, and position inputs.
 *
 * Props:
 *   teamName  - "Home" or "Away" team name for display
 *   roster    - existing roster array (or null for new)
 *   onSave    - (roster: Player[], pitcherId: string|null) => void
 *   onCancel  - () => void
 */

// Fielding + special positions for the dropdown
const POSITION_OPTIONS = VALID_POSITIONS;

function generateId() {
  // crypto.randomUUID() is available in all modern browsers
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return "p-" + Math.random().toString(36).slice(2, 10);
}

function createEmptyPlayer(battingOrder) {
  return {
    id: generateId(),
    name: "",
    number: "",
    battingOrder,
    position: "",
  };
}

const LineupEditor = ({ teamName = "Team", roster, onSave, onCancel }) => {
  // Initialize with existing roster or 9 empty slots
  const [players, setPlayers] = useState(() => {
    if (roster && roster.length > 0) {
      // Sort: lineup first (by battingOrder), then subs (battingOrder 0)
      const sorted = [...roster].sort((a, b) => {
        if (a.battingOrder === 0 && b.battingOrder === 0) return 0;
        if (a.battingOrder === 0) return 1;
        if (b.battingOrder === 0) return -1;
        return a.battingOrder - b.battingOrder;
      });
      return sorted;
    }
    return Array.from({ length: 9 }, (_, i) => createEmptyPlayer(i + 1));
  });

  const updatePlayer = useCallback((index, field, value) => {
    setPlayers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }, []);

  const addPlayer = useCallback(() => {
    setPlayers((prev) => [...prev, createEmptyPlayer(0)]);
  }, []);

  const addDPFlex = useCallback(() => {
    setPlayers((prev) => {
      // Find next batting order (10 for DP)
      const maxOrder = Math.max(...prev.map((p) => p.battingOrder), 0);
      return [
        ...prev,
        { ...createEmptyPlayer(maxOrder + 1), position: "DP" },
        { ...createEmptyPlayer(0), position: "FLEX" },
      ];
    });
  }, []);

  const removePlayer = useCallback((index) => {
    setPlayers((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = () => {
    // Filter out completely empty rows
    const filled = players.filter(
      (p) => p.name.trim() !== "" || p.number.trim() !== ""
    );
    if (filled.length === 0) {
      alert("Please enter at least one player");
      return;
    }
    // Find the pitcher
    const pitcher = filled.find((p) => p.position === "P");
    onSave(filled, pitcher?.id || null);
  };

  const lineupPlayers = players.filter((p) => p.battingOrder > 0);
  const subs = players.filter((p) => p.battingOrder === 0);
  const hasDPFlex = players.some((p) => p.position === "DP" || p.position === "FLEX");

  return (
    <div className="lineup-editor">
      <div className="lineup-header">
        <button className="lineup-back-btn" onClick={onCancel}>
          &larr;
        </button>
        <h2>{teamName} Lineup</h2>
        <button className="lineup-save-btn" onClick={handleSave}>
          Done
        </button>
      </div>

      <div className="lineup-list">
        {/* Batting order players */}
        {lineupPlayers.map((player) => {
          const idx = players.indexOf(player);
          return (
            <div key={player.id} className="lineup-row">
              <span className="lineup-order">#{player.battingOrder}</span>
              <input
                className="lineup-name-input"
                type="text"
                placeholder="Name"
                value={player.name}
                onChange={(e) => updatePlayer(idx, "name", e.target.value)}
              />
              <input
                className="lineup-number-input"
                type="text"
                placeholder="##"
                value={player.number}
                onChange={(e) => updatePlayer(idx, "number", e.target.value)}
                maxLength={3}
              />
              <select
                className="lineup-pos-select"
                value={player.position}
                onChange={(e) => updatePlayer(idx, "position", e.target.value)}
              >
                <option value="">Pos</option>
                {POSITION_OPTIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>
          );
        })}

        {/* Substitutes section */}
        {subs.length > 0 && (
          <>
            <div className="lineup-section-label">Substitutes</div>
            {subs.map((player) => {
              const idx = players.indexOf(player);
              return (
                <div key={player.id} className="lineup-row lineup-row-sub">
                  <span className="lineup-order">SUB</span>
                  <input
                    className="lineup-name-input"
                    type="text"
                    placeholder="Name"
                    value={player.name}
                    onChange={(e) => updatePlayer(idx, "name", e.target.value)}
                  />
                  <input
                    className="lineup-number-input"
                    type="text"
                    placeholder="##"
                    value={player.number}
                    onChange={(e) => updatePlayer(idx, "number", e.target.value)}
                    maxLength={3}
                  />
                  <select
                    className="lineup-pos-select"
                    value={player.position}
                    onChange={(e) =>
                      updatePlayer(idx, "position", e.target.value)
                    }
                  >
                    <option value="">Pos</option>
                    {POSITION_OPTIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                  <button
                    className="lineup-remove-btn"
                    onClick={() => removePlayer(idx)}
                  >
                    &times;
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>

      <div className="lineup-actions">
        <button className="lineup-add-btn" onClick={addPlayer}>
          + Add Sub
        </button>
        {!hasDPFlex && (
          <button className="lineup-add-btn" onClick={addDPFlex}>
            + Add DP/FLEX
          </button>
        )}
      </div>
    </div>
  );
};

export default LineupEditor;
