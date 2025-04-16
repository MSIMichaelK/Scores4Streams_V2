import functions from "firebase-functions";
import admin from "firebase-admin";
import cors from "cors";

admin.initializeApp();
const db = admin.firestore();
const corsHandler = cors({ origin: true }); // Allow all origins for now

export const setCustomClaims = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).send("Unauthorized");
    }

    const idToken = authHeader.split("Bearer ")[1];
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      const uid = decoded.uid;

      const userDoc = await db.collection("users").doc(uid).get();
      if (!userDoc.exists) {
        return res.status(404).send("User not found");
      }

      const userData = userDoc.data();
      const activeTenant = userData.activeTenant;
      const role = userData.memberships?.[activeTenant]?.role;

      if (!activeTenant || !role) {
        return res.status(400).send("Invalid tenant or role");
      }

      await admin.auth().setCustomUserClaims(uid, {
        tenantId: activeTenant,
        role,
      });

      return res.status(200).json({
        data: {
          message: "Custom claims set successfully",
          tenantId: activeTenant,
          role,
        }
      });
    } catch (err) {
      console.error("Custom Claims Error:", err);
      return res.status(500).send("Internal error");
    }
  });
});