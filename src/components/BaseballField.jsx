/**
 * BaseballField — Full field view with fielder positions and interactive bases.
 *
 * Renders an SVG baseball field (outfield arc, foul lines, infield diamond)
 * with 9 fielder position markers and tappable bases for runner moves.
 */
import { getPlayerById } from "../utils/rosterHelpers";

// Standard fielder positions in SVG coordinates (viewBox -20 -30 340 340)
// Field is oriented with home plate at bottom-center
// Fielders are positioned well clear of base touch targets
const FIELDER_COORDS = {
  P:  { x: 150, y: 200 },
  C:  { x: 150, y: 295 },
  "1B": { x: 268, y: 158 },
  "2B": { x: 195, y: 78 },
  SS: { x: 105, y: 78 },
  "3B": { x: 32, y: 158 },
  LF: { x: 25, y: 30 },
  CF: { x: 150, y: -5 },
  RF: { x: 275, y: 30 },
};

// Base positions in SVG coordinates — diamond sized at ~55% of viewBox height
const BASE_COORDS = {
  first:  { x: 235, y: 185 },
  second: { x: 150, y: 100 },
  third:  { x: 65, y: 185 },
  home:   { x: 150, y: 270 },
};

const BASE_SIZE = 18;

function FielderMarker({ position, player }) {
  const coord = FIELDER_COORDS[position];
  if (!coord) return null;

  const isPlaceholder = player?.id?.startsWith("placeholder-");
  const label = !player || isPlaceholder
    ? position
    : (player.number ? `#${player.number}` : position);
  const nameLine = player && !isPlaceholder
    ? (player.lastName || player.name || "").slice(0, 8)
    : "";

  return (
    <g className="fielder-marker" style={{ pointerEvents: "none" }}>
      <circle cx={coord.x} cy={coord.y} r={13} fill="rgba(74, 144, 217, 0.25)" stroke="#4a90d9" strokeWidth={1.5} />
      <text x={coord.x} y={coord.y + 1} textAnchor="middle" dominantBaseline="central"
        fontSize={player ? 9 : 10} fontWeight="700" fill="#4a90d9">
        {label}
      </text>
      {nameLine && (
        <text x={coord.x} y={coord.y + 16} textAnchor="middle"
          fontSize={9} fontWeight="500" fill="#a0a0b0">
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
      {/* Touch target — larger invisible hit area for mobile (WCAG 44px minimum) */}
      {onTap && (
        <circle
          cx={coord.x} cy={coord.y} r={28}
          fill="transparent"
          style={{ cursor: "pointer" }}
          onClick={onTap}
        />
      )}
      {occupied && runnerLabel && (
        <text
          x={base === "third" ? coord.x - 22 : base === "first" ? coord.x + 22 : coord.x}
          y={base === "second" ? coord.y - 20 : coord.y + 24}
          textAnchor={base === "third" ? "end" : base === "first" ? "start" : "middle"}
          fontSize={11} fontWeight="600" fill="#f1c40f"
          style={{ pointerEvents: "none" }}
        >
          {runnerLabel}
        </text>
      )}
    </g>
  );
}

// Default placeholder roster — shows positions when no lineup is set
const PLACEHOLDER_ROSTER = Object.keys(FIELDER_COORDS).map((pos, i) => ({
  id: `placeholder-${pos}`,
  number: String(i + 1),
  firstName: "",
  lastName: pos,
  name: pos,
  position: pos,
  battingOrder: i + 1,
}));

const BaseballField = ({ state, selectedRunner, onBaseTap, onDeselect }) => {
  // Fielding team roster (opposite of batting team), fall back to placeholders
  const fieldingRoster = (state.isTop ? state.homeRoster : state.awayRoster) || PLACEHOLDER_ROSTER;

  // Build a position → player map from the fielding roster
  const fielderMap = {};
  for (const player of fieldingRoster) {
    if (player.position && FIELDER_COORDS[player.position]) {
      fielderMap[player.position] = player;
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
      <svg viewBox="-20 -30 340 340" preserveAspectRatio="xMidYMax slice" className="baseball-field-svg" onClick={(e) => {
        // Deselect when tapping empty field area
        if (e.target.tagName === "rect" && onDeselect) onDeselect();
      }}>
        {/* Grass background — covers expanded viewBox */}
        <rect x="-20" y="-30" width="340" height="340" fill="#1a3a1a" rx="8" />

        {/* Outfield arc */}
        <path
          d="M 10,255 Q 10,-5 150,-15 Q 290,-5 290,255"
          fill="#1e4a1e"
          stroke="#2a5a2a"
          strokeWidth={2}
        />

        {/* Infield dirt */}
        <path
          d={`M ${BASE_COORDS.third.x},${BASE_COORDS.third.y} L ${BASE_COORDS.second.x},${BASE_COORDS.second.y} L ${BASE_COORDS.first.x},${BASE_COORDS.first.y} L ${BASE_COORDS.home.x},${BASE_COORDS.home.y} Z`}
          fill="#3a2a1a"
          stroke="#5a4a3a"
          strokeWidth={1}
        />

        {/* Infield diamond outline */}
        <path
          d={`M ${BASE_COORDS.third.x},${BASE_COORDS.third.y} L ${BASE_COORDS.second.x},${BASE_COORDS.second.y} L ${BASE_COORDS.first.x},${BASE_COORDS.first.y} L ${BASE_COORDS.home.x},${BASE_COORDS.home.y} Z`}
          fill="none"
          stroke="#6a5a4a"
          strokeWidth={1.5}
        />

        {/* Pitcher's mound */}
        <circle cx={150} cy={200} r={6} fill="#4a3a2a" stroke="#6a5a4a" strokeWidth={1} />

        {/* Foul lines */}
        <line x1="150" y1="270" x2="10" y2="50" stroke="#6a5a4a" strokeWidth={1} strokeDasharray="4,4" />
        <line x1="150" y1="270" x2="290" y2="50" stroke="#6a5a4a" strokeWidth={1} strokeDasharray="4,4" />

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
        <g data-testid="base-second">
          <BaseDiamond
            base="second"
            occupied={state.runners.second}
            selected={selectedRunner === "second"}
            runnerLabel={getRunnerLabel("second")}
            onTap={() => onBaseTap("second")}
          />
        </g>
        <g data-testid="base-third">
          <BaseDiamond
            base="third"
            occupied={state.runners.third}
            selected={selectedRunner === "third"}
            runnerLabel={getRunnerLabel("third")}
            onTap={() => onBaseTap("third")}
          />
        </g>
        <g data-testid="base-first">
          <BaseDiamond
            base="first"
            occupied={state.runners.first}
            selected={selectedRunner === "first"}
            runnerLabel={getRunnerLabel("first")}
            onTap={() => onBaseTap("first")}
          />
        </g>
        <g data-testid="base-home">
          <BaseDiamond
            base="home"
            occupied={false}
            isTarget={!!selectedRunner}
            onTap={() => onBaseTap("home")}
          />
        </g>
      </svg>
    </div>
  );
};

export default BaseballField;
