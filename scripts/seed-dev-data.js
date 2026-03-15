/**
 * Seed Firestore with sample teams, players, and users for dev testing.
 *
 * Usage: node scripts/seed-dev-data.js
 *
 * Requires: GOOGLE_APPLICATION_CREDENTIALS env var pointing to a service account key,
 * or run from a machine with Application Default Credentials configured.
 */

import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

const TEAMS = [
  {
    name: "Thunder",
    shortName: "THU",
    players: [
      { firstName: "Alex", lastName: "Johnson", number: "1" },
      { firstName: "Sam", lastName: "Williams", number: "2" },
      { firstName: "Jordan", lastName: "Brown", number: "3" },
      { firstName: "Taylor", lastName: "Davis", number: "4" },
      { firstName: "Morgan", lastName: "Miller", number: "5" },
      { firstName: "Casey", lastName: "Wilson", number: "6" },
      { firstName: "Riley", lastName: "Moore", number: "7" },
      { firstName: "Jamie", lastName: "Anderson", number: "8" },
      { firstName: "Drew", lastName: "Thomas", number: "9" },
      { firstName: "Avery", lastName: "Jackson", number: "10" },
    ],
  },
  {
    name: "Lightning",
    shortName: "LTN",
    players: [
      { firstName: "Pat", lastName: "White", number: "11" },
      { firstName: "Chris", lastName: "Harris", number: "12" },
      { firstName: "Dakota", lastName: "Martin", number: "13" },
      { firstName: "Quinn", lastName: "Thompson", number: "14" },
      { firstName: "Reese", lastName: "Garcia", number: "15" },
      { firstName: "Skyler", lastName: "Martinez", number: "16" },
      { firstName: "Finley", lastName: "Robinson", number: "17" },
      { firstName: "Emerson", lastName: "Clark", number: "18" },
      { firstName: "Rowan", lastName: "Rodriguez", number: "19" },
      { firstName: "Sage", lastName: "Lewis", number: "20" },
    ],
  },
];

async function main() {
  console.log("Seeding Firestore with dev data...\n");

  const teamIds = [];

  for (const team of TEAMS) {
    // Create team doc
    const teamRef = await db.collection("teams").add({
      name: team.name,
      shortName: team.shortName,
      logoUrl: "",
      createdBy: "seed-script",
      createdAt: Timestamp.now(),
    });
    console.log(`Created team: ${team.name} (${teamRef.id})`);
    teamIds.push({ id: teamRef.id, name: team.name });

    // Create players
    for (const player of team.players) {
      await db.collection("teams").doc(teamRef.id).collection("players").add({
        firstName: player.firstName,
        lastName: player.lastName,
        name: `${player.firstName} ${player.lastName}`,
        number: player.number,
        active: true,
        createdAt: Timestamp.now(),
      });
    }
    console.log(`  Added ${team.players.length} players`);
  }

  // Create a sample user with both teams
  const sampleUserId = "sample-dev-user";
  const memberships = {};
  for (const team of teamIds) {
    memberships[team.id] = {
      roles: ["admin", "scorer"],
      teamName: team.name,
    };
  }

  await db.collection("users").doc(sampleUserId).set({
    email: "dev@example.com",
    activeTenant: teamIds[0].id,
    memberships,
  });
  console.log(`\nCreated user: dev@example.com (${sampleUserId})`);
  console.log(`  Active team: ${teamIds[0].name} (${teamIds[0].id})`);

  console.log("\nSeed complete. Team IDs:");
  for (const team of teamIds) {
    console.log(`  ${team.name}: ${team.id}`);
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
