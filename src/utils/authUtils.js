import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth } from "firebase/auth";
import { getApp } from "firebase/app";

// Calls the backend to assign custom claims
export const callSetCustomClaims = async () => {
  const auth = getAuth();
  const app = getApp(); // ✅ ensure initialized app is fetched safely
  const functions = getFunctions(app, "us-central1"); // ✅ defer until runtime

  try {
    const setClaims = httpsCallable(functions, "setCustomClaims");
    const result = await setClaims(); // no data needed — it reads Firestore
    console.log("✅ Custom claims set:", result.data);

    // Force refresh of ID token so claims are available client-side
    await auth.currentUser.getIdToken(true);
    console.log("🔄 Token refreshed");
  } catch (error) {
    console.error("❌ Failed to set custom claims:", error.message);
  }
};