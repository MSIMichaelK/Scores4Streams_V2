const admin = require("firebase-admin");
const serviceAccount = require("../service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function seedTeams() {
  console.log("⚙️  Seeding Firestore: teams...");
  const teams = [
    {
      id: "team1",
      name: "Deer Park Men",
      club_id: "club1",
      association_id: "association1",
      region_id: "region1",
      state_id: "state1",
      age_group_id: "ageGroup1",
      team_type: "male",
      team_category: "Men's Open",
      home_field: "Field 1",
      logo_url: "",
    },
    {
      id: "team2",
      name: "Northern Men",
      club_id: "club2",
      association_id: "association2",
      region_id: "region2",
      state_id: "state2",
      age_group_id: "ageGroup2",
      team_type: "male",
      team_category: "Men's Open",
      home_field: "Field 2",
      logo_url: "",
    }
  ];

  for (const team of teams) {
    await db.collection("teams").doc(team.id).set(team);
    console.log(`✅ Seeded team: ${team.name}`);
  }

  console.log("✅ Team seeding complete.");
  process.exit(0);
}

seedTeams().catch((error) => {
  console.error("❌ Error seeding teams:", error);
  process.exit(1);
});
