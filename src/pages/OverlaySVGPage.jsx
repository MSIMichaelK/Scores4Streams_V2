import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { useFirebase } from "../contexts/FirebaseContext";

const OverlaySVGPage = () => {
  const { gameId } = useParams();
  const { app } = useFirebase();
  const db = getFirestore(app);

  const [gameData, setGameData] = useState(null);
  const [gameTime, setGameTime] = useState(0);

  useEffect(() => {
    if (!gameId) return;
    const unsub = onSnapshot(doc(db, "games", gameId), (docSnap) => {
      if (docSnap.exists()) {
        setGameData(docSnap.data());
      }
    });
    return () => unsub();
  }, [db, gameId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setGameTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!gameData) {
    return <div style={{ color: "white" }}>Loading...</div>;
  }

  const {
    homeScore,
    awayScore,
    homeTeamName,
    awayTeamName,
    balls,
    strikes,
    outs,
    isTop,
    inning,
    runners,
  } = gameData;

  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  // Grid calculations
  const colWidth = 1920 / 12;
  const rowHeight = 1080 / 6;

  // Base dimensions
  const baseSize = 120;
  const baseHalf = baseSize / 2;

  // Manual base layout tuning
  // baseSize = 120, so baseHalf = 60
  // We'll place the diamond center for second base 100px above the group origin,
  // first base 100px to the right, third base 100px to the left

  // Base diamond center point relative to group origin
  // We'll center the diamond shapes around their positions
  // Positions for bases relative to group origin (0,0)
  // We'll define the group origin at (col 7, row 3.7) approx (1100, 400) as before
  // Then bases at offsets:
  // second base: (col 8.25, row 3) -> x=colWidth*8.25 - colWidth*7 = colWidth*1.25, y=rowHeight*3 - rowHeight*3.7 = rowHeight*(-0.7)
  // first base: (col 9.25, row 4.7) -> x=colWidth*9.25 - colWidth*7 = colWidth*2.25, y=rowHeight*4.7 - rowHeight*3.7 = rowHeight*1
  // third base: (col 7, row 4.7) -> x=0, y=rowHeight*1

  return (
    <div style={{ width: "100vw", height: "100vh", backgroundColor: "#222" }}>
      <svg viewBox="0 0 1920 1080" width="100%" height="100%">
        <g transform="translate(96, 54) scale(0.9)">
          {/* Temporary 12x6 grid for layout tuning */}
          <g>
            {[...Array(13)].map((_, i) => (
              <line
                key={"v" + i}
                x1={colWidth * i}
                y1={0}
                x2={colWidth * i}
                y2={1080}
                stroke="white"
                strokeOpacity="0.2"
                strokeWidth="1"
              />
            ))}
            {[...Array(7)].map((_, i) => (
              <line
                key={"h" + i}
                x1={0}
                y1={rowHeight * i}
                x2={1920}
                y2={rowHeight * i}
                stroke="white"
                strokeOpacity="0.2"
                strokeWidth="1"
              />
            ))}
          </g>

          {/* League Logo and Name Group */}
          {/* Adjust the translation and sizes here to position and scale the league logo and name */}
          <g transform={`translate(${colWidth * 2}, ${rowHeight * 0})`}>
            <image href="LOGO_URL_PLACEHOLDER" x={0} y={0} width={colWidth * 0.52} height={rowHeight * 0.93} />
          </g>
          <g transform={`translate(${colWidth * 3}, ${rowHeight * 0})`}>
            <text x={0} y={rowHeight * 0.65} fontSize={60} fill="white" textAnchor="start" dominantBaseline="middle">
              League Name
            </text>
          </g>

          {/* Home Team Group */}
          {/* Modify the positioning and size of home team name and score here */}
          <g transform={`translate(${colWidth * 0}, ${rowHeight * 1})`}>
            <rect x={0} y={0} width={colWidth} height={rowHeight * 0.95} stroke="white" fill="none" rx="10" ry="10" />
            <rect x={colWidth} y={0} width={colWidth * 4.75} height={rowHeight * 0.95} stroke="white" fill="none" rx="10" ry="10" />
            <rect x={colWidth * 6} y={0} width={colWidth} height={rowHeight * 0.95} stroke="white" fill="none" rx="10" ry="10" />
            <text x={colWidth * 3.375} y={rowHeight * 0.475} fontSize={96} fill="white" textAnchor="middle" dominantBaseline="middle">
              {homeTeamName || "Home"}
            </text>
            <text x={colWidth * 6.5} y={rowHeight * 0.475} fontSize={120} fill="white" textAnchor="middle" dominantBaseline="middle">
              {homeScore ?? 0}
            </text>
          </g>

          {/* Away Team Group */}
          {/* Modify the positioning and size of away team name and score here */}
          <g transform={`translate(${colWidth * 0}, ${rowHeight * 2})`}>
            <rect x={0} y={0} width={colWidth} height={rowHeight * 0.95} stroke="white" fill="none" rx="10" ry="10" />
            <rect x={colWidth} y={0} width={colWidth * 4.75} height={rowHeight * 0.95} stroke="white" fill="none" rx="10" ry="10" />
            <rect x={colWidth * 6} y={0} width={colWidth} height={rowHeight * 0.95} stroke="white" fill="none" rx="10" ry="10" />
            <text x={colWidth * 3.375} y={rowHeight * 0.475} fontSize={96} fill="white" textAnchor="middle" dominantBaseline="middle">
              {awayTeamName || "Away"}
            </text>
            <text x={colWidth * 6.5} y={rowHeight * 0.475} fontSize={120} fill="white" textAnchor="middle" dominantBaseline="middle">
              {awayScore ?? 0}
            </text>
          </g>

          {/* Inning Indicator Group */}
          <g transform={`translate(${colWidth * 7.5}, ${rowHeight * 2})`}>
            {/* Top arrow */}
            {isTop && (
              <polygon
                points="0,-160 -40,-80 40,-80"
                fill="white"
              />
            )}
            {/* Inning number */}
            <text y={0} fontSize={72} fill="white" textAnchor="middle" dominantBaseline="middle">
              {inning}
            </text>
            {/* Bottom arrow */}
            {!isTop && (
              <polygon
                points="0,160 -40,80 40,80"
                fill="white"
              />
            )}
          </g>

          {/* Bases Group */}
          {/* Position diamond bases close together, using fine-tuned offsets */}
          <g transform={`translate(${colWidth * 8.7}, ${rowHeight * 2})`}>
            {/* Second base (top) */}
            <rect
              x={0}
              y={-100}
              width={baseSize}
              height={baseSize}
              fill={runners?.second ? "white" : "none"}
              stroke="white"
              transform={`rotate(45, ${baseHalf}, ${-100 + baseHalf})`}
            />
            {/* First base (right) */}
            <rect
              x={100}
              y={0}
              width={baseSize}
              height={baseSize}
              fill={runners?.first ? "white" : "none"}
              stroke="white"
              transform={`rotate(45, ${100 + baseHalf}, ${baseHalf})`}
            />
            {/* Third base (left) */}
            <rect
              x={-100}
              y={0}
              width={baseSize}
              height={baseSize}
              fill={runners?.third ? "white" : "none"}
              stroke="white"
              transform={`rotate(45, ${-100 + baseHalf}, ${baseHalf})`}
            />
          </g>

          {/* Outs Above Bases Group */}
          {/* Adjust position and font size of outs count */}
          <g transform={`translate(${colWidth * 9}, ${rowHeight * 1.15})`}>
            <text fontSize={48} fill="white" textAnchor="middle" dominantBaseline="middle">
              Outs: {outs}
            </text>
          </g>

          {/* Balls-Strikes Group */}
          {/* Adjust position and font size of balls and strikes display */}
          <g transform={`translate(${colWidth * 9}, ${rowHeight * 3.15})`}>
            <text fontSize={48} fill="white" textAnchor="middle" dominantBaseline="middle">
              {balls} - {strikes}
            </text>
          </g>

          {/* Sponsor Banner Group */}
          {/* Adjust position, size, and colors of sponsor banner */}
          <g transform={`translate(${colWidth * 3.83}, ${rowHeight * 5.5})`}>
            <rect width={colWidth * 5.21} height={rowHeight * 0.74} fill="#bb44cc" rx="10" ry="10" />
            <text
              x={colWidth * 2.6}
              y={rowHeight * 0.57}
              fontSize={40}
              fill="white"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              Sponsor Banner
            </text>
          </g>

          {/* Game Clock Group */}
          {/* Adjust position and font size of game clock display */}
          <g transform={`translate(${colWidth * 5}, ${rowHeight * 4.25})`}>
            <text fontSize={36} fill="white" textAnchor="middle" dominantBaseline="middle">
              Game Time: {formatTime(gameTime)}
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
};

export default OverlaySVGPage;
