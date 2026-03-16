import { getFirestore, doc, getDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getTeam } from "../hooks/useTeams";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [claims, setClaims] = useState({ role: null, tenantId: null, roles: [] });
  const [teamName, setTeamName] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);

        // Try to read claims from token first
        const tokenResult = await user.getIdTokenResult(true);
        let activeTenant = tokenResult.claims.tenantId;
        let roles = tokenResult.claims.roles;
        let role = tokenResult.claims.role;

        // Fall back to Firestore user doc if token claims not set
        if (!activeTenant || !roles) {
          const db = getFirestore();
          // Retry up to 3 times with delay — AuthForm may still be writing the doc
          for (let attempt = 0; attempt < 3; attempt++) {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              activeTenant = data.activeTenant;
              if (activeTenant && data.memberships?.[activeTenant]) {
                roles = data.memberships[activeTenant].roles || [];
                role = roles[0] || null;
                break;
              }
            }
            // Wait 500ms before retry (AuthForm may still be writing)
            if (attempt < 2) {
              await new Promise(r => setTimeout(r, 500));
            }
          }
        }

        setClaims({
          tenantId: activeTenant || null,
          roles: roles || [],
          role: role || null
        });

        // Load team name for display
        if (activeTenant) {
          try {
            const team = await getTeam(activeTenant);
            setTeamName(team?.name || activeTenant);
          } catch {
            setTeamName(activeTenant);
          }
        }
      } else {
        setUser(null);
        setClaims({ role: null, tenantId: null, roles: [] });
        setTeamName(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const claimsReady = !!user && !!claims.tenantId && claims.roles.length > 0;
  return (
    <AuthContext.Provider value={{ user, role: claims.role, roles: claims.roles, tenantId: claims.tenantId, teamName, loading, claimsReady }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => useContext(AuthContext);
