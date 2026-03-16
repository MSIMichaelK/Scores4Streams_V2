/**
 * BaseballField — Full field view with fielder positions and interactive bases.
 *
 * Renders an SVG baseball field (outfield arc, foul lines, infield diamond)
 * with 9 fielder position markers and tappable bases for runner moves.
 */
import { getPlayerById } from "../utils/rosterHelpers";

// Standard fielder positions in SVG coordinates (viewBox 0 0 300 300)
// Field is oriented with home plate at bottom-center
const FIELDER_COORDS = {
  P:  { x: 150, y: 185 },
  C:  { x: 150, y: 265 },
  "1B": { x: 215, y: 185 },
  "2B": { x: 175, y: 150 },
  SS: { x: 125, y: 150 },
  "3B": { x: 85, y: 185 },
  LF: { x: 55, y: 95 },
  CF: { x: 150, y: 55 },
  RF: { x: 245, y: 95 },
};

// Base positions in SVG coordinates
const BASE_COORDS = {
  first:  { x: 200, y: 200 },
  second: { x: 150, y: 155 },
  third:  { x: 100, y: 200 },
  home:   { x: 150, y: 245 },
};

const BASE_SIZE = 14;

function FielderMarker({ position, player }) {
  const coord = FIELDER_COORDS[position];
  if (!coord) return null;

  const label = player
    ? `#${player.number || ""}`
    : position;
  const nameLine = player
    ? (player.lastName || player.name || "").slice(0, 8)
    : "";

  return (
    <g className="fielder-marker">
      <circle cx={coord.x} cy={coord.y} r={13} fill="rgba(74, 144, 217, 0.25)" stroke="#4a90d9" strokeWidth={1.5} />
      <text x={coord.x} y={coord.y + 1} textAnchor="middle" dominantBaseline="central"
        fontSize={player ? 9 : 10} fontWeight="700" fill="#4a90d9">
        {label}
      </text>
      {nameLine && (
        <text x={coord.x} y={coord.y + 16} textAnchor="middle"
          fontSize={7.5} fontWeight="500" fill="#a0a0b0">
          {nameLine}
        </text>
      )}
    </g>
  );
}

function BaseDiamond({ base, occupied, selected, isTarget, runnerLabel, onTap }) {
  const coord = BASE_COORDS[base];
  const isHome = base === "home";
  const half = BASE_SIZE / 2;

  // Diamond shape rotated 45deg
  const points = `${coord.x},${coord.y - half} ${coord.x + half},${coord.y} ${coord.x},${coord.y + half} ${coord.x - half},${coord.y}`;

  let fill = "transparent";
  let stroke = "#a0a0b0";
  if (selected) {
    fill = "#f39c12";
    stroke = "#f39c12";
  } else if (occupied) {
    fill = "#f1c40f";
    stroke = "#f1c40f";
  } else if (isHome && isTarget) {
    fill = "transparent";
    stroke = "#f1c40f";
  }

  return (
    <g>
      <polygon
        points={points}
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
        style={{ cursor: onTap ? "pointer" : "default" }}
        onClick={onTap}
      />
      {/* Touch target — larger invisible hit area for mobile */}
      {onTap && (
        <circle
          cx={coord.x} cy={coord.y} r={20}
          fill="transparent"
          style={{ cursor: "pointer" }}
          onClick={onTap}
        />
      )}
      {occupied && runnerLabel && (
        <text
          x={base === "third" ? coord.x - 18 : base === "first" ? coord.x + 18 : coord.x}
          y={base === "second" ? coord.y - 16 : coord.y + 20}
          textAnchor={base === "third" ? "end" : base === "first" ? "start" : "middle"}
          fontSize={8} fontWeight="600" fill="#f1c40f"
          style={{ pointerEvents: "none" }}
        >
          {runnerLabel}
        </text>
      )}
    </g>
  );
}

const BaseballField = ({ state, selectedRunner, onBaseTap, onDeselect }) => {
  // Fielding team roster (opposite of batting team)
  const fieldingRoster = state.isTop ? state.homeRoster : state.awayRoster;

  // Build a position → player map from the fielding roster
  const fielderMap = {};
  if (fieldingRoster) {
    for (const player of fieldingRoster) {
      if (player.position && FIELDER_COORDS[player.position]) {
        fielderMap[player.position] = player;
      }
    }
  }

  // Runner labels
  const getRunnerLabel = (base) => {
    if (!state.runners[base] || !state.runnerIdentity?.[base]) return null;
    const p = getPlayerById(state, state.runnerIdentity[base]);
    if (!p) return null;
    return `#${p.number} ${p.lastName || p.name}`;
  };

  return (
    <div className="field-container" onClick={(e) => {
      if (e.target === e.currentTarget && onDeselect) onDeselect();
    }}>
      <svg viewBox="0 0 300 300" className="baseball-field-svg" onClick={(e) => {
        // Deselect when tapping empty field area
        if (e.target.tagName === "rect" && onDeselect) onDeselect();
      }}>
        {/* Grass background */}
        <rect x="0" y="0" width="300" height="300" fill="#1a3a1a" rx="8" />

        {/* Outfield arc */}
        <path
          d="M 10,245 Q 10,20 150,20 Q 290,20 290,245"
          fill="#1e4a1e"
          stroke="#2a5a2a"
          strokeWidth={2}
        />

        {/* Infield dirt */}
        <path
          d="M 100,200 L 150,155 L 200,200 L 150,245 Z"
          fill="#3a2a1a"
          stroke="#5a4a3a"
          strokeWidth={1}
        />

        {/* Infield diamond outline */}
        <path
          d="M 100,200 L 150,155 L 200,200 L 150,245 Z"
          fill="none"
          stroke="#6a5a4a"
          strokeWidth={1.5}
        />

        {/* Pitcher's mound */}
        <circle cx={150} cy={195} r={5} fill="#4a3a2a" stroke="#6a5a4a" strokeWidth={1} />

        {/* Foul lines */}
        <line x1="150" y1="245" x2="10" y2="95" stroke="#6a5a4a" strokeWidth={1} strokeDasharray="4,4" />
        <line x1="150" y1="245" x2="290" y2="95" stroke="#6a5a4a" strokeWidth={1} strokeDasharray="4,4" />

        {/* Base paths (connecting lines) */}
        <line x1={BASE_COORDS.home.x} y1={BASE_COORDS.home.y} x2={BASE_COORDS.first.x} y2={BASE_COORDS.first.y}
          stroke="#6a5a4a" strokeWidth={1.5} />
        <line x1={BASE_COORDS.first.x} y1={BASE_COORDS.first.y} x2={BASE_COORDS.second.x} y2={BASE_COORDS.second.y}
          stroke="#6a5a4a" strokeWidth={1.5} />
        <line x1={BASE_COORDS.second.x} y1={BASE_COORDS.second.y} x2={BASE_COORDS.third.x} y2={BASE_COORDS.third.y}
          stroke="#6a5a4a" strokeWidth={1.5} />
        <line x1={BASE_COORDS.third.x} y1={BASE_COORDS.third.y} x2={BASE_COORDS.home.x} y2={BASE_COORDS.home.y}
          stroke="#6a5a4a" strokeWidth={1.5} />

        {/* Fielder position markers */}
        {Object.keys(FIELDER_COORDS).map((pos) => (
          <FielderMarker
            key={pos}
            position={pos}
            player={fielderMap[pos] || null}
          />
        ))}

        {/* Bases (interactive) */}
        <BaseDiamond
          base="second"
          occupied={state.runners.second}
          selected={selectedRunner === "second"}
          runnerLabel={getRunnerLabel("second")}
          onTap={() => onBaseTap("second")}
        />
        <BaseDiamond
          base="third"
          occupied={state.runners.third}
          selected={selectedRunner === "third"}
          runnerLabel={getRunnerLabel("third")}
          onTap={() => onBaseTap("third")}
        />
        <BaseDiamond
          base="first"
          occupied={state.runners.first}
          selected={selectedRunner === "first"}
          runnerLabel={getRunnerLabel("first")}
          onTap={() => onBaseTap("first")}
        />
        <BaseDiamond
          base="home"
          occupied={false}
          isTarget={!!selectedRunner}
          onTap={selectedRunner ? () => onBaseTap("home") : undefined}
        />
      </svg>
    </div>
  );
};

export default BaseballField;
