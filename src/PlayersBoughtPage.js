// PlayersBoughtPage.js
//-------------------------------------------------------
// Lets user click team → see full list of players bought
// ✅ Removed duplicate back button (only use top-left global back button)
// ✅ Reduced table length with scrollable container
// ✅ Made team list scrollable (for 12+ teams)
//-------------------------------------------------------

import React, { useState } from "react";
import "./AuctionBackground.css";

export default function PlayersBoughtPage({ teams }) {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const list = Object.values(teams || {});

  if (selectedTeam) {
    return (
      <div className="center-box">
        <h2 className="page-title">{selectedTeam.name} - Players Bought</h2>
        {(!selectedTeam.history || selectedTeam.history.length === 0) && (
          <p>No players bought yet.</p>
        )}

        {/* ✅ Scrollable area for the selected team's bought players */}
        <div
          className="scroll-area"
          style={{
            boxShadow: `0 0 12px ${selectedTeam.theme}`,
            marginTop: "15px",
          }}
        >
          <table className="players-list-table">
            <thead>
              <tr>
                <th>Sl No.</th>
                <th>Player</th>
              </tr>
            </thead>
            <tbody>
              {selectedTeam.history &&
                selectedTeam.history.map((h, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{h.playerName}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {/* ❌ Removed redundant Back button since global one already exists */}
      </div>
    );
  }

  return (
    <div className="center-box">
      <h2 className="page-title">Players Bought</h2>
      {list.length === 0 && <p>No teams joined yet</p>}

      {/* ✅ Scrollable team bars area */}
      <div className="scroll-area" style={{ marginTop: "15px" }}>
        {list.map((t, idx) => (
          <div
            key={idx}
            className="purse-bar"
            style={{
              borderColor: t.theme,
              boxShadow: `0 0 12px ${t.theme}`,
              cursor: "pointer",
            }}
            onClick={() => setSelectedTeam(t)}
          >
            {t.name}
          </div>
        ))}
      </div>
    </div>
  );
}
