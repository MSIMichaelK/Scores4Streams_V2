

const admin = require("firebase-admin");
const path = require("path");

const serviceAccount = require(path.join(__dirname, "../service-account.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

const collectionsToDelete = [
  "users",
  "teams",
  "games",
  "memberships",
  "GameLive",
  "PlayerBattingStatistics",
  "PlayerPitchingStatistics",
  "PlayerFieldingStatistics",
  "PlayerTeam",
  "LineupLive",
  "EventLive",
  "RunnerOnBaseLive"
];

async function deleteCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  const batchSize = snapshot.size;
  if (batchSize === 0) {
    console.log(`✔ ${collectionName}: already empty`);
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  console.log(`✔ Deleted ${batchSize} docs from ${collectionName}`);
}

async function deleteAllUsers(nextPageToken) {
  const listUsersResult = await auth.listUsers(1000, nextPageToken);
  const uids = listUsersResult.users.map(user => user.uid);
  if (uids.length) {
    await auth.deleteUsers(uids);
    console.log(`✔ Deleted ${uids.length} users`);
  }
  if (listUsersResult.pageToken) {
    await deleteAllUsers(listUsersResult.pageToken);
  }
}

async function main() {
  console.log("⚠ Starting deletion of collections and users...");
  for (const collection of collectionsToDelete) {
    await deleteCollection(collection);
  }
  await deleteAllUsers();
  console.log("✅ All specified collections and users cleared.");
}

main().catch(err => {
  console.error("❌ Error clearing data:", err);
});