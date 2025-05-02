import "@testing-library/jest-dom";

// Simulate calling updateSVGNodes with a fake SVG and gameData
function updateSVGNodes(svg, gameData) {
  const overlayData = {
    "Home Team Name": gameData.homeTeamName,
    "Away Team Name_2": gameData.awayTeamName,
    "Inning": gameData.inning,
  };

  Object.entries(overlayData).forEach(([id, value]) => {
    const node = svg.querySelector(`[id="${id}"]`);
    if (node) {
      node.textContent = value;
    }
  });
}

describe("OverlayFromFigma - updateSVGNodes", () => {
  test("updates text nodes in SVG from gameData", () => {
    document.body.innerHTML = `
      <svg>
        <text id="Home Team Name"></text>
        <text id="Away Team Name_2"></text>
        <text id="Inning"></text>
      </svg>
    `;
    const svg = document.querySelector("svg");
    const gameData = {
      homeTeamName: "Eagles",
      awayTeamName: "Sharks",
      inning: "5",
    };

    updateSVGNodes(svg, gameData);

    expect(svg.querySelector("#Home\\ Team\\ Name")).toHaveTextContent("Eagles");
    expect(svg.querySelector("#Away\\ Team\\ Name_2")).toHaveTextContent("Sharks");
    expect(svg.querySelector("#Inning")).toHaveTextContent("5");
  });

  test("sets base fill to yellow when runner is on base", () => {
    document.body.innerHTML = `
      <svg>
        <path id="1st Base_2" fill="#2B2B2B" />
        <path id="2nd Base_2" fill="#2B2B2B" />
        <path id="3rd Base_2" fill="#2B2B2B" />
      </svg>
    `;
    const svg = document.querySelector("svg");
    const gameData = {
      runners: {
        first: true,
        second: false,
        third: true,
      }
    };

    const highlightBase = (id, active) => {
      const base = svg.querySelector(`[id="${id}"]`);
      if (base) {
        const baseColor = active ? "#FFFF06" : "#2B2B2B";
        base.setAttribute("fill", baseColor);
      }
    };

    highlightBase("1st Base_2", gameData.runners.first);
    highlightBase("2nd Base_2", gameData.runners.second);
    highlightBase("3rd Base_2", gameData.runners.third);

    expect(svg.querySelector('[id="1st Base_2"]')).toHaveAttribute("fill", "#FFFF06");
    expect(svg.querySelector('[id="2nd Base_2"]')).toHaveAttribute("fill", "#2B2B2B");
    expect(svg.querySelector('[id="3rd Base_2"]')).toHaveAttribute("fill", "#FFFF06");
  });
});

  test("sets correct fill colors for balls and strikes", () => {
    document.body.innerHTML = `
      <svg>
        <circle id="Ball1" fill="#2B2B2B" />
        <circle id="Ball2" fill="#2B2B2B" />
        <circle id="Ball3" fill="#2B2B2B" />
        <circle id="Strike1" fill="#2B2B2B" />
        <circle id="Strike2" fill="#2B2B2B" />
      </svg>
    `;
    const svg = document.querySelector("svg");
    const balls = 2;
    const strikes = 1;

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
        }
      }
    };

    highlightCircles("Ball", balls);
    highlightCircles("Strike", strikes);

    expect(svg.querySelector('[id="Ball1"]')).toHaveAttribute("fill", "#2CF90C");
    expect(svg.querySelector('[id="Ball2"]')).toHaveAttribute("fill", "#2CF90C");
    expect(svg.querySelector('[id="Ball3"]')).toHaveAttribute("fill", "#2B2B2B");

    expect(svg.querySelector('[id="Strike1"]')).toHaveAttribute("fill", "#FE090D");
    expect(svg.querySelector('[id="Strike2"]')).toHaveAttribute("fill", "#2B2B2B");
  });

  test("highlights correct inning arrow based on isTop", () => {
    document.body.innerHTML = `
      <svg>
        <path id="Top" fill="#2B2B2B" />
        <path id="Bottom" fill="#2B2B2B" />
      </svg>
    `;
    const svg = document.querySelector("svg");

    const highlightInningArrow = (isTop) => {
      const topArrow = svg.querySelector('[id="Top"]');
      const bottomArrow = svg.querySelector('[id="Bottom"]');
      if (topArrow && bottomArrow) {
        topArrow.setAttribute("fill", isTop ? "#FFFF06" : "#2B2B2B");
        bottomArrow.setAttribute("fill", isTop ? "#2B2B2B" : "#FFFF06");
      }
    };

    highlightInningArrow(true);
    expect(svg.querySelector('[id="Top"]')).toHaveAttribute("fill", "#FFFF06");
    expect(svg.querySelector('[id="Bottom"]')).toHaveAttribute("fill", "#2B2B2B");

    highlightInningArrow(false);
    expect(svg.querySelector('[id="Top"]')).toHaveAttribute("fill", "#2B2B2B");
    expect(svg.querySelector('[id="Bottom"]')).toHaveAttribute("fill", "#FFFF06");
  });