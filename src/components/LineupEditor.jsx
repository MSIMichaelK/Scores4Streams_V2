import { useState, useCallback, useMemo } from "react";
import { POSITIONS as VALID_POSITIONS } from "../utils/rosterHelpers";
import { getActivePlayers } from "../hooks/useTeamRoster";

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

function createEmptyPlayer(battingOrder, playerId = null) {
  return {
    id: generateId(),
    playerId: playerId || null,
    firstName: "",
    lastName: "",
    name: "",
    number: "",
    battingOrder,
    position: "",
  };
}

/** Split existing name into first/last for backward compat with old rosters */
function splitName(name) {
  if (!name) return { firstName: "", lastName: "" };
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return { firstName: parts[0] || "", lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

const LineupEditor = ({ teamName = "Team", teamId = null, roster, onSave, onCancel }) => {
  const [importLoading, setImportLoading] = useState(false);

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
      // Backward compat: split name into first/last if not already split
      return sorted.map((p) => {
        if (p.firstName !== undefined) return p;
        const { firstName, lastName } = splitName(p.name);
        return { ...p, firstName, lastName };
      });
    }
    return Array.from({ length: 9 }, (_, i) => createEmptyPlayer(i + 1));
  });

  const updatePlayer = useCallback((index, field, value) => {
    setPlayers((prev) => {
      const next = [...prev];
      const updated = { ...next[index], [field]: value };
      // Sync combined name when first/last changes
      if (field === "firstName" || field === "lastName") {
        const first = field === "firstName" ? value : updated.firstName || "";
        const last = field === "lastName" ? value : updated.lastName || "";
        updated.name = `${first} ${last}`.trim();
      }
      next[index] = updated;
      return next;
    });
  }, []);

  // Track which positions are already taken (for duplicate warnings)
  const usedPositions = useMemo(() => {
    const counts = {};
    for (const p of players) {
      if (p.position && p.position !== "") {
        counts[p.position] = (counts[p.position] || 0) + 1;
      }
    }
    return counts;
  }, [players]);

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
    // Check for duplicate positions (excluding EH/DH which can have multiples)
    const dupePositions = Object.entries(usedPositions)
      .filter(([pos, count]) => count > 1 && pos !== "EH" && pos !== "DH")
      .map(([pos]) => pos);
    if (dupePositions.length > 0) {
      alert(`Duplicate positions: ${dupePositions.join(", ")}. Each fielding position can only be assigned to one player.`);
      return;
    }
    // Auto-fix: if name was entered in firstName only, treat as lastName for display
    for (const p of filled) {
      if (!(p.lastName || "").trim() && (p.firstName || "").trim()) {
        p.lastName = p.firstName;
        p.firstName = "";
        p.name = p.lastName;
      }
    }
    // Find the pitcher
    const pitcher = filled.find((p) => p.position === "P");
    onSave(filled, pitcher?.id || null);
  };

  const lineupPlayers = players.filter((p) => p.battingOrder > 0);
  const subs = players.filter((p) => p.battingOrder === 0);
  const hasDPFlex = players.some((p) => p.position === "DP" || p.position === "FLEX");

  const handleImportFromTeamRoster = async () => {
    if (!teamId) return;
    setImportLoading(true);
    try {
      const teamPlayers = await getActivePlayers(teamId);
      if (teamPlayers.length === 0) {
        alert("No players found on team roster. Add players in Settings first.");
        return;
      }
      // Map persistent players into game roster format with playerId link
      const imported = teamPlayers.map((tp, i) => ({
        id: generateId(), // per-game UUID stays unique
        playerId: tp.id,  // link back to persistent player
        firstName: tp.firstName || "",
        lastName: tp.lastName || "",
        name: tp.name || `${tp.firstName || ""} ${tp.lastName || ""}`.trim(),
        number: tp.number || "",
        battingOrder: i + 1,
        position: "",
      }));
      setPlayers(imported);
    } catch (err) {
      alert("Failed to load team roster");
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="lineup-editor">
      <div className="lineup-header">
        <button className="lineup-back-btn" onClick={onCancel} data-testid="le-btn-back">
          &larr;
        </button>
        <h2>{teamName} Lineup</h2>
        <button className="lineup-save-btn" onClick={handleSave} data-testid="le-btn-save">
          Done
        </button>
      </div>

      {teamId && (
        <div style={{ padding: "0 12px 8px", textAlign: "center" }}>
          <button
            className="btn-secondary btn-small"
            onClick={handleImportFromTeamRoster}
            disabled={importLoading}
            data-testid="le-btn-import"
          >
            {importLoading ? "Loading..." : "Import from Team Roster"}
          </button>
        </div>
      )}

      <div className="lineup-list">
        {/* Batting order players */}
        {lineupPlayers.map((player) => {
          const idx = players.indexOf(player);
          const isDupePos = player.position && usedPositions[player.position] > 1
            && player.position !== "EH" && player.position !== "DH";
          return (
            <div key={player.id} className="lineup-row" data-testid={`le-row-${player.battingOrder}`}>
              <span className="lineup-order">#{player.battingOrder}</span>
              <input
                className="lineup-firstname-input"
                type="text"
                placeholder="First"
                value={player.firstName || ""}
                onChange={(e) => updatePlayer(idx, "firstName", e.target.value)}
                data-testid={`le-input-firstname-${player.battingOrder}`}
              />
              <input
                className="lineup-lastname-input"
                type="text"
                placeholder="Last"
                value={player.lastName || ""}
                onChange={(e) => updatePlayer(idx, "lastName", e.target.value)}
                data-testid={`le-input-lastname-${player.battingOrder}`}
              />
              <input
                className="lineup-number-input"
                type="text"
                placeholder="##"
                value={player.number}
                onChange={(e) => updatePlayer(idx, "number", e.target.value)}
                maxLength={3}
                data-testid={`le-input-number-${player.battingOrder}`}
              />
              <select
                className={`lineup-pos-select${isDupePos ? " lineup-pos-dupe" : ""}`}
                value={player.position}
                onChange={(e) => updatePlayer(idx, "position", e.target.value)}
                data-testid={`le-select-position-${player.battingOrder}`}
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
              const isDupePos = player.position && usedPositions[player.position] > 1
                && player.position !== "EH" && player.position !== "DH";
              return (
                <div key={player.id} className="lineup-row lineup-row-sub">
                  <span className="lineup-order">SUB</span>
                  <input
                    className="lineup-firstname-input"
                    type="text"
                    placeholder="First"
                    value={player.firstName || ""}
                    onChange={(e) => updatePlayer(idx, "firstName", e.target.value)}
                  />
                  <input
                    className="lineup-lastname-input"
                    type="text"
                    placeholder="Last"
                    value={player.lastName || ""}
                    onChange={(e) => updatePlayer(idx, "lastName", e.target.value)}
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
                    className={`lineup-pos-select${isDupePos ? " lineup-pos-dupe" : ""}`}
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
        <button className="lineup-add-btn" onClick={addPlayer} data-testid="le-btn-add-sub">
          + Add Sub
        </button>
        {!hasDPFlex && (
          <button className="lineup-add-btn" onClick={addDPFlex} data-testid="le-btn-add-dp">
            + Add DP/FLEX
          </button>
        )}
      </div>
    </div>
  );
};

export default LineupEditor;
