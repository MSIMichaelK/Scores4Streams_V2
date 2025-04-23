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
      if (!user) {
        //console.log("⚠️ No user yet — skipping fetch.");
        return;
      }

      //console.log("👤 Fetching Firestore data for user:", user.uid);
      const db = getFirestore();
      const userRef = doc(db, "users", user.uid);
      try {
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          //console.log("📄 Fetched user doc:", JSON.stringify(data, null, 2));
          setMemberships(data.memberships || {});
          setActiveTenant(data.activeTenant);
        } else {
          //console.log("❌ User document not found in Firestore");
        }
      } catch (err) {
        //console.error("🔥 Error fetching Firestore doc:", err);
      }
    };

    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (user) {
      user.getIdToken(true).then(() => {
        //console.log("🔄 Forced ID token refresh");
      });
    }
  }, [user]);

  const handleSwitchTeam = async (newTenantId) => {
    if (!user || newTenantId === activeTenant) return;

    setUpdating(true);
    const db = getFirestore();
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      activeTenant: newTenantId
    });

    await callSetCustomClaims();
    setActiveTenant(newTenantId);
    setUpdating(false);
  };

  const handleSignOut = () => {
    const auth = getAuth();
    signOut(auth).then(() => {
      console.log("🔓 User signed out");
    });
  };

  if (loading) return <p>Loading profile...</p>;
  if (!user && !loading) {
    navigate("/login");
    return null;
  }
  //console.log("🔥 memberships (FULL):", JSON.stringify(memberships, null, 2));
  //console.log("🔥 keys(memberships):", Object.keys(memberships));
  //console.log("🔥 activeTenant:", activeTenant);
  //console.log("🔥 roles for activeTenant:", memberships?.[activeTenant]?.roles);
  return (
    <div>
      <h2>Profile</h2>
      <p><strong>Email:</strong> {user?.email}</p>
      <p><strong>Role(s):</strong> {Array.isArray(memberships?.[activeTenant]?.roles) ? memberships[activeTenant].roles.join(", ") : "none"}</p>
      <p><strong>Active Team:</strong> {activeTenant}</p>
      <p><strong>Team Count:</strong> {Object.keys(memberships).length}</p>

      {Object.keys(memberships).length > 1 && (
        <>
          <h3>Switch Team</h3>
          <ul>
            {Object.entries(memberships).map(([teamId, info]) => (
              <li key={teamId}>
                <button
                  disabled={updating || teamId === activeTenant}
                  onClick={() => handleSwitchTeam(teamId)}
                >
                  {teamId} ({Array.isArray(info.roles) ? info.roles.join(", ") : "no roles"})
                  {teamId === activeTenant ? " ✅" : ""}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <button onClick={handleSignOut}>Sign Out</button>
      <hr />
      <GameCreationForm />
      <GameList />
    </div>
  );
};

export default Console;