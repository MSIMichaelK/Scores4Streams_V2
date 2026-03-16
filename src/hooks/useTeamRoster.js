import { getFirestore, collection, doc, addDoc, getDoc, getDocs, updateDoc, query, where, orderBy, Timestamp } from "firebase/firestore";

const db = () => getFirestore();

/**
 * Add a player to a team's persistent roster.
 * Returns the new player ID.
 */
export async function addPlayer(teamId, { firstName, lastName, number }) {
  const name = `${firstName} ${lastName}`.trim();
  const playerRef = await addDoc(collection(db(), "teams", teamId, "players"), {
    firstName,
    lastName,
    name,
    number: String(number),
    active: true,
    createdAt: Timestamp.now(),
  });
  return playerRef.id;
}

/**
 * Get all active players for a team.
 * Returns array of { id, firstName, lastName, name, number, active }.
 */
export async function getActivePlayers(teamId) {
  const playersRef = collection(db(), "teams", teamId, "players");
  const q = query(playersRef, where("active", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get all players for a team (including inactive).
 */
export async function getAllPlayers(teamId) {
  const playersRef = collection(db(), "teams", teamId, "players");
  const snapshot = await getDocs(playersRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Update a player's details.
 */
export async function updatePlayer(teamId, playerId, updates) {
  // Recompute name if first/last changed
  if (updates.firstName !== undefined || updates.lastName !== undefined) {
    const playerSnap = await getDoc(doc(db(), "teams", teamId, "players", playerId));
    const existing = playerSnap.data();
    const firstName = updates.firstName ?? existing.firstName;
    const lastName = updates.lastName ?? existing.lastName;
    updates.name = `${firstName} ${lastName}`.trim();
  }
  await updateDoc(doc(db(), "teams", teamId, "players", playerId), updates);
}

/**
 * Soft-delete (deactivate) a player.
 */
export async function deactivatePlayer(teamId, playerId) {
  await updateDoc(doc(db(), "teams", teamId, "players", playerId), { active: false });
}

/**
 * Reactivate a deactivated player.
 */
export async function reactivatePlayer(teamId, playerId) {
  await updateDoc(doc(db(), "teams", teamId, "players", playerId), { active: true });
}
