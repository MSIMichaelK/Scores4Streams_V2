import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import { useAuth } from "../contexts/AuthContext";
import { callSetCustomClaims } from "../utils/authUtils";
import { listUserTeams } from "../hooks/useTeams";
import TeamRosterManager from "../components/TeamRosterManager";

const SettingsPage = () => {
  const { user, tenantId, teamName, loading } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
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
          setActiveTenant(data.activeTenant);
          // Resolve team names from team documents
          const resolved = await listUserTeams(data.memberships || {});
          setTeams(resolved);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };
    fetchUserData();
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
  if (!user) {
    navigate("/login");
    return null;
  }

  const activeTeam = teams.find(t => t.id === activeTenant);
  const currentRoles = activeTeam?.roles?.join(", ") || "none";
  const displayTeamName = activeTeam?.name || teamName || activeTenant;

  return (
    <div className="settings-page">
      <div className="page-header">
        <h2>Settings</h2>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Profile</h3>
        <p className="profile-info" data-testid="settings-email"><strong>Email:</strong> {user?.email}</p>
        <p className="profile-info" data-testid="settings-roles"><strong>Role(s):</strong> {currentRoles}</p>
        <p className="profile-info" data-testid="settings-team"><strong>Active Team:</strong> {displayTeamName}</p>
      </div>

      {activeTenant && (
        <TeamRosterManager teamId={activeTenant} />
      )}

      {teams.length > 1 && (
        <div className="card">
          <h3>Switch Team</h3>
          <ul className="team-list">
            {teams.map((team) => (
              <li key={team.id}>
                <button
                  disabled={updating || team.id === activeTenant}
                  onClick={() => handleSwitchTeam(team.id)}
                  data-testid={`settings-btn-switch-team-${team.id}`}
                >
                  {team.name} ({team.roles?.join(", ") || "no roles"})
                  {team.id === activeTenant ? " (active)" : ""}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h3>App</h3>
        <p className="profile-info"><strong>Version:</strong> 2.0.0</p>
        <button
          className="btn-danger btn-small"
          onClick={handleSignOut}
          style={{ marginTop: 12 }}
          data-testid="settings-btn-signout"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
