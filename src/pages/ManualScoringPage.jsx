import { useParams, useNavigate } from "react-router-dom";
import ManualScoreController from "../components/ManualScoreController";

const ManualScoringPage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();

  return (
    <ManualScoreController gameId={gameId} onBack={() => navigate("/console")} />
  );
};

export default ManualScoringPage;
