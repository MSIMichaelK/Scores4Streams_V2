import { getAuth } from "firebase/auth";

const FUNCTIONS_URL = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL;

export const callSetCustomClaims = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const idToken = await user.getIdToken();

  try {
    const response = await fetch(`${FUNCTIONS_URL}/setCustomClaims`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${idToken}`,
        "Content-Type": "application/json"
      },
    });

    if (!response.ok) {
      throw new Error("Custom claims request failed");
    }

    await response.json();

    // Force token refresh to pick up new claims
    await auth.currentUser.getIdToken(true);
  } catch (error) {
    console.error("Failed to set custom claims:", error.message);
  }
};
