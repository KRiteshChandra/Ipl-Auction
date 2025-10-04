//-------------------------------------------------------
// Shows all room documents + teams in them (admin view).
//-------------------------------------------------------
import React, { useEffect, useState } from "react";
import { listenAllRooms, listenRoom, deleteRoom, } from "./firestoreRooms";
import { doc, updateDoc, deleteField } from "firebase/firestore";
import { db } from "./firebaseConfig";

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);   // null = show room list
  const [roomData, setRoomData] = useState(null);

  // 👂 Listen to all rooms only when not inside a specific room
  useEffect(() => {
    if (!selectedRoom) {
      const unsub = listenAllRooms(setRooms);
      return () => unsub();
    }
  }, [selectedRoom]);

  // 👂 Listen to one room’s teams when selected
  useEffect(() => {
    if (selectedRoom) {
      const unsub = listenRoom(selectedRoom, setRoomData);
      return () => unsub();
    }
  }, [selectedRoom]);

  // 🗑️ Delete whole room
  const handleDeleteRoom = async (roomId) => {
    if (window.confirm(`Delete room ${roomId} permanently?`)) {
      await deleteRoom(roomId);

      // Clear localStorage if this device was inside that room
      const myRoom = localStorage.getItem("myRoomId");
      if (myRoom === roomId) {
        localStorage.removeItem("myRoomId");
        localStorage.removeItem("myTeam");
      }
    }
  };

  // ❌ Remove a team from inside a room
  const handleRemoveTeam = async (teamName) => {
    if (!window.confirm(`Remove team ${teamName} from room ${selectedRoom}?`)) return;

    await updateDoc(doc(db, "rooms", selectedRoom), {
      [`teams.${teamName}`]: deleteField(),
    });

    // 🏠 If the current browser was that team, kick them out
    const myTeam = localStorage.getItem("myTeam");
    const myRoom = localStorage.getItem("myRoomId");
    if (myTeam === teamName && myRoom === selectedRoom) {
      localStorage.removeItem("myTeam");
      localStorage.removeItem("myRoomId");
    }
  };

  // =========================
  //   TEAMS INSIDE A ROOM
  // =========================
  if (selectedRoom) {
    return (
      <div className="center-box">
        <h2 className="page-title">Teams in Room {selectedRoom}</h2>

        {roomData?.teams
          ? Object.values(roomData.teams).map((t) => (
              <div key={t.name} className="purse-bar">
                <span>
                  {t.name} – Purse: ₹{t.purse} Lakhs
                </span>
                <button
                  className="delete-btn"
                  onClick={() => handleRemoveTeam(t.name)}
                >
                  ❌
                </button>
              </div>
            ))
          : <p>No teams joined yet</p>
        }

        <button className="menu-bar" onClick={() => setSelectedRoom(null)}>
          ⬅ Back to All Rooms
        </button>
      </div>
    );
  }

  // =========================
  //   ALL ROOMS LIST
  // =========================
  return (
    <div className="center-box">
      <h2 className="page-title">All Auction Rooms</h2>

      {rooms.length === 0 && <p>No rooms active</p>}

      {rooms.map((r) => (
        <div key={r.roomId} className="purse-bar">
          {/* Clicking bar enters team view */}
          <span
            style={{ cursor: "pointer", flex: 1 }}
            onClick={() => setSelectedRoom(r.roomId)}
          >
            Room: {r.roomId} ({r.auctionState || "notStarted"})
          </span>

          {/* ❌ Delete Room button on right */}
          <button
            className="delete-btn"
            onClick={() => handleDeleteRoom(r.roomId)}
          >
            ❌
          </button>
        </div>
      ))}
    </div>
  );
}
