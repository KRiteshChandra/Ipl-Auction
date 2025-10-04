// RemainingPursePage.js
//-------------------------------------------------------
// Displays each team's remaining purse in Crores
// Updates live as players are bought (Firestore synced)
//-------------------------------------------------------

import React from "react";
import "./AuctionBackground.css";

export default function RemainingPursePage({ teams }) {
  // Firestore teams object → array
  const list = Object.values(teams || {});
  
  return (
    <div className="center-box">
      <h2 className="page-title">Remaining Purse (in Crores)</h2>
      
      {list.length === 0 && <p>No teams joined yet</p>}

      {/* ✅ Scrollable container for team purse bars */}
      <div className="scroll-area" style={{ marginTop: "15px" }}>
        {list.map((t, idx) => (
          <div
            key={idx}
            className="purse-bar"
            style={{ borderColor: t.theme, boxShadow: `0 0 12px ${t.theme}` }}
          >
            <span>{t.name}</span>
            {/* ✅ Convert Lakhs → Crores only */}
            <span>₹{(t.purse / 100).toFixed(2)} Cr</span>
          </div>
        ))}
      </div>
    </div>
  );
}
