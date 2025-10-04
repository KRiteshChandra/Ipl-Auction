//-------------------------------------------------------
// Each Team's device screen
// - Shows team's bidding interface
// - Enter → Bid button with fade/disabled logic
// - Jump Bid option if host allows
// - History of players already bought
//-------------------------------------------------------

import React, { useState, useEffect } from "react";
import "./AuctionBackground.css";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

export default function BiddingRoom({ roomData, roomId, jumpBidAllowed, setPage }) {
  const [entered, setEntered] = useState(false);
  const [jumpBid, setJumpBid] = useState("");

  // ✅ Remember this device’s team identity
  const teamName = localStorage.getItem("myTeam");
  const thisTeam = roomData?.teams?.[teamName];

  // 🧭 Removed “team removed” logic — teams are never auto‑kicked
  useEffect(() => {
    // we simply wait for room data; no removal check
  }, []);

  // ✅ Early guard: show joining message until data arrives
  if (!roomData) {
    return (
      <div className="center-box">
        <h2>Joining room…</h2>
      </div>
    );
  }

  const teamTheme = thisTeam?.theme || "gray";
  const purse = thisTeam?.purse ?? 0;

  // Auction state from Firestore
  const currentPlayer = roomData?.currentPlayer;
  const currentBid = roomData?.currentBid;
  const currentBidTeam = roomData?.currentBidTeam;
  const status = roomData?.status;
  const auctionMode = roomData?.auctionMode || "auto";

  // Derived data
  const safeHistory = Array.isArray(thisTeam?.history) ? thisTeam.history : [];
  const overseasCount = safeHistory.filter((h) => h.country !== "India").length;

  // Disable logic for bidding
  const disabled =
    !currentPlayer ||
    status === "SOLD" ||
    status === "UNSOLD" ||
    purse < ((currentBid || currentPlayer?.basePrice) + 10) ||
    safeHistory.length >= (roomData?.maxPlayers || 25) ||
    overseasCount >= (roomData?.maxOverseas || 8) ||
    currentBidTeam === teamName ||
    auctionMode === "manual";

  // ✅ Handle normal + jump bid
  const handleBid = async () => {
    if (!currentPlayer) return;

    let newBid;
    if (jumpBid && !isNaN(jumpBid)) {
      const val = Number(jumpBid);
      if (val > 0 && val <= purse) {
        newBid = val;
      } else {
        alert("Invalid jump bid (exceeds purse or zero).");
        return;
      }
    } else {
      const increment =
        currentBid < 100
          ? 10
          : currentBid < 1500
          ? 25
          : 50;
      newBid = currentBid ? currentBid + increment : currentPlayer?.basePrice;
    }

    await updateDoc(doc(db, "rooms", roomId), {
      currentBid: newBid,
      currentBidTeam: teamName,
    });

    setJumpBid("");
  };

  return (
    <div className="center-box bidding-room" style={{ "--team-color": teamTheme }}>
      {/* Team name heading */}
      <h2 className="bidding-team-name">{teamName}</h2>

      {/* ===== Main auction info table ===== */}
      <table className="bidding-table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Current Bid</th>
            <th>By</th>
            <th>Purse</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {/* Player name */}
            <td>{currentPlayer?.name || "--"}</td>

            {/* ✅ Animate only numeric value */}
            <td className="roll-up-cell">
              {currentBid !== null && currentBid !== undefined ? (
                <>
                  <span className="currency">₹</span>
                  <span className="roll-up">{currentBid}</span>
                  <span>&nbsp;Lakhs</span>
                </>
              ) : (
                "--"
              )}
            </td>

            {/* ✅ “By” column → current bidding team */}
            <td>{currentBidTeam || "--"}</td>

            {/* ✅ Static purse (remaining budget) */}
            <td>₹{(purse / 100).toFixed(2)} Cr</td>
          </tr>
        </tbody>
      </table>

      {/* ✅ Jump Bid input (if host allows) */}
      {jumpBidAllowed && entered && (
        <div style={{ margin: "10px" }}>
          <input
            type="number"
            placeholder="Enter Jump Bid Amount (Lakhs)"
            className="input-box"
            value={jumpBid}
            onChange={(e) => setJumpBid(e.target.value)}
          />
        </div>
      )}

      {/* ===== Controls ===== */}
      <div className="bidding-controls">
        <button
          className="exit-btn"
          onClick={async () => {
            setEntered(false);
            if (roomData?.activeBidders) {
              await updateDoc(doc(db, "rooms", roomId), {
                activeBidders: roomData.activeBidders.filter(
                  (t) => t !== teamName
                ),
              });
            }
          }}
        >
          Exit Bidding
        </button>

        <div
          className="circle-btn-large"
          style={{
            opacity: !entered
              ? currentPlayer && status !== "SOLD" && status !== "UNSOLD"
                ? 1
                : 0.5
              : disabled
              ? 0.5
              : 1,
            pointerEvents: !entered
              ? currentPlayer && status !== "SOLD" && status !== "UNSOLD"
                ? "auto"
                : "none"
              : disabled
              ? "none"
              : "auto",
            boxShadow: `0 0 25px var(--team-color)`,
          }}
          onClick={async () => {
            if (!entered) {
              // First click: mark entered
              if (currentPlayer && status !== "SOLD" && status !== "UNSOLD") {
                setEntered(true);
                await updateDoc(doc(db, "rooms", roomId), {
                  activeBidders: Array.from(
                    new Set([...(roomData.activeBidders || []), teamName])
                  ),
                });
              }
            } else {
              // Second click: actual bid
              if (!disabled) handleBid();
            }
          }}
        >
          {entered ? "Bid" : "Enter"}
        </div>
      </div>

      {/* ===== History Table ===== */}
      <div className="history-container">
        <table className="history-table">
          <thead>
            <tr>
              <th>Sl No.</th>
              <th>Player</th>
              <th>Price (Lakhs)</th>
            </tr>
          </thead>
          <tbody>
            {safeHistory.length > 0 ? (
              safeHistory.map((h, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{h.playerName}</td>
                  <td>₹{h.price}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">No players bought yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
