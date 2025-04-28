import { useState, useEffect } from "react";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

const ManualScoreController = ({ gameId }) => {
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [balls, setBalls] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [outs, setOuts] = useState(0);
  const [runners, setRunners] = useState({
    first: false,
    second: false,
    third: false,
  });
  const [inning, setInning] = useState(1);
  const [isTop, setIsTop] = useState(true);

  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const [changeHighlight, setChangeHighlight] = useState("");

  const flashHighlight = (message) => {
    setChangeHighlight(message);
    setTimeout(() => setChangeHighlight(""), 1500);
  };

  const saveSnapshot = () => {
    const snapshot = {
      homeScore,
      awayScore,
      balls,
      strikes,
      outs,
      runners,
      inning,
      isTop,
    };
    setUndoStack(prev => {
      const newStack = [snapshot, ...prev].slice(0, 3);
      return newStack;
    });
    setRedoStack([]); // Clear redo stack on new action
  };

  const addRun = () => {
    if (isTop) {
      setAwayScore(prev => prev + 1);
    } else {
      setHomeScore(prev => prev + 1);
    }
  };

  const toggleRunner = (base) => {
    saveSnapshot();
    setRunners((prev) => ({ ...prev, [base]: !prev[base] }));
  };

  const { user, tenantId } = useAuth();

  useEffect(() => {
    const saveToFirestore = async () => {
      if (!user || !tenantId || !gameId) return;

      const db = getFirestore();
      const gameRef = doc(db, "games", gameId);

      await setDoc(
        gameRef,
        {
          homeScore,
          awayScore,
          balls,
          strikes,
          outs,
          runners,
          scorerTeamId: tenantId,
          lastUpdated: new Date().toISOString(),
          inning,
          isTop,
        },
        { merge: true }
      );
    };

    saveToFirestore();
  }, [homeScore, awayScore, balls, strikes, outs, runners, inning, isTop]);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[0];
    setUndoStack(prev => prev.slice(1));
    setRedoStack(prev => [{ homeScore, awayScore, balls, strikes, outs, runners, inning, isTop }, ...prev].slice(0, 3));

    setHomeScore(previous.homeScore);
    setAwayScore(previous.awayScore);
    setBalls(previous.balls);
    setStrikes(previous.strikes);
    setOuts(previous.outs);
    setRunners(previous.runners);
    setInning(previous.inning);
    setIsTop(previous.isTop);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setRedoStack(prev => prev.slice(1));
    setUndoStack(prev => [{ homeScore, awayScore, balls, strikes, outs, runners, inning, isTop }, ...prev].slice(0, 3));

    setHomeScore(next.homeScore);
    setAwayScore(next.awayScore);
    setBalls(next.balls);
    setStrikes(next.strikes);
    setOuts(next.outs);
    setRunners(next.runners);
    setInning(next.inning);
    setIsTop(next.isTop);
  };

  return (
    <div>
      <h2>Manual Score Controller</h2>
      {changeHighlight && (
        <div style={{ backgroundColor: "yellow", padding: "8px", marginBottom: "10px" }}>
          {changeHighlight}
        </div>
      )}

      <div>
        <button onClick={handleUndo} disabled={undoStack.length === 0}>Undo</button>
        <button onClick={handleRedo} disabled={redoStack.length === 0}>Redo</button>
      </div>

      <div>
        <h3>Score</h3>
        <div>
          <p>Home: {homeScore}</p>
          <button onClick={() => {
            saveSnapshot();
            setHomeScore(homeScore + 1);
          }}>+</button>
          <button onClick={() => {
            saveSnapshot();
            setHomeScore(Math.max(0, homeScore - 1));
          }}>-</button>
        </div>
        <div>
          <p>Away: {awayScore}</p>
          <button onClick={() => {
            saveSnapshot();
            setAwayScore(awayScore + 1);
          }}>+</button>
          <button onClick={() => {
            saveSnapshot();
            setAwayScore(Math.max(0, awayScore - 1));
          }}>-</button>
        </div>
      </div>

      <div>
        <h3>Inning: {inning} ({isTop ? "Top" : "Bottom"})</h3>
        <h3>Balls / Strikes / Outs</h3>
        <p>Balls: {balls}</p>
        <button onClick={() => {
          saveSnapshot();
          const newBalls = balls + 1;
          if (newBalls >= 4) {
            // Walk - move runners
            flashHighlight("Walk - Runners Advanced");
            const updatedRunners = { ...runners };
            if (runners.third) {
              addRun();
            }
            updatedRunners.third = runners.second;
            updatedRunners.second = runners.first;
            updatedRunners.first = true;
            setRunners(updatedRunners);
            setBalls(0);
            setStrikes(0);
          } else {
            setBalls(newBalls);
          }
        }}>Next</button>
        <p>Strikes: {strikes}</p>
        <button onClick={() => {
          saveSnapshot();
          const newStrikes = strikes + 1;
          if (newStrikes >= 3) {
            // Strikeout - add out
            flashHighlight("Strikeout");
            const newOuts = outs + 1;
            if (newOuts >= 3) {
              setOuts(0);
              if (isTop) {
                setIsTop(false);
              } else {
                setIsTop(true);
                setInning(prev => prev + 1);
              }
              setRunners({ first: false, second: false, third: false });
            } else {
              setOuts(newOuts);
            }
            setBalls(0);
            setStrikes(0);
          } else {
            setStrikes(newStrikes);
          }
        }}>Next</button>
        <div>
          <button onClick={() => {
            saveSnapshot();
            setBalls(0);
          }}>Reset Balls</button>

          <button onClick={() => {
            saveSnapshot();
            setStrikes(0);
          }}>Reset Strikes</button>
        </div>
        <p>Outs: {outs}</p>
        <button onClick={() => {
          saveSnapshot();
          const newOuts = outs + 1;
          if (newOuts >= 3) {
            flashHighlight("Inning Changed - Runners Cleared");
            setOuts(0);
            if (isTop) {
              setIsTop(false);
            } else {
              setIsTop(true);
              setInning(prev => prev + 1);
            }
            setRunners({ first: false, second: false, third: false });
          } else {
            setOuts(newOuts);
          }
        }}>Next</button>
      </div>

      <div>
        <h3>Hit Type Actions</h3>
        <button onClick={() => {
          flashHighlight("Hit Recorded");
          saveSnapshot();
          // Single
          const updatedRunners = { ...runners };
          if (runners.third) addRun();
          updatedRunners.third = runners.second;
          updatedRunners.second = runners.first;
          updatedRunners.first = true;
          setRunners(updatedRunners);
          setBalls(0);
          setStrikes(0);
        }}>Single</button>

        <button onClick={() => {
          flashHighlight("Hit Recorded");
          saveSnapshot();
          // Double
          const updatedRunners = { ...runners };
          if (runners.third) addRun();
          if (runners.second) addRun();
          updatedRunners.third = runners.first;
          updatedRunners.second = true;
          updatedRunners.first = false;
          setRunners(updatedRunners);
          setBalls(0);
          setStrikes(0);
        }}>Double</button>

        <button onClick={() => {
          flashHighlight("Hit Recorded");
          saveSnapshot();
          // Triple
          const updatedRunners = { ...runners };
          if (runners.third) addRun();
          if (runners.second) addRun();
          if (runners.first) addRun();
          updatedRunners.third = true;
          updatedRunners.second = false;
          updatedRunners.first = false;
          setRunners(updatedRunners);
          setBalls(0);
          setStrikes(0);
        }}>Triple</button>

        <button onClick={() => {
          flashHighlight("Hit Recorded");
          saveSnapshot();
          // Home Run
          let runsScored = 1;
          if (runners.first) runsScored++;
          if (runners.second) runsScored++;
          if (runners.third) runsScored++;
          for (let i = 0; i < runsScored; i++) {
            addRun();
          }
          setRunners({ first: false, second: false, third: false });
          setBalls(0);
          setStrikes(0);
        }}>Home Run</button>
      </div>

      <div>
        <h3>Base Runners</h3>
        <button onClick={() => toggleRunner("first")}>1B {runners.first ? "🧍" : "⬜"}</button>
        <button onClick={() => toggleRunner("second")}>2B {runners.second ? "🧍" : "⬜"}</button>
        <button onClick={() => toggleRunner("third")}>3B {runners.third ? "🧍" : "⬜"}</button>
      </div>
    </div>
  );
};

export default ManualScoreController;