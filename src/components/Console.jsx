import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import { useAuth } from "../contexts/AuthContext";
import { callSetCustomClaims } from "../utils/authUtils";
import GameCreationForm from "./GameCreationForm";
import GameList from "./GameList";

const Console = () => {
  const { user, tenantId, loading } = useAuth();
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState({});
  const [activeTenant, setActiveTenant] = useState(tenantId);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      const db = getFirestore();
      const userRef = doc(db, "users", user.uid);
      try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setMemberships(data.memberships || {});
          setActiveTenant(data.activeTenant);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };
    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (user) {
      user.getIdToken(true).catch(() => {});
    }
  }, [user]);

  const handleSwitchTeam = async (newTenantId) => {
    if (!user || newTenantId === activeTenant) return;
    setUpdating(true);
    const db = getFirestore();
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { activeTenant: newTenantId });
    await callSetCustomClaims();
    setActiveTenant(newTenantId);
    setUpdating(false);
  };

  const handleSignOut = async () => {
    const auth = getAuth();
    await signOut(auth);
    navigate("/login");
  };

  if (loading) return <div className="loading-page">Loading...</div>;
  if (!user && !loading) {
    navigate("/login");
    return null;
  }

  const currentRoles = Array.isArray(memberships?.[activeTenant]?.roles)
    ? memberships[activeTenant].roles.join(", ")
    : "none";

  return (
    <div className="console-page">
      <div className="page-header">
        <h2>Scores4Streams</h2>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Profile</h3>
        <p className="profile-info"><strong>Email:</strong> {user?.email}</p>
        <p className="profile-info"><strong>Role(s):</strong> {currentRoles}</p>
        <p className="profile-info"><strong>Active Team:</strong> {activeTenant}</p>

        {Object.keys(memberships).length > 1 && (
          <div style={{ marginTop: 12 }}>
            <h3>Switch Team</h3>
            <ul className="team-list">
              {Object.entries(memberships).map(([teamId, info]) => (
                <li key={teamId}>
                  <button
                    disabled={updating || teamId === activeTenant}
                    onClick={() => handleSwitchTeam(teamId)}
                  >
                    {teamId} ({Array.isArray(info.roles) ? info.roles.join(", ") : "no roles"})
                    {teamId === activeTenant ? " (active)" : ""}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          className="btn-danger btn-small"
          onClick={handleSignOut}
          style={{ marginTop: 12 }}
        >
          Sign Out
        </button>
      </div>

      <div className="card">
        <GameCreationForm />
      </div>

      <div className="card">
        <GameList />
      </div>
    </div>
  );
};

export default Console;
