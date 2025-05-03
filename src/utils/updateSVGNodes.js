export const updateSVGNodes = (svg, gameData, showGrid = true) => {
  if (!svg || !gameData) return;

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
    runners,
    isTop,
  } = gameData;

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

  if (!showGrid) {
    const gridLines = svg.querySelectorAll('[id^="Vector"], [id*="Grid"], [id^="Line"]');
    gridLines.forEach(el => el.setAttribute("display", "none"));
  }

  Object.entries(overlayData).forEach(([id, value]) => {
    const node = svg.querySelector(`[id="${id}"]`);
    if (node) {
      const tspans = node.querySelectorAll("tspan");
      if (tspans.length) {
        tspans.forEach((t, i) => {
          t.textContent = i === 0 ? value : "";
        });
      } else {
        node.textContent = value;
      }
    }
  });

  const highlightCircles = (prefix, count) => {
    const colorMap = {
      Ball: "#2CF90C",
      Strike: "#FE090D",
    };
    const defaultColor = "#2B2B2B";
    for (let i = 1; i <= 3; i++) {
      const circle = svg.querySelector(`[id="${prefix}${i}"]`);
      if (circle) {
        const fillColor = i <= count ? (colorMap[prefix] || "#ffffff") : defaultColor;
        circle.setAttribute("fill", fillColor);
      }
    }
  };

  const highlightOuts = (count) => {
    for (let i = 1; i <= 2; i++) {
      const outCircle = svg.querySelector(`[id="Out${i}"]`);
      if (outCircle) {
        const fillColor = i <= count ? "#FFFF06" : "#2B2B2B";
        outCircle.setAttribute("fill", fillColor);
      }
    }
  };

  const highlightBase = (id, active) => {
    const base = svg.querySelector(`[id="${id}"]`);
    if (base) {
      const baseColor = active ? "#FFFF06" : "#2B2B2B";
      base.setAttribute("fill", baseColor);
    }
  };

  highlightCircles("Ball", balls || 0);
  highlightCircles("Strike", strikes || 0);
  highlightOuts(outs || 0);
  highlightBase("1st Base_2", runners?.first);
  highlightBase("2nd Base_2", runners?.second);
  highlightBase("3rd Base_2", runners?.third);

  const topArrow = svg.querySelector(`[id="Top"]`);
  const bottomArrow = svg.querySelector(`[id="Bottom"]`);
  if (topArrow && bottomArrow) {
    topArrow.setAttribute("fill", isTop ? "#FFFF06" : "#2B2B2B");
    bottomArrow.setAttribute("fill", isTop ? "#2B2B2B" : "#FFFF06");
  }
};
