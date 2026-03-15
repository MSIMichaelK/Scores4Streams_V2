/**
 * Purge all test data from Firestore.
 * Deletes: all games (+ events subcollections), all users, all teams (+ players subcollections).
 *
 * Usage: node scripts/purge-test-data.js
 *
 * Requires: GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service account key,
 * or run from a machine with Application Default Credentials configured.
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

async function deleteCollection(collectionPath) {
  const snapshot = await db.collection(collectionPath).get();
  if (snapshot.empty) {
    console.log(`  ${collectionPath}: 0 docs (skip)`);
    return 0;
  }

  const batch = db.batch();
  let count = 0;
  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    count++;
  }
  await batch.commit();
  console.log(`  ${collectionPath}: ${count} docs deleted`);
  return count;
}

async function deleteCollectionWithSubcollections(parentPath, subcollectionName) {
  const parentDocs = await db.collection(parentPath).get();
  let total = 0;

  for (const parentDoc of parentDocs.docs) {
    const subPath = `${parentPath}/${parentDoc.id}/${subcollectionName}`;
    total += await deleteCollection(subPath);
  }

  total += await deleteCollection(parentPath);
  return total;
}

async function main() {
  console.log("Purging Firestore test data...\n");

  // Delete games + events subcollections
  console.log("Games:");
  await deleteCollectionWithSubcollections("games", "events");

  // Delete teams + players subcollections
  console.log("\nTeams:");
  await deleteCollectionWithSubcollections("teams", "players");

  // Delete users
  console.log("\nUsers:");
  await deleteCollection("users");

  console.log("\nDone. All test data purged.");
}

main().catch((err) => {
  console.error("Purge failed:", err);
  process.exit(1);
});
