import React from "react";

export default function HostSetsPage({ players, onSelectSet }) {
  let uniqueSets = [...new Set(players.map(p => p.playerSet))];

  // ✅ Sort sets: numeric "Set X" first in order, then others alphabetically
  uniqueSets = uniqueSets.sort((a, b) => {
    const isNumA = a.startsWith("Set");
    const isNumB = b.startsWith("Set");
    if (isNumA && isNumB) {
      return parseInt(a.split(" ")[1]) - parseInt(b.split(" ")[1]);
    }
    if (isNumA) return -1;
    if (isNumB) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="center-box">
      <h2 className="page-title">Select Set</h2>
      {uniqueSets.length === 0 ? (
        // ✅ Fallback if there are no sets
        <p style={{ fontStyle: "italic" }}>🚫 No sets available</p>
      ) : (
        uniqueSets.map(set => (
          <button
            key={set}
            className="menu-bar"
            onClick={() => onSelectSet(set)}
          >
            {set}
          </button>
        ))
      )}
    </div>
  );
}