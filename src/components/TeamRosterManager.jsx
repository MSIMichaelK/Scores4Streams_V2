import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getActivePlayers, getAllPlayers, addPlayer, updatePlayer, deactivatePlayer, reactivatePlayer } from "../hooks/useTeamRoster";

const TeamRosterManager = ({ teamId, onClose }) => {
  const { tenantId } = useAuth();
  const effectiveTeamId = teamId || tenantId;

  const [players, setPlayers] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null); // playerId or null
  const [form, setForm] = useState({ firstName: "", lastName: "", number: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadPlayers = async () => {
    if (!effectiveTeamId) {
      setError(null);
      setPlayers([]);
      setLoading(false);
      return;
    }
    try {
      const list = showInactive
        ? await getAllPlayers(effectiveTeamId)
        : await getActivePlayers(effectiveTeamId);
      // Sort by number (numeric if possible), then by name
      list.sort((a, b) => {
        const numA = parseInt(a.number, 10);
        const numB = parseInt(b.number, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return (a.name || "").localeCompare(b.name || "");
      });
      setPlayers(list);
      setError(null);
    } catch (err) {
      console.error("Failed to load roster:", err);
      setError("Could not load roster. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveTeamId) loadPlayers();
  }, [effectiveTeamId, showInactive]);

  const handleAdd = async () => {
    setError(null);
    if (!form.lastName.trim()) {
      setError("Last name is required");
      return;
    }
    try {
      await addPlayer(effectiveTeamId, form);
      setForm({ firstName: "", lastName: "", number: "" });
      setAdding(false);
      await loadPlayers();
    } catch (err) {
      setError("Failed to add player");
    }
  };

  const handleUpdate = async () => {
    setError(null);
    if (!form.lastName.trim()) {
      setError("Last name is required");
      return;
    }
    try {
      await updatePlayer(effectiveTeamId, editing, {
        firstName: form.firstName,
        lastName: form.lastName,
        number: form.number,
      });
      setEditing(null);
      setForm({ firstName: "", lastName: "", number: "" });
      await loadPlayers();
    } catch (err) {
      setError("Failed to update player");
    }
  };

  const handleDeactivate = async (playerId) => {
    try {
      await deactivatePlayer(effectiveTeamId, playerId);
      await loadPlayers();
    } catch (err) {
      setError("Failed to deactivate player");
    }
  };

  const handleReactivate = async (playerId) => {
    try {
      await reactivatePlayer(effectiveTeamId, playerId);
      await loadPlayers();
    } catch (err) {
      setError("Failed to reactivate player");
    }
  };

  const startEdit = (player) => {
    setEditing(player.id);
    setForm({
      firstName: player.firstName || "",
      lastName: player.lastName || "",
      number: player.number || "",
    });
    setAdding(false);
  };

  if (loading) return <div style={{ padding: 16 }}>Loading roster...</div>;

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>Team Roster</h3>
        {onClose && (
          <button className="btn-small" onClick={onClose}>Close</button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <input
          type="checkbox"
          checked={showInactive}
          onChange={(e) => setShowInactive(e.target.checked)}
          data-testid="trm-toggle-inactive"
        />
        Show inactive players
      </label>

      {players.length === 0 ? (
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>No players yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {players.map((p) => (
            <li
              key={p.id}
              data-testid={`trm-player-${p.id}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 0",
                borderBottom: "1px solid var(--border-color, #333)",
                opacity: p.active === false ? 0.5 : 1,
              }}
            >
              <span style={{ fontSize: 14 }}>
                {p.number && <strong>#{p.number}</strong>} {p.name}
              </span>
              <div style={{ display: "flex", gap: 4 }}>
                <button className="btn-small" onClick={() => startEdit(p)} style={{ fontSize: 11, padding: "2px 6px" }} data-testid={`trm-btn-edit-${p.id}`}>
                  Edit
                </button>
                {p.active !== false ? (
                  <button className="btn-small btn-danger" onClick={() => handleDeactivate(p.id)} style={{ fontSize: 11, padding: "2px 6px" }} data-testid={`trm-btn-deactivate-${p.id}`}>
                    Remove
                  </button>
                ) : (
                  <button className="btn-small" onClick={() => handleReactivate(p.id)} style={{ fontSize: 11, padding: "2px 6px" }} data-testid={`trm-btn-reactivate-${p.id}`}>
                    Restore
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {(adding || editing) && (
        <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "flex-end" }}>
          <input
            placeholder="First"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            style={{ width: 80 }}
            data-testid="trm-input-firstname"
          />
          <input
            placeholder="Last *"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            style={{ width: 100 }}
            data-testid="trm-input-lastname"
          />
          <input
            placeholder="#"
            value={form.number}
            onChange={(e) => setForm({ ...form, number: e.target.value })}
            style={{ width: 40 }}
            data-testid="trm-input-number"
          />
          <button className="btn-primary btn-small" onClick={editing ? handleUpdate : handleAdd} data-testid="trm-btn-save">
            {editing ? "Save" : "Add"}
          </button>
          <button className="btn-small" onClick={() => { setAdding(false); setEditing(null); setForm({ firstName: "", lastName: "", number: "" }); }} data-testid="trm-btn-cancel">
            Cancel
          </button>
        </div>
      )}

      {!adding && !editing && (
        <button
          className="btn-secondary btn-small"
          onClick={() => { setAdding(true); setEditing(null); setForm({ firstName: "", lastName: "", number: "" }); }}
          style={{ marginTop: 8 }}
          data-testid="trm-btn-add"
        >
          + Add Player
        </button>
      )}
    </div>
  );
};

export default TeamRosterManager;
