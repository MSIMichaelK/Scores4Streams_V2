import { useParams, useNavigate } from "react-router-dom";
import ManualScoreController from "../components/ManualScoreController";

const ManualScoringPage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();

  return (
    <div>
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate("/console")}>
          &larr; Back
        </button>
        <h2>Live Scoring</h2>
      </div>
      <ManualScoreController gameId={gameId} />
    </div>
  );
};

export default ManualScoringPage;
