import { useParams } from "react-router-dom";
import ManualScoreController from "../components/ManualScoreController";

const ManualScoringPage = () => {
  const { gameId } = useParams();
  console.log("📺 gameId from route:", gameId);

  return (
    <div>
      <h2>Manual Scoring Page</h2>
      <ManualScoreController gameId={gameId} />
    </div>
  );
};

export default ManualScoringPage;