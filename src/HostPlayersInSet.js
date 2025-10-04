// HostPlayersInSet.js
//-------------------------------------------------------
// Shows players inside a chosen set
//-------------------------------------------------------

import React from "react";

export default function HostPlayersInSet({ players, setName, onSelectPlayer }) {
  // ✅ Filter players by set
  let filtered = players.filter(p => p.playerSet === setName);

  // ✅ Sort players by jersey number (numeric), fallback by name
  filtered = filtered.sort((a, b) => {
    if (a.jerseyNumber && b.jerseyNumber) {
      return Number(a.jerseyNumber) - Number(b.jerseyNumber);
    }
    return a.name.localeCompare(b.name);
  });

  // ✅ Sanitize player before sending to Firestore
  const handleSelect = (player) => {
    const safePlayer = {
      id: player?.id || null,
      name: player?.name || "",
      jerseyNumber: player?.jerseyNumber || "",
      playerSet: player?.playerSet || "",
      category: player?.category || "",
      role: player?.role || "",
      basePrice: Number(player?.basePrice) || 0,
      country: player?.country || "",
      imageURL: player?.imageURL || null   // ✅ now use Storage URL instead of imageDocId
    };

    onSelectPlayer(safePlayer); // pass sanitized player forward
  };

  return (
    <div className="center-box">
      <h2 className="page-title">Players in {setName}</h2>
      {filtered.length === 0 ? (
        // ✅ Fallback message if no players in the set
        <p style={{ fontStyle: "italic" }}>🚫 No players found in this set</p>
      ) : (
        filtered.map(p => (
          <button
            key={p.id}  // ✅ use stable Firestore id
            className="menu-bar"
            onClick={() => handleSelect(p)}
          >
            {p.jerseyNumber} - {p.name} ({p.role}, ₹{p.basePrice}L)
          </button>
        ))
      )}
    </div>
  );
}