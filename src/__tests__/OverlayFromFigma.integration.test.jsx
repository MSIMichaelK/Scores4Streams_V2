import "@testing-library/jest-dom";
import { updateSVGNodes } from "../utils/updateSVGNodes";

describe("updateSVGNodes integration", () => {
  test("updates text nodes and attributes in SVG", () => {
    const container = document.createElement("div");
    container.innerHTML = `
      <svg>
        <text id="Home Team Name">Placeholder</text>
        <text id="Away Team Name_2">Placeholder</text>
        <text id="Inning">0</text>
        <circle id="Ball1" fill="#000"/>
        <circle id="Strike1" fill="#000"/>
        <circle id="Out1" fill="#000"/>
        <path id="1st Base_2" fill="#000"/>
        <path id="2nd Base_2" fill="#000"/>
        <path id="3rd Base_2" fill="#000"/>
        <path id="Top" fill="#000"/>
        <path id="Bottom" fill="#000"/>
      </svg>
    `;
    const svg = container.querySelector("svg");

    const gameData = {
      homeTeamName: "Falcons",
      awayTeamName: "Wolves",
      inning: "7",
      balls: 1,
      strikes: 1,
      outs: 1,
      runners: { first: true, second: false, third: true },
      isTop: true
    };

    updateSVGNodes(svg, gameData, false);

    expect(svg.querySelector('[id="Home Team Name"]')).toHaveTextContent("Falcons");
    expect(svg.querySelector('[id="Away Team Name_2"]')).toHaveTextContent("Wolves");
    expect(svg.querySelector('[id="Inning"]')).toHaveTextContent("7");

    expect(svg.querySelector('[id="Ball1"]').getAttribute("fill")).toBe("#2CF90C");
    expect(svg.querySelector('[id="Strike1"]').getAttribute("fill")).toBe("#FE090D");
    expect(svg.querySelector('[id="Out1"]').getAttribute("fill")).toBe("#FFFF06");
    expect(svg.querySelector('[id="1st Base_2"]').getAttribute("fill")).toBe("#FFFF06");
    expect(svg.querySelector('[id="2nd Base_2"]').getAttribute("fill")).toBe("#2B2B2B");
    expect(svg.querySelector('[id="3rd Base_2"]').getAttribute("fill")).toBe("#FFFF06");
    expect(svg.querySelector('[id="Top"]').getAttribute("fill")).toBe("#FFFF06");
    expect(svg.querySelector('[id="Bottom"]').getAttribute("fill")).toBe("#2B2B2B");
  });
});