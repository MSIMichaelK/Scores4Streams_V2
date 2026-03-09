/**
 * Tests for object-form actions in the scoring engine.
 * Verifies polymorphic dispatch: both strings and objects work.
 */
import { createGameState, applyAction, replayActions } from "../utils/scoringEngine";

describe("Object Actions — Polymorphic Dispatch", () => {
  let game;

  beforeEach(() => {
    game = createGameState("Home", "Away");
  });

  test("string actions still work (backward compat)", () => {
    applyAction(game, "ball");
    expect(game.balls).toBe(1);
    applyAction(game, "strike");
    expect(game.strikes).toBe(1);
    applyAction(game, "single");
    expect(game.runners.first).toBe(true);
  });

  test("object actions work with type only", () => {
    applyAction(game, { type: "ball" });
    expect(game.balls).toBe(1);
    applyAction(game, { type: "strike" });
    expect(game.strikes).toBe(1);
    applyAction(game, { type: "single" });
    expect(game.runners.first).toBe(true);
  });

  test("object actions carry positions metadata", () => {
    applyAction(game, { type: "ground_out", positions: [6, 3] });
    expect(game.outs).toBe(1);
    const event = game.events[game.events.length - 1];
    expect(event.positions).toEqual([6, 3]);
    expect(event.subType).toBe("6-3");
    expect(event.description).toBe("Ground out 6-3");
  });

  test("mixed string and object actions in replayActions", () => {
    replayActions(game, [
      "ball",
      { type: "strike" },
      "foul",
      { type: "ground_out", positions: [4, 3] },
    ]);
    expect(game.outs).toBe(1);
    expect(game.pitchCount).toBe(4);
  });

  test("object action single carries positions", () => {
    applyAction(game, { type: "single", positions: [7] });
    expect(game.runners.first).toBe(true);
    const event = game.events[game.events.length - 1];
    expect(event.positions).toEqual([7]);
  });

  test("unknown object action throws", () => {
    expect(() => applyAction(game, { type: "banana" })).toThrow("Unknown action: banana");
  });

  test("events record outsRecorded field", () => {
    applyAction(game, { type: "ground_out" });
    const event = game.events[game.events.length - 1];
    expect(event.outsRecorded).toBe(1);
    expect(event.resultedInOut).toBe(true);
  });

  test("non-out events have outsRecorded = 0", () => {
    applyAction(game, "ball");
    const event = game.events[game.events.length - 1];
    expect(event.outsRecorded).toBe(0);
  });
});
