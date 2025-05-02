import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { useFirebase } from "../contexts/FirebaseContext";
import InlineSVG from "react-inlinesvg";
import overlaySrc from "../assets/figma_overlay_template 1 (2).svg";

const OverlayFromFigma = ({ showGrid = true }) => {
  const { gameId } = useParams();
  const { db } = useFirebase();
  const [gameData, setGameData] = useState(null);

  // Subscribe to your game doc
  useEffect(() => {
    if (!gameId) return;
    const unsub = onSnapshot(doc(db, "games", gameId), (snap) => {
      if (snap.exists()) setGameData(snap.data());
    });
    return unsub;
  }, [db, gameId]);

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
    "Away Team Name_2": awayTeamName,
    "Home Team Name_2": homeTeamName,
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

  // When SVG is injected, replace each text node
  const updateSVGNodes = (svg) => {
    if (!svg) {
      console.error("OverlayFromFigma: SVG ref is null");
      return;
    }
    console.log("OverlayFromFigma overlayData keys:", Object.keys(overlayData));
    const presentIds = Array.from(svg.querySelectorAll("[id]")).map(el => el.id);
    console.log("OverlayFromFigma SVG IDs found:", presentIds);
    Object.entries(overlayData).forEach(([id, value]) => {
      const node = svg.getElementById(id);
      if (node) {
        node.textContent = value;
      } else {
        console.warn(`OverlayFromFigma: no element with id="${id}" in SVG`);
      }
    });
  };

  return (
    <div className="overlay-wrapper">
      <InlineSVG
        src={overlaySrc}
        afterInjection={(error, svg) => {
          if (error) {
            console.error("OverlayFromFigma SVG injection error:", error);
            return;
          }
          updateSVGNodes(svg);
        }}
        onError={err => console.error("OverlayFromFigma SVG load error:", err)}
        wrapperClassName="overlay-svg"
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
          position: relative;
          width: 100%;
          height: 100vh;
        }
        .overlay-svg svg {
          width: 100%;
          height: auto;
          max-height: 100vh;
          display: block;
          margin: 0 auto;
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