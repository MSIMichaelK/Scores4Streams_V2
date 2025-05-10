const admin = require("firebase-admin");
const path = require("path");

const serviceAccount = require(path.join(__dirname, "../service-account.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const associations = [
  { association_id: "sunshine_softball", name: "Sunshine Softball Association", version: 1 },
  { association_id: "northern_districts", name: "Northern Districts Softball Association", version: 1 },
  { association_id: "redlands", name: "Redlands Softball Association", version: 1 }
];

const clubs = [
  { club_id: "hawks", name: "Hawks Softball Club", association_id: "sunshine_softball", version: 1 },
  { club_id: "panthers", name: "Panthers Softball Club", association_id: "sunshine_softball", version: 1 },
  { club_id: "falcons", name: "Falcons Softball Club", association_id: "northern_districts", version: 1 },
  { club_id: "koalas", name: "Koalas Softball Club", association_id: "redlands", version: 1 }
];

async function seedCollection(collectionName, documents, idKey) {
  const batch = db.batch();
  documents.forEach(doc => {
    const ref = db.collection(collectionName).doc(doc[idKey]);
    batch.set(ref, doc);
  });
  await batch.commit();
  console.log(`✅ Seeded ${documents.length} docs to ${collectionName}`);
}

async function main() {
  console.log("⚙️  Seeding Firestore: associations and clubs...");
  await seedCollection("associations", associations, "association_id");
  await seedCollection("clubs", clubs, "club_id");
  console.log("✅ Associations and clubs seeding complete.");
}

main().catch(console.error);
