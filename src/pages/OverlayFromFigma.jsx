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

  useEffect(() => {
    if (!gameId || !db) return;

    const unsub = onSnapshot(doc(db, "games", gameId), (snap) => {
      if (snap.exists()) {
        setGameData(snap.data());
      }
    });

    return unsub;
  }, [db, gameId]);

  useEffect(() => {
    fetch(overlaySrc)
      .then(res => res.text())
      .then(setSvgContent)
      .catch(err => console.error("Failed to load SVG overlay template:", err));
  }, []);

  useEffect(() => {
    if (!gameData) return;
    const svgEl = svgContainerRef.current?.querySelector("svg");
    if (svgEl) {
      updateSVGNodes(svgEl, gameData, showGrid);
    }
  }, [gameData, showGrid]);

  if (!gameData) {
    return <div className="overlay-wrapper">Loading...</div>;
  }

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
