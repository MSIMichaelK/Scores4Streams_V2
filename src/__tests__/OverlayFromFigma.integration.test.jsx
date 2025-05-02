import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import OverlayFromFigma from "../pages/OverlayFromFigma";
import "@testing-library/jest-dom";

// Mock fetch to return simple SVG content
global.fetch = jest.fn(() =>
  Promise.resolve({
    text: () => Promise.resolve(`
      <svg>
        <text id="Home Team Name"></text>
        <text id="Away Team Name_2"></text>
        <text id="Inning"></text>
      </svg>
    `)
  })
);

// Mock useParams and useFirebase
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ gameId: "test-game" })
}));

jest.mock("../contexts/FirebaseContext", () => ({
  useFirebase: () => ({
    db: {}
  })
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(() => "mockDocRef"),
  onSnapshot: jest.fn((ref, callback) => {
    callback({
      exists: () => true,
      data: () => ({
        homeTeamName: "Falcons",
        awayTeamName: "Wolves",
        inning: "7"
      })
    });
    return () => {}; // unsubscribe noop
  })
}));

describe("OverlayFromFigma integration", () => {
  test("renders SVG with updated text nodes from Firestore", async () => {
    render(<OverlayFromFigma showGrid={false} />);

    await waitFor(() => {
      const svg = document.querySelector("svg");
      expect(svg.querySelector('[id="Home Team Name"]')).toHaveTextContent("Falcons");
      expect(svg.querySelector('[id="Away Team Name_2"]')).toHaveTextContent("Wolves");
      expect(svg.querySelector('[id="Inning"]')).toHaveTextContent("7");
    });
  });
});