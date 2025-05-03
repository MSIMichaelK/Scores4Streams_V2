import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { useFirebase } from "../contexts/FirebaseContext";
import overlaySrc from "../assets/figma_overlay_template.svg";
import { updateSVGNodes } from "../utils/updateSVGNodes";

const OverlayFromFigma = ({ showGrid = true }) => {
  const { gameId } = useParams();
  const { db } = useFirebase();
  const [gameData, setGameData] = useState(null);
  const [svgContent, setSvgContent] = useState(null);
  const svgContainerRef = React.useRef();

  // Subscribe to your game doc
  useEffect(() => {
    if (!gameId) {
      console.warn("OverlayFromFigma: No gameId found in route params.");
      return;
    }
    if (!db) {
      console.error("OverlayFromFigma: Firebase DB not initialized.");
      return;
    }
    console.log("OverlayFromFigma: Subscribing to gameId", gameId);

    const unsub = onSnapshot(doc(db, "games", gameId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        console.log("OverlayFromFigma: Got game update", data);
        setGameData(data);
      } else {
        console.warn("OverlayFromFigma: No such document for gameId", gameId);
      }
    });

    return unsub;
  }, [db, gameId]);

  // Load SVG content on mount
  useEffect(() => {
    fetch(overlaySrc)
      .then(res => res.text())
      .then(setSvgContent)
      .catch(err => console.error("OverlayFromFigma: Failed to load SVG:", err));
  }, []);

  // Whenever gameData or showGrid changes, re-run the SVG text updates
  useEffect(() => {
    if (!gameData) return;
    const svgEl = svgContainerRef.current?.querySelector("svg");
    if (svgEl) {
      updateSVGNodes(svgEl, gameData, showGrid);
    }
  }, [gameData, showGrid]);

  if (!gameData) {
    return <div className="overlay-wrapper">Loading…</div>;
  }

  const {
    homeTeamName,
    awayTeamName,
    homeScore,
    awayScore,
    inning,
    outs,
    balls,
    strikes,
    leagueName,
    gameClock,
    pitchCount,
    pitcherName,
    batterName,
  } = gameData;

  // Map your SVG <text id="…"> → live values
  const overlayData = {
    "Away Team Name_2": awayTeamName || "Missing",
    "Home Team Name": homeTeamName || "Missing",
    "League Name": leagueName,
    "Away Team Score_2": String(awayScore),
    "Home Team Score": String(homeScore),
    "Inning": String(inning),
    "Outs": `${outs} Out`,
    "Balls and Strikes": `${balls}-${strikes}`,
    "Game Clock": gameClock,
    "Pitch Count": `${pitchCount}`,
    "Pitcher": pitcherName,
    "Batter": batterName,
  };

  // now using imported function from utils

  return (
    <div className="overlay-wrapper">
      <div
        ref={svgContainerRef}
        className="overlay-svg"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
      {showGrid && (
        <svg className="grid-overlay">
          <rect
            x="0.5"
            y="0.5"
            width="100%"
            height="100%"
            fill="none"
            stroke="red"
            strokeWidth="1"
          />
        </svg>
      )}
      <style>{`
  .overlay-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100vw;
    height: 100vh;
    margin: 0;
    padding: 0;
  }
  .overlay-svg svg {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
  }
  .grid-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
`}</style>
    </div>
  );
};

export default OverlayFromFigma;