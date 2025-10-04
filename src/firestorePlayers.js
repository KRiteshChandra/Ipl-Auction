//-------------------------------------------------------
// Global player pool CRUD (= PlayerManager backend).
//-------------------------------------------------------
import { db } from "./firebaseConfig";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";

const playersRef = collection(db, "players");

// ➕ Create player (metadata + imageURL directly)
export async function createPlayer(player) {
  // ✅ Sanitize metadata
  const safePlayer = {
    name: player?.name || "",
    jerseyNumber: player?.jerseyNumber?.toString() || "",
    playerSet: player?.playerSet || "Set 1",
    category: player?.category || "M",
    role: player?.role || "Bat",
    basePrice: Number(player?.basePrice) || 0,
    country: player?.country || "India",
    originalSet: player?.playerSet || "Set 1",
    soldPrice: player?.soldPrice ?? null,
    team: player?.team ?? null,
    status: player?.status ?? null,
    imageURL: player?.imageURL || null   // ✅ now store image URL directly
  };

  // Step 1: add player metadata
  const docRef = await addDoc(playersRef, safePlayer);
  return { id: docRef.id, ...safePlayer };
}

// ✏️ Update player (metadata only with imageURL)
export async function updatePlayer(id, updates) {
  const safeUpdates = { ...updates };

  if (safeUpdates.basePrice !== undefined) {
    safeUpdates.basePrice = Number(safeUpdates.basePrice) || 0;
  }

  // ✅ Apply other updates to player metadata (including imageURL if present)
  await updateDoc(doc(db, "players", id), safeUpdates);
}

// 🗑️ Delete player
export async function deletePlayer(id) {
  // Just remove the player doc (Storage files are managed separately in storage)
  await deleteDoc(doc(db, "players", id));
}

// 👂 Real-time listen to whole pool
export function listenPlayers(callback) {
  return onSnapshot(playersRef, (snap) => {
    let list = snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return { id: docSnap.id, ...data };
    });
    callback(list);
  });
}