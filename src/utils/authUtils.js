import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth } from "firebase/auth";
import { getApp } from "firebase/app";

// Calls the backend to assign custom claims
export const callSetCustomClaims = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const idToken = await user.getIdToken();

  try {
    const response = await fetch("https://us-central1-scores4streams-v2.cloudfunctions.net/setCustomClaims", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${idToken}`,
        "Content-Type": "application/json"
      },
    });

    if (!response.ok) {
      throw new Error("Custom claims request failed");
    }

    const result = await response.json();
    console.log("✅ Custom claims set:", result);

    // Force refresh
    await auth.currentUser.getIdToken(true);
    console.log("🔄 Token refreshed");

  } catch (error) {
    console.error("❌ Failed to set custom claims:", error.message);
  }
};