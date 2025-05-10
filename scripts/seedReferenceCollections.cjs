const admin = require("firebase-admin");
const path = require("path");

const serviceAccount = require(path.join(__dirname, "../service-account.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const states = [
  { state_id: "NSW", name: "New South Wales", version: 1 },
  { state_id: "VIC", name: "Victoria", version: 1 },
  { state_id: "QLD", name: "Queensland", version: 1 },
  { state_id: "WA", name: "Western Australia", version: 1 },
  { state_id: "SA", name: "South Australia", version: 1 },
  { state_id: "TAS", name: "Tasmania", version: 1 },
  { state_id: "ACT", name: "Australian Capital Territory", version: 1 },
  { state_id: "NT", name: "Northern Territory", version: 1 }
];

const ageGroups = [
  { age_group_id: "U10", name: "Under 10", version: 1 },
  { age_group_id: "U12", name: "Under 12", version: 1 },
  { age_group_id: "U14", name: "Under 14", version: 1 },
  { age_group_id: "U16", name: "Under 16", version: 1 },
  { age_group_id: "U19", name: "Under 19", version: 1 },
  { age_group_id: "OPEN", name: "Open", version: 1 }
];

const regions = [
  { region_id: "metro_sydney", name: "Metro Sydney", state_id: "NSW", version: 1 },
  { region_id: "northern_vic", name: "Northern Victoria", state_id: "VIC", version: 1 },
  { region_id: "gold_coast", name: "Gold Coast", state_id: "QLD", version: 1 },
  { region_id: "perth", name: "Perth Metro", state_id: "WA", version: 1 }
];

async function seedCollection(collectionName, documents) {
  const batch = db.batch();
  documents.forEach(doc => {
    const ref = db.collection(collectionName).doc(doc[`${collectionName.slice(0, -1)}_id`]);
    batch.set(ref, doc);
  });
  await batch.commit();
  console.log(`✅ Seeded ${documents.length} docs to ${collectionName}`);
}

async function main() {
  console.log("⚙️  Seeding Firestore reference collections...");
  await seedCollection("states", states);
  await seedCollection("age_groups", ageGroups);
  await seedCollection("regions", regions);
  console.log("✅ All reference collections seeded.");
}

main().catch(console.error);
