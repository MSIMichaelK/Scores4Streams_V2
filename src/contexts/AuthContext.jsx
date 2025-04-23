import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, getIdTokenResult } from "firebase/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [claims, setClaims] = useState({ role: null, tenantId: null });
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
        setUser(user);
        setClaims({
          role: tokenResult.claims.role || null,
          tenantId: tokenResult.claims.tenantId || null,
        });
      } else {
        setUser(null);
        setClaims({ role: null, tenantId: null });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role: claims.role, tenantId: claims.tenantId, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => useContext(AuthContext);