import { useMemo, useState } from "react";
import { computeGameStats, formatIP } from "../utils/statsEngine";

/**
 * GameStats — collapsible game statistics panel.
 * Shows team batting/pitching summary and per-player breakdowns (when rosters exist).
 */
const GameStats = ({ events, homeRoster, awayRoster, homeTeamName, awayTeamName }) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("batting"); // "batting" | "pitching"

  const stats = useMemo(
    () => computeGameStats(events || [], homeRoster, awayRoster),
    [events, homeRoster, awayRoster]
  );

  if (!expanded) {
    return (
      <div className="game-stats">
        <button className="stats-toggle" onClick={() => setExpanded(true)}>
          ▶ Game Stats
        </button>
      </div>
    );
  }

  const hasPlayerStats = stats.home.players || stats.away.players;

  return (
    <div className="game-stats">
      <button className="stats-toggle" onClick={() => setExpanded(false)}>
        ▼ Game Stats
      </button>

      {/* Tab bar */}
      <div className="stats-tabs">
        <button
          className={`stats-tab ${activeTab === "batting" ? "active" : ""}`}
          onClick={() => setActiveTab("batting")}
        >
          Batting
        </button>
        <button
          className={`stats-tab ${activeTab === "pitching" ? "active" : ""}`}
          onClick={() => setActiveTab("pitching")}
        >
          Pitching
        </button>
      </div>

      {activeTab === "batting" && (
        <div className="stats-content">
          <TeamBattingSummary
            label={awayTeamName || "Away"}
            batting={stats.away.batting}
          />
          <TeamBattingSummary
            label={homeTeamName || "Home"}
            batting={stats.home.batting}
          />

          {/* Per-player batting tables */}
          {hasPlayerStats && (
            <>
              {stats.away.players && (
                <PlayerBattingTable
                  label={awayTeamName || "Away"}
                  players={stats.away.players.batting}
                />
              )}
              {stats.home.players && (
                <PlayerBattingTable
                  label={homeTeamName || "Home"}
                  players={stats.home.players.batting}
                />
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "pitching" && (
        <div className="stats-content">
          <TeamPitchingSummary
            label={awayTeamName || "Away"}
            pitching={stats.away.pitching}
          />
          <TeamPitchingSummary
            label={homeTeamName || "Home"}
            pitching={stats.home.pitching}
          />

          {/* Per-player pitching tables */}
          {hasPlayerStats && (
            <>
              {stats.away.players?.pitching?.length > 0 && (
                <PlayerPitchingTable
                  label={awayTeamName || "Away"}
                  players={stats.away.players.pitching}
                />
              )}
              {stats.home.players?.pitching?.length > 0 && (
                <PlayerPitchingTable
                  label={homeTeamName || "Home"}
                  players={stats.home.players.pitching}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Sub-components ─────────────────────────────────────────────

function TeamBattingSummary({ label, batting }) {
  return (
    <div className="stats-summary">
      <div className="stats-summary-label">{label}</div>
      <div className="stats-summary-line">
        <span>{batting.AB} AB</span>
        <span>{batting.H} H</span>
        <span>{batting.HR} HR</span>
        <span>{batting.R} R</span>
        <span>{batting.BB} BB</span>
        <span>{batting.K} K</span>
        <span>{fmtAvg(batting.BA)} BA</span>
      </div>
    </div>
  );
}

function TeamPitchingSummary({ label, pitching }) {
  return (
    <div className="stats-summary">
      <div className="stats-summary-label">{label}</div>
      <div className="stats-summary-line">
        <span>{pitching.IP} IP</span>
        <span>{pitching.H} H</span>
        <span>{pitching.R} R</span>
        <span>{pitching.BB} BB</span>
        <span>{pitching.K} K</span>
        <span>{pitching.pitches} P</span>
        <span>{pitching.ERA.toFixed(2)} ERA</span>
      </div>
    </div>
  );
}

function PlayerBattingTable({ label, players }) {
  // Only show players with at least 1 PA
  const active = players.filter((p) => p.PA > 0);
  if (active.length === 0) return null;

  return (
    <div className="stats-table-wrapper">
      <div className="stats-table-label">{label} Batting</div>
      <div className="stats-table-scroll">
        <table className="stats-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>AB</th>
              <th>R</th>
              <th>H</th>
              <th>2B</th>
              <th>3B</th>
              <th>HR</th>
              <th>RBI</th>
              <th>BB</th>
              <th>K</th>
              <th>BA</th>
              <th>OBP</th>
              <th>SLG</th>
            </tr>
          </thead>
          <tbody>
            {active.map((p) => (
              <tr key={p.playerId}>
                <td>{p.number}</td>
                <td className="stats-name">{p.name}</td>
                <td>{p.AB}</td>
                <td>{p.R}</td>
                <td>{p.H}</td>
                <td>{p["2B"]}</td>
                <td>{p["3B"]}</td>
                <td>{p.HR}</td>
                <td>{p.RBI}</td>
                <td>{p.BB}</td>
                <td>{p.K}</td>
                <td>{fmtAvg(p.BA)}</td>
                <td>{fmtAvg(p.OBP)}</td>
                <td>{fmtAvg(p.SLG)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlayerPitchingTable({ label, players }) {
  return (
    <div className="stats-table-wrapper">
      <div className="stats-table-label">{label} Pitching</div>
      <div className="stats-table-scroll">
        <table className="stats-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>IP</th>
              <th>H</th>
              <th>R</th>
              <th>ER</th>
              <th>BB</th>
              <th>K</th>
              <th>WP</th>
              <th>P</th>
              <th>ERA</th>
              <th>WHIP</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.playerId}>
                <td>{p.number}</td>
                <td className="stats-name">{p.name}</td>
                <td>{p.IP}</td>
                <td>{p.H}</td>
                <td>{p.R}</td>
                <td>{p.ER}</td>
                <td>{p.BB}</td>
                <td>{p.K}</td>
                <td>{p.WP}</td>
                <td>{p.pitches}</td>
                <td>{p.ERA.toFixed(2)}</td>
                <td>{p.WHIP.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

/** Format a batting average to .000 format. */
function fmtAvg(val) {
  if (val >= 1) return val.toFixed(3);
  return val.toFixed(3).replace(/^0/, "");
}

export default GameStats;
