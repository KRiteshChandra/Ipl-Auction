import React from "react";

export default function BiddingTeamSetup({
  teamName,
  setTeamName,
  teamTheme,
  setTeamTheme,
  budget,       // ✅ NEW: get budget from App.js
  onEnter
}) {
  const themes = [
  "#F7E03C", // CSK Yellow
  "#045093", // Mumbai Blue
  "#DA0001", // RCB Red
  "#3A225D", // KKR Purple
  "#EA1A8E", // RR Pink
  "#17449B", // DC Blue
  "#F26522", // SRH Orange
  "#004C97", // LSG Blue
  "#0B4973", // GT Navy
  "#D71920", // PBKS Red
  "#008080", // Teal
  "#00FFFF", // Cyan
  "#FF00FF", // Magenta
  "#32CD32", // Lime Green
  "#FFBF00", // Amber
  "#C0C0C0", // Silver
  "#8B4513", // Brown
  "#013220", // Dark Green
  "#40E0D0", // Turquoise
  "#4B0082", // Indigo
  "#87CEEB", // Sky Blue
  "#808000", // Olive
  "#FFDAB9", // Peach
  "#DC143C", // Crimson
  "#E6E6FA"  // Lavender
];
  return (
    <div className="center-box">
      <h2 className="page-title">Enter Team Details</h2>
      <input
        className="input-box"
        placeholder="Team Name"
        value={teamName}
        onChange={(e) => setTeamName(e.target.value)}
      />

      <div style={{ margin: "20px" }}>
        <h3 className="page-subtitle">Select Team Theme</h3>
        <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
          {themes.map((color) => (
            <div
              key={color}
              onClick={() => setTeamTheme(color)}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: color,
                border:
                  teamTheme === color ? "3px solid white" : "2px solid gray",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      </div>

      <button
        className="menu-bar"
        onClick={() =>
          onEnter({
            name: teamName,
            theme: teamTheme,
            history: []
          })
        }
      >
        Enter
      </button>
    </div>
  );
}