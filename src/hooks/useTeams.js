import { getFirestore, collection, doc, addDoc, getDoc, getDocs, updateDoc, query, where, Timestamp } from "firebase/firestore";

const db = () => getFirestore();

/**
 * Create a new team document.
 * Returns the new team ID.
 */
export async function createTeam({ name, shortName = "", logoUrl = "", createdBy }) {
  const teamRef = await addDoc(collection(db(), "teams"), {
    name,
    shortName: shortName || name.substring(0, 4).toUpperCase(),
    logoUrl,
    createdBy,
    createdAt: Timestamp.now(),
  });
  return teamRef.id;
}

/**
 * Get a single team document by ID.
 * Returns { id, ...data } or null.
 */
export async function getTeam(teamId) {
  const snap = await getDoc(doc(db(), "teams", teamId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * List all teams that a user is a member of.
 * Takes the memberships map from the user doc and resolves team names.
 */
export async function listUserTeams(memberships) {
  if (!memberships || Object.keys(memberships).length === 0) return [];

  const teamIds = Object.keys(memberships);
  const teams = [];

  for (const teamId of teamIds) {
    const team = await getTeam(teamId);
    if (team) {
      teams.push({
        ...team,
        roles: memberships[teamId].roles || [],
      });
    } else {
      // Team doc doesn't exist (legacy data) — use denormalized name if available
      teams.push({
        id: teamId,
        name: memberships[teamId].teamName || teamId,
        shortName: "",
        roles: memberships[teamId].roles || [],
      });
    }
  }

  return teams;
}

/**
 * Update a team document.
 */
export async function updateTeam(teamId, updates) {
  await updateDoc(doc(db(), "teams", teamId), updates);
}
