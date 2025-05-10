

const admin = require("firebase-admin");
const path = require("path");

const serviceAccount = require(path.join(__dirname, "../service-account.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const states = [
  { state_id: "vic", name: "Victoria", version: 1 },
  { state_id: "nsw", name: "New South Wales", version: 1 },
  { state_id: "qld", name: "Queensland", version: 1 },
  { state_id: "sa", name: "South Australia", version: 1 },
  { state_id: "wa", name: "Western Australia", version: 1 },
  { state_id: "tas", name: "Tasmania", version: 1 },
  { state_id: "nt", name: "Northern Territory", version: 1 },
  { state_id: "act", name: "Australian Capital Territory", version: 1 }
];

const regions = [
  { region_id: "melbourne_west", name: "Melbourne West", state_id: "vic", version: 1 },
  { region_id: "brisbane_east", name: "Brisbane East", state_id: "qld", version: 1 },
  { region_id: "sydney_north", name: "Sydney North", state_id: "nsw", version: 1 },
  { region_id: "adelaide_south", name: "Adelaide South", state_id: "sa", version: 1 }
];

const state_associations = [
  { state_association_id: "softball_vic", name: "Softball Victoria", state_id: "vic", version: 1 },
  { state_association_id: "softball_qld", name: "Softball Queensland", state_id: "qld", version: 1 },
  { state_association_id: "softball_nsw", name: "Softball New South Wales", state_id: "nsw", version: 1 }
];

const associations = [
  { association_id: "sunshine", name: "Sunshine Softball Association", region_id: "melbourne_west", state_association_id: "softball_vic", version: 1 },
  { association_id: "northern_districts", name: "Northern Districts Softball Association", region_id: "melbourne_west", state_association_id: "softball_vic", version: 1 },
  { association_id: "redlands", name: "Redlands Softball Association", region_id: "brisbane_east", state_association_id: "softball_qld", version: 1 }
];

const clubs = [
  { club_id: "hawks", name: "Hawks Softball Club", association_id: "sunshine", version: 1 },
  { club_id: "panthers", name: "Panthers Softball Club", association_id: "sunshine", version: 1 },
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
  console.log("⚙️  Seeding Firestore hierarchy: states, regions, state_associations, associations, clubs...");
  await seedCollection("states", states, "state_id");
  await seedCollection("regions", regions, "region_id");
  await seedCollection("state_associations", state_associations, "state_association_id");
  await seedCollection("associations", associations, "association_id");
  await seedCollection("clubs", clubs, "club_id");
  console.log("✅ Firestore hierarchy seeding complete.");
}

main().catch(console.error);