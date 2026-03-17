import { getAuth } from "firebase/auth";

const FUNCTIONS_URL = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL;

/**
 * Call the setClaims cloud function to set custom claims on the user's token.
 * Non-critical: AuthContext has a Firestore fallback if this fails.
 * Returns true on success, false on failure (never throws).
 */
export const callSetCustomClaims = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return false;

  try {
    const idToken = await user.getIdToken();

    const response = await fetch(`${FUNCTIONS_URL}/setCustomClaims`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${idToken}`,
        "Content-Type": "application/json"
      },
    });

    if (!response.ok) {
      console.warn("setClaims returned", response.status, "— using Firestore fallback");
      return false;
    }

    await response.json();

    // Force token refresh to pick up new claims
    await auth.currentUser?.getIdToken(true);
    return true;
  } catch (error) {
    console.warn("setClaims failed:", error.message, "— using Firestore fallback");
    return false;
  }
};
