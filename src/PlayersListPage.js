// PlayersListPage.js
//-------------------------------------------------------
// Lists all players in the pool (for this room)
// with their base price, sold price, and team.
//-------------------------------------------------------

import React from "react";
import "./AuctionBackground.css";

export default function PlayersListPage({ players }) {
  return (
    <div className="center-box">
      <h2 className="page-title">Players List</h2>
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
          {players.length === 0 ? (
            <tr>
              <td colSpan="7">No players available</td>
            </tr>
          ) : (
            players.map((p, idx) => (
              <tr key={idx}>
                <td>{idx+1}</td>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>{p.role}</td>
                <td>₹{p.basePrice} Lakhs</td>
                {/* ✅ format soldPrice with ₹ */}
                <td>{p.soldPrice ? `₹${p.soldPrice} Lakhs` : ""}</td>
                <td>{p.team || ""}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}