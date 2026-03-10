import { useState, useRef } from "react";
import {
  getFirestore,
  collection,
  doc,
  writeBatch,
  query,
  orderBy,
  getDocs,
  updateDoc,
} from "firebase/firestore";

/**
 * Custom hook for recording play-by-play events.
 *
 * Events are queued via recordEvent() and committed to Firestore
 * via commitEvents() after the aggregate game state has been written.
 * This dual-write pattern keeps the overlay working on aggregate state
 * while building an event log for stats computation.
 */
const useGameEvents = (gameId) => {
  const [events, setEvents] = useState([]);
  const [pitchCount, setPitchCount] = useState(0);
  const pendingEventsRef = useRef([]);
  const seqRef = useRef(1);

  /**
   * Queue an event for recording. Called by action handlers BEFORE state changes.
   * @param {Object} eventData - { type, subType, isPitch, resultedInOut, runsScored, description }
   * @param {Object} gameState - Current game state at time of action (pre-change)
   * @param {string|null} batterId - Current batter's player ID (from roster)
   * @param {string|null} pitcherId - Current pitcher's player ID (from roster)
   */
  const recordEvent = (eventData, gameState, batterId = null, pitcherId = null) => {
    const event = {
      seq: seqRef.current++,
      timestamp: new Date().toISOString(),
      inning: gameState.inning,
      isTop: gameState.isTop,
      type: eventData.type,
      subType: eventData.subType || null,
      isPitch: eventData.isPitch || false,
      resultedInOut: eventData.resultedInOut || false,
      runsScored: eventData.runsScored || 0,
      countBefore: {
        balls: gameState.balls,
        strikes: gameState.strikes,
        outs: gameState.outs,
      },
      stateAfter: null,
      description: eventData.description || "",
      batterId,
      pitcherId,
      undone: false,
    };

    pendingEventsRef.current.push(event);

    if (eventData.isPitch) {
      setPitchCount((prev) => prev + 1);
    }
  };

  /**
   * Commit all pending events to Firestore with stateAfter stamped.
   * Called from the Firestore sync effect after game state has updated.
   * @param {Object} currentState - Full game state after action applied
   */
  const commitEvents = async (currentState) => {
    const pending = [...pendingEventsRef.current];
    if (pending.length === 0) return;
    pendingEventsRef.current = [];

    const stateAfter = {
      homeScore: currentState.homeScore,
      awayScore: currentState.awayScore,
      balls: currentState.balls,
      strikes: currentState.strikes,
      outs: currentState.outs,
      runners: { ...currentState.runners },
      inning: currentState.inning,
      isTop: currentState.isTop,
    };

    const completedEvents = pending.map((e) => ({ ...e, stateAfter }));

    // Update local state immediately (optimistic) so UI shows events right away
    setEvents((prev) => [...prev, ...completedEvents]);

    // Write to Firestore in background
    try {
      const db = getFirestore();
      const batch = writeBatch(db);
      completedEvents.forEach((event) => {
        const eventRef = doc(collection(db, "games", gameId, "events"));
        batch.set(eventRef, event);
      });
      await batch.commit();
    } catch (err) {
      console.error("Failed to commit events to Firestore:", err);
      // Events are already in local state for UI; re-queue for retry
      pendingEventsRef.current = [
        ...completedEvents,
        ...pendingEventsRef.current,
      ];
    }
  };

  /**
   * Load existing events from Firestore on mount.
   * Initializes sequence counter and pitch count from persisted data.
   */
  const loadEvents = async () => {
    if (!gameId) return;
    try {
      const db = getFirestore();
      const eventsRef = collection(db, "games", gameId, "events");
      const q = query(eventsRef, orderBy("seq", "asc"));
      const snapshot = await getDocs(q);
      const loaded = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEvents(loaded);

      if (loaded.length > 0) {
        seqRef.current = Math.max(...loaded.map((e) => e.seq)) + 1;
      }

      const pitches = loaded.filter((e) => e.isPitch && !e.undone).length;
      setPitchCount(pitches);
    } catch (err) {
      console.error("Failed to load events:", err);
    }
  };

  /**
   * Mark the most recent non-undone event as undone (soft-delete).
   */
  const undoLastEvent = async () => {
    const nonUndone = events.filter((e) => !e.undone);
    if (nonUndone.length === 0) return;

    const lastEvent = nonUndone[nonUndone.length - 1];

    try {
      if (lastEvent.id) {
        const db = getFirestore();
        const eventRef = doc(db, "games", gameId, "events", lastEvent.id);
        await updateDoc(eventRef, { undone: true });
      }
    } catch (err) {
      console.error("Failed to undo event:", err);
    }

    setEvents((prev) =>
      prev.map((e) => (e.seq === lastEvent.seq ? { ...e, undone: true } : e))
    );

    if (lastEvent.isPitch) {
      setPitchCount((prev) => Math.max(0, prev - 1));
    }
  };

  /**
   * Re-activate the most recently undone event.
   */
  const redoLastEvent = async () => {
    const undone = events.filter((e) => e.undone);
    if (undone.length === 0) return;

    const lastUndone = undone[undone.length - 1];

    try {
      if (lastUndone.id) {
        const db = getFirestore();
        const eventRef = doc(db, "games", gameId, "events", lastUndone.id);
        await updateDoc(eventRef, { undone: false });
      }
    } catch (err) {
      console.error("Failed to redo event:", err);
    }

    setEvents((prev) =>
      prev.map((e) =>
        e.seq === lastUndone.seq ? { ...e, undone: false } : e
      )
    );

    if (lastUndone.isPitch) {
      setPitchCount((prev) => prev + 1);
    }
  };

  return {
    events,
    pitchCount,
    recordEvent,
    commitEvents,
    loadEvents,
    undoLastEvent,
    redoLastEvent,
  };
};

export default useGameEvents;
