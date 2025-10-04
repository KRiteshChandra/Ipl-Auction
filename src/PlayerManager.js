// src/PlayerManager.js
//-------------------------------------------------------
// React Manager (Firestore logic is imported separately).
//-------------------------------------------------------
import React, { useState, useEffect } from "react";

// ✅ Firestore CRUD
import {
  createPlayer,
  updatePlayer,
  deletePlayer,
  listenPlayers,
} from "./firestorePlayers";

export default function PlayerManager({ goHome }) {
  const [players, setPlayers] = useState([]);
  const [currentPage, setCurrentPage] = useState("home");
  const [editingIndex, setEditingIndex] = useState(null);

  // ✅ Real-time listener for players
  useEffect(() => {
    const unsubscribe = listenPlayers(setPlayers);
    return () => unsubscribe();
  }, []);

  const handleCreateNew = () => {
    setEditingIndex(null);
    setCurrentPage("form");
  };

  const handleEdit = (idx) => {
    setEditingIndex(idx);
    setCurrentPage("form");
  };

  const handleDelete = async (idx) => {
    if (window.confirm("Delete this player?")) {
      const id = players[idx].id;
      if (id) await deletePlayer(id);
    }
  };

  return (
    <>
      {currentPage === "home" && (
        <Dashboard
          players={players}
          onCreate={handleCreateNew}
          onEdit={handleEdit}
          onDelete={handleDelete}
          goBack={goHome}
        />
      )}
      {currentPage === "form" && (
        <PlayerForm
          players={players}
          editingIndex={editingIndex}
          setEditingIndex={setEditingIndex}
          goBack={() => setCurrentPage("home")}
        />
      )}
    </>
  );
}

function Dashboard({ players, onCreate, onEdit, onDelete, goBack }) {
  const [search, setSearch] = useState("");
  const filtered = players.filter((p) =>
    (p.name + p.role + p.country).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="center-box">
      <h2 className="title">Player Management</h2>
      <button className="menu-bar" onClick={onCreate}>
        ➕ Create Player
      </button>
      <input
        className="input-box"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 Search"
      />
      <div style={{ marginTop: "15px" }}>
        {filtered.map((p, idx) => (
          <div key={p.id || idx} className="player-bar">
            <span
              style={{ flex: 1, cursor: "pointer" }}
              onClick={() => onEdit(idx)}
            >
              {p.jerseyNumber} - {p.name} ({p.role})
            </span>
            <button className="delete-btn" onClick={() => onDelete(idx)}>
              🗑
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayerForm({ players, editingIndex, setEditingIndex, goBack }) {
  const editing = editingIndex !== null;

  const [name, setName] = useState(editing ? players[editingIndex].name : "");
  const [jerseyNumber, setJerseyNumber] = useState(
    editing ? players[editingIndex].jerseyNumber : ""
  );
  const [playerSet, setPlayerSet] = useState(
    editing ? players[editingIndex].playerSet : "Set 1"
  );
  const [category, setCategory] = useState(
    editing ? players[editingIndex].category : "M"
  );
  const [role, setRole] = useState(editing ? players[editingIndex].role : "Bat");
  const [basePrice, setBasePrice] = useState(
    editing ? players[editingIndex].basePrice : ""
  );
  const [country, setCountry] = useState(
    editing ? players[editingIndex].country : "India"
  );
  const [imageURL, setImageURL] = useState(
    editing ? players[editingIndex].imageURL || "" : ""
  );

  const savePlayer = async () => {
    try {
      const p = {
        name,
        jerseyNumber,
        playerSet,
        category,
        role,
        basePrice,
        country,
        imageURL: imageURL || null, // store link directly
      };

      if (editing) {
        const existingId = players[editingIndex].id;
        if (existingId) await updatePlayer(existingId, p);
      } else {
        await createPlayer(p);
      }

      setEditingIndex(null);
      goBack();
    } catch (err) {
      console.error("⚠️ Save failed:", err);
      alert("Player save failed: " + err.message);
    }
  };

  return (
    <div className="center-box player-form" style={{ maxWidth: "900px" }}>
      <h2 className="title">{editing ? "Edit Player" : "Create Player"}</h2>

      {/* ✅ Inputs arranged row by row */}
      <div className="form-rows">
        {/* Row 1 */}
        <div className="form-row">
          <input
            className="input-box"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
          />
          <input
            className="input-box"
            type="number"
            value={jerseyNumber}
            onChange={(e) => setJerseyNumber(e.target.value)}
            placeholder="Jersey Number"
          />
          <select
            className="input-box"
            value={playerSet}
            onChange={(e) => setPlayerSet(e.target.value)}
          >
            {[...Array(50)].map((_, idx) => (
              <option key={idx}>Set {idx + 1}</option>
            ))}
            <option>Uncapped Batsmen</option>
            <option>Uncapped Wicket Keeper</option>
            <option>Uncapped All Rounder</option>
            <option>Uncapped Bowler</option>
            <option>Capped Batsmen</option>
            <option>Capped Wicket Keeper</option>
            <option>Capped All Rounder</option>
            <option>Capped Bowler</option>
          </select>
        </div>

        {/* Row 2 */}
        <div className="form-row">
          <select
            className="input-box"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>M</option>
            <option>C</option>
            <option>U</option>
          </select>
          <select
            className="input-box"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option>Bat</option>
            <option>Bowl</option>
            <option>WK</option>
            <option>AL</option>
          </select>
          <input
            className="input-box"
            value={basePrice}
            type="number"
            onChange={(e) => setBasePrice(e.target.value)}
            placeholder="Base Price (Lakhs)"
          />
        </div>

        {/* Row 3 */}
        <div className="form-row">
          <select
            className="input-box"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option>India</option>
            <option>Pakistan</option>
            <option>SriLanka</option>
            <option>Bangladesh</option>
            <option>Afghanistan</option>
            <option>Australia</option>
            <option>England</option>
            <option>New Zealand</option>
            <option>South Africa</option>
            <option>West Indies</option>
            <option>Ireland</option>
            <option>Zimbabwe</option>
            <option>Scotland</option>
            <option>Netherlands</option>
            <option>UAE</option>
            <option>Nepal</option>
            <option>Oman</option>
          </select>
          <input
            className="input-box"
            type="text"
            value={imageURL}
            onChange={(e) => setImageURL(e.target.value)}
            placeholder="Paste player image URL"
          />
        </div>
      </div>

      {/* Preview + Buttons Side by Side */}
      <div className="preview-section">
        {/* Circle on the left */}
        <div className="oval preview-circle">
          {imageURL ? (
            <img src={imageURL} alt="preview" />
          ) : (
            <div className="placeholder">👤</div>
          )}
        </div>

        {/* Buttons on the right */}
        <div className="form-actions side-actions">
          <button className="menu-bar" onClick={savePlayer}>
            {editing ? "Save Player" : "Create Player"}
          </button>
          <button className="menu-bar" onClick={goBack}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}