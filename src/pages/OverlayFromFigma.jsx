import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { useFirebase } from "../contexts/FirebaseContext";
import overlaySrc from "../assets/figma_overlay_template 1 (2).svg";

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

  // Whenever gameData changes, re-run the SVG text updates
  useEffect(() => {
    if (!gameData) return;
    const svgEl = svgContainerRef.current?.querySelector("svg");
    if (svgEl) {
      updateSVGNodes(svgEl);
    }
  }, [gameData]);

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

  // When SVG is injected, replace each text node
  const updateSVGNodes = (svg) => {
    if (!svg) {
      console.error("OverlayFromFigma: SVG ref is null");
      return;
    }
    // Hide static SVG grid lines if showGrid is false
    if (!showGrid) {
      const gridLines = svg.querySelectorAll('[id^="Vector"], [id*="Grid"], [id^="Line"]');
      gridLines.forEach(el => {
        el.setAttribute("display", "none");
        console.log(`OverlayFromFigma: Hiding SVG grid element ${el.id}`);
      });
    }
    console.log("OverlayFromFigma overlayData keys:", Object.keys(overlayData));
    const presentIds = Array.from(svg.querySelectorAll("[id]")).map(el => el.id);
    console.log("OverlayFromFigma SVG IDs found:", presentIds);
    console.log("OverlayFromFigma: Running updateSVGNodes with overlayData:", overlayData);
    Object.entries(overlayData).forEach(([id, value]) => {
      const node = svg.querySelector(`[id="${id}"]`);
      if (node) {
        const tspans = node.querySelectorAll("tspan");
        if (tspans.length) {
          tspans.forEach((t, i) => {
            if (i === 0) {
              t.textContent = value;
            } else {
              t.textContent = "";
            }
          });
        } else {
          node.textContent = value;
        }
        console.log(`OverlayFromFigma: Updated SVG node #${id} to "${value}"`);
      } else {
        console.warn(`OverlayFromFigma: no element with id="${id}" in SVG`);
      }
    });

    // Update fill logic for bases, balls, strikes, and outs
    const highlightCircles = (prefix, count) => {
      const colorMap = {
        Ball: "#2CF90C",     // Green
        Strike: "#FE090D",   // Red
      };
      const defaultColor = "#2B2B2B";
      for (let i = 1; i <= 3; i++) {
        const circle = svg.querySelector(`[id="${prefix}${i}"]`);
        if (circle) {
          const fillColor = i <= count ? (colorMap[prefix] || "#ffffff") : defaultColor;
          circle.setAttribute("fill", fillColor);
          console.log(`OverlayFromFigma: Set ${prefix}${i} fill to ${fillColor}`);
        }
      }
    };

    const highlightOuts = (count) => {
      for (let i = 1; i <= 2; i++) {
        const outCircle = svg.querySelector(`[id="Out${i}"]`);
        if (outCircle) {
          const fillColor = i <= count ? "#FFFF06" : "#2B2B2B";
          outCircle.setAttribute("fill", fillColor);
          console.log(`OverlayFromFigma: Set Out${i} fill to ${fillColor}`);
        }
      }
    };

    // Highlight base paths
    const highlightBase = (id, active) => {
      const base = svg.querySelector(`[id="${id}"]`);
      if (base) {
        const baseColor = active ? "#FFFF06" : "#2B2B2B";
        base.setAttribute("fill", baseColor);
        console.log(`OverlayFromFigma: Set base ${id} fill to ${baseColor}`);
      }
    };

    highlightCircles("Ball", gameData.balls || 0);
    highlightCircles("Strike", gameData.strikes || 0);
    highlightOuts(gameData.outs || 0);
    highlightBase("1st Base_2", gameData.runners?.first);
    highlightBase("2nd Base_2", gameData.runners?.second);
    highlightBase("3rd Base_2", gameData.runners?.third);

    // Inning arrow logic
    const topArrow = svg.querySelector(`[id="Top"]`);
    const bottomArrow = svg.querySelector(`[id="Bottom"]`);
    if (topArrow && bottomArrow) {
      const isTop = gameData.isTop;
      topArrow.setAttribute("fill", isTop ? "#FFFF06" : "#2B2B2B");
      bottomArrow.setAttribute("fill", isTop ? "#2B2B2B" : "#FFFF06");
      console.log(`OverlayFromFigma: Set inning arrows: top=${isTop}`);
    }
  };

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