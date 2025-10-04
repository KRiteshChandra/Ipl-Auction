//-------------------------------------------------------
// Per-room Firestore management (auction sessions).
//-------------------------------------------------------
import { db } from "./firebaseConfig";
import {
  doc, setDoc, updateDoc,
  deleteDoc, onSnapshot, collection,
  runTransaction, deleteField
} from "firebase/firestore";

// 🏠 Create room document
export async function createRoom(roomId, config, createdBy) {
  if (!roomId) throw new Error("Room ID cannot be empty");
  await setDoc(doc(db, "rooms", roomId), {
    roomId,
    auctionState: "notStarted",
    accessType: "public",      // default to public, host can toggle
    createdBy,                 // store the deviceId of the creator
    ...config,
    teams: {},
    currentPlayer: null,
    currentBid: null,
    currentBidTeam: null,
    status: null,
    auctionMode: "auto",
    jumpBidAllowed: false,
    accessMode: "max"          // maintain consistency with App.js
  });
}

// 🚪 Join team into room
export async function joinRoom(roomId, teamObj) {
  const ref = doc(db, "rooms", roomId);

  // ✅ Wrap in transaction to avoid race conditions
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Room not found");
    if (snap.data().auctionState === "ended") throw new Error("Auction ended");

    const room = snap.data();

    // 🔒 Team limit check
    const currentTeams = room.teams ? Object.keys(room.teams).length : 0;
    if (currentTeams >= room.numTeams) {
      throw new Error("Maximum number of teams already joined this room!");
    }

    // 🔒 Prevent duplicate team name
    if (room.teams && room.teams[teamObj.name]) {
      throw new Error("That team name already exists in this room!");
    }

    // ✅ Allocate purse from host's configured budget
    const teamData = {
      ...teamObj,
      purse: room.budget,
      history: [],          // initialize empty player history
    };

    // ✅ Transactionally merge new team into teams map
    tx.set(ref, { teams: { [teamObj.name]: teamData } }, { merge: true });
  });
}

// 🔒 End auction
export async function endAuction(roomId) {
  await updateDoc(doc(db, "rooms", roomId), { auctionState: "ended" });
}

// ❌ Delete room
export async function deleteRoom(roomId) {
  await deleteDoc(doc(db, "rooms", roomId));
}

// ❌ Remove a team from a room
export async function removeTeamFromRoom(roomId, teamName) {
  await updateDoc(doc(db, "rooms", roomId), {
    [`teams.${teamName}`]: deleteField(),
  });
}

// 👂 Listen to single room changes (final corrected version)
export function listenRoom(roomId, callback) {
  return onSnapshot(doc(db, "rooms", roomId), (snap) => {
    if (!snap.exists()) {
      // ✅ prevents "Loading..." loop in App.js
      callback({ notFound: true });
      return;
    }

    const data = snap.data();

    // ✅ Ensure currentPlayer never contains raw base64 image
    let safePlayer = null;
    if (data.currentPlayer) {
      const p = data.currentPlayer;
      safePlayer = {
        id: p?.id || null,
        name: p?.name || "",
        jerseyNumber: p?.jerseyNumber || "",
        playerSet: p?.playerSet || "",
        category: p?.category || "",
        role: p?.role || "",
        basePrice: Number(p?.basePrice) || 0,
        country: p?.country || "",
        imageURL: p?.imageURL || null, // keep only reference to image URL
      };
    }

    callback({ id: snap.id, ...data, currentPlayer: safePlayer });
  });
}

// 👂 Listen to all rooms overview
export function listenAllRooms(callback) {
  return onSnapshot(collection(db, "rooms"), (snap) => {
    callback(
      snap.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }))
    );
  });
}
