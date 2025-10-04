// PlayersListPage.js
//-------------------------------------------------------
// Lists all players (continues table view) sorted by playerSet.
//-------------------------------------------------------

import React from "react";
import "./AuctionBackground.css";

export default function PlayersListPage({ players }) {
  // 🔹 Sort players continuously based on their playerSet value
  const sortedPlayers = [...players].sort((a, b) => {
    const parseSetValue = (set) => {
      if (!set) return 9999; // unknown -> end
      const match = set.match(/^Set\s*(\d+)$/i);
      if (match) return parseInt(match[1]);
      // mapping for uncapped/capped categories
      const order = [
        "Uncapped Batsmen",
        "Uncapped Wicket Keeper",
        "Uncapped All Rounder",
        "Uncapped Bowler",
        "Capped Batsmen",
        "Capped Wicket Keeper",
        "Capped All Rounder",
        "Capped Bowler",
      ];
      const idx = order.indexOf(set.trim());
      return idx >= 0 ? 1000 + idx : 9999;
    };

    return parseSetValue(a.playerSet) - parseSetValue(b.playerSet);
  });

  return (
    <div className="center-box">
      <h2 className="page-title">Players List</h2>

      {/* Continuous scrollable table area */}
      <div className="scroll-area" style={{ marginTop: "15px" }}>
        <table className="players-list-table">
          <thead>
            <tr>
              <th>Sl No.</th>
              <th>Player Name</th>
              <th>Category</th>
              <th>Role</th>
              <th>Base Price</th>
              <th>Sold Price</th>
              <th>Team</th>
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.length === 0 ? (
              <tr>
                <td colSpan="7">No players available</td>
              </tr>
            ) : (
              sortedPlayers.map((p, idx) => (
                <tr key={p.id || idx}>
                  <td>{idx + 1}</td>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>{p.role}</td>
                  <td>₹{p.basePrice} Lakhs</td>
                  <td>{p.soldPrice ? `₹${p.soldPrice} Lakhs` : ""}</td>
                  <td>{p.team || ""}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
