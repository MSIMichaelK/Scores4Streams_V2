import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, getIdTokenResult } from "firebase/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [claims, setClaims] = useState({ role: null, tenantId: null, roles: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Create default Firestore user profile if it doesn't exist
        const db = getFirestore();
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          const defaultTeamId = "defaultTeam";
          await setDoc(userRef, {
            email: user.email,
            activeTenant: defaultTeamId,
            memberships: {
              [defaultTeamId]: {
                roles: ["viewer"]
              }
            }
          });
        }

        const tokenResult = await getIdTokenResult(user);
        // Force refresh to ensure updated custom claims
        const refreshedTokenResult = await user.getIdTokenResult(true);

        setUser(user);
        let activeTenant = refreshedTokenResult.claims.tenantId;
        let roles = refreshedTokenResult.claims.roles;
        let role = refreshedTokenResult.claims.role;

        if (!activeTenant || !roles) {
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            activeTenant = data.activeTenant;
            roles = data.memberships?.[activeTenant]?.roles || [];
            role = roles[0] || null;
          }
        }

        setClaims({
          tenantId: activeTenant || null,
          roles: roles || [],
          role: role || null
        });
      } else {
        setUser(null);
        setClaims({ role: null, tenantId: null, roles: [] });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const claimsReady = !!user && !!claims.tenantId && claims.roles.length > 0;
  return (
    <AuthContext.Provider value={{ user, role: claims.role, roles: claims.roles, tenantId: claims.tenantId, loading, claimsReady }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => useContext(AuthContext);