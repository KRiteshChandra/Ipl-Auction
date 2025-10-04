//-------------------------------------------------------
// Host's auctioneer screen for each selected player
//-------------------------------------------------------

import React, { useState } from "react";
import "./AuctionBackground.css";
import { endAuction } from "./firestoreRooms";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

// 🎆 Confetti for SOLD animation
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

export default function AuctionBackground({
  player,
  currentBid,
  currentBidTeam,
  increaseBid,
  decreaseBid,
  handleSold,
  handleUnsold,
  handleReset,
  status,
  activeBidders,          // coming via roomData from App.js
  jumpBidAllowed,         // now coming from roomData, not local state
  numTeams,
  maxPlayers,
  maxOverseas,
  teams,
  roomId,
  isHost,
  isPrivate,
  accessMode,
  roomData               // ✅ take full roomData so we get persisted auctionMode
}) {
  // sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  // ✅ AuctionMode now taken from Firestore roomData (persisted)
  const auctionMode = roomData?.auctionMode || "auto";

  // ✅ Normalize activeBidders from Firestore
  const safeActiveBidders = Array.isArray(activeBidders) ? activeBidders : [];

  // ✅ Flag map for countries
  const flagMap = {
    India: "https://flagcdn.com/w40/in.png",
    Pakistan: "https://flagcdn.com/w40/pk.png",
    SriLanka: "https://flagcdn.com/w40/lk.png",
    Bangladesh: "https://flagcdn.com/w40/bd.png",
    Afghanistan: "https://flagcdn.com/w40/af.png",
    Australia: "https://flagcdn.com/w40/au.png",
    England: "https://flagcdn.com/w40/gb.png",
    "New Zealand": "https://flagcdn.com/w40/nz.png",
    "South Africa": "https://flagcdn.com/w40/za.png",
    "West Indies":
      "https://static.vecteezy.com/system/resources/previews/024/286/508/non_2x/illustration-of-west-indies-flag-design-vector.jpg",
    Ireland: "https://flagcdn.com/w40/ie.png",
    Zimbabwe: "https://flagcdn.com/w40/zw.png",
    Scotland: "https://flagcdn.com/w40/gb-sct.png",
    Netherlands: "https://flagcdn.com/w40/nl.png",
    UAE: "https://flagcdn.com/w40/ae.png",
    Nepal: "https://flagcdn.com/w40/np.png",
    Oman: "https://flagcdn.com/w40/om.png",
  };

  // ✅ Confetti screen size
  const { width, height } = useWindowSize();

  // ✅ Check if controls should show
  const controlsAllowed = !isPrivate || (isPrivate && isHost);

  return (
    <div className="auction-bg">
      {/* 🎆 Golden Confetti animation on SOLD */}
      {status === "SOLD" && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={400}
          recycle={false}
          colors={["#FFD700", "#FFC300", "#FFB700", "#DAA520"]}
        />
      )}

      {sidebarOpen && (
        <style>{`.back-btn { display: none !important; }`}</style>
      )}

      {/* --------------------------------------- */}
      {/* Hamburger Menu */}
      {/* --------------------------------------- */}
      {controlsAllowed && !sidebarOpen && (
        <div className="hamburger" onClick={() => setSidebarOpen(true)}>
          <div></div><div></div><div></div>
        </div>
      )}
      {controlsAllowed && sidebarOpen && (
        <div className="sidebar open">
          <div className="sidebar-back" onClick={() => setSidebarOpen(false)}>←</div>
          <ul>
            <li onClick={() => setActiveMenu(activeMenu==="end"?null:"end")}>End Auction</li>
            {activeMenu==="end" && (
              <ul className="submenu">
                <li onClick={()=>endAuction(roomId)}>Confirm End</li>
              </ul>
            )}
            <li onClick={()=>setActiveMenu(activeMenu==="access"?null:"access")}>Access</li>
            {activeMenu==="access" && (
              <ul className="submenu">
                <li>Public</li>
                <li>Private</li>
              </ul>
            )}

            {/* ✅ Auction Mode toggle */}
            <li onClick={()=>setActiveMenu(activeMenu==="auction"?null:"auction")}>Auction</li>
            {activeMenu==="auction" && (
              <ul className="submenu">
                <li onClick={async()=> await updateDoc(doc(db,"rooms",roomId),{ auctionMode:"auto" })}>
                  Auto
                </li>
                <li onClick={async()=> await updateDoc(doc(db,"rooms",roomId),{ auctionMode:"manual" })}>
                  Manual
                </li>
              </ul>
            )}

            {/* ✅ Jump Bid toggle (persisted in Firestore) */}
            <li onClick={()=>setActiveMenu(activeMenu==="jump"?null:"jump")}>Jump Bid</li>
            {activeMenu==="jump" && (
              <ul className="submenu">
                <li onClick={async()=> await updateDoc(doc(db,"rooms",roomId), {
                  jumpBidAllowed: !roomData?.jumpBidAllowed
                })}>
                  {roomData?.jumpBidAllowed ? "Disallow":"Allow"}
                </li>
              </ul>
            )}

            {/* ✅ Access Mode toggle (Min/Max) */}
            <li onClick={()=>setActiveMenu(activeMenu==="accessMode"?null:"accessMode")}>
              Teams {accessMode ? `(Current: ${accessMode.toUpperCase()})` : ""}
            </li>
            {activeMenu==="accessMode" && (
              <ul className="submenu">
                <li onClick={async()=> await updateDoc(doc(db,"rooms",roomId),{ accessMode:"min"})}>
                  Min (only 2 teams)
                </li>
                <li onClick={async()=> await updateDoc(doc(db,"rooms",roomId),{ accessMode:"max"})}>
                  Max (all teams)
                </li>
              </ul>
            )}
          </ul>
        </div>
      )}

      {/* --------------------------------------- */}
      {/* Top-right controls */}
      {/* --------------------------------------- */}
      {controlsAllowed && (
        <div className="top-right-controls">
          <div className="circle-btn" onClick={()=>!status && decreaseBid(player?.basePrice)}>-</div>
          <button 
            className="restart-btn" 
            disabled={!currentBid && status !== "SOLD" && status !== "UNSOLD"} 
            onClick={handleReset}
          >
            Reset
          </button>
          <div className="circle-btn" onClick={()=>!status && increaseBid(currentBid || player?.basePrice)}>+</div>
        </div>
      )}

      {/* --------------------------------------- */}
      {/* Ellipse row */}
      {/* --------------------------------------- */}
      <div className={`ellipse-row ${auctionMode === "manual" ? "no-bidders" : "has-bidders"}`}>

        {/* LEFT COLUMN */}
        <div className="left-column">
          {/* Auto mode: Active Bidders */}
          {auctionMode !== "manual" && (
            <div className="side-rectangle">
              <div className="side-row heading-row">Active Bidders</div>
              <div className="side-row value-row">
                {safeActiveBidders.length > 0 ? safeActiveBidders.join(", ") : "None"}
              </div>
            </div>
          )}

          {/* Manual mode: Inputs (only host/public) */}
          {auctionMode === "manual" && (
            <>
              {controlsAllowed && (!isPrivate || isHost) && (
                <div className="manual-input-row">
                  <input type="number" className="input-box" placeholder="Set Current Bid (Lakhs)"
                    onKeyDown={async (e)=>{
                      if(e.key==="Enter"){
                        const val=+e.target.value;
                        if(val>0){
                          await updateDoc(doc(db,"rooms",roomId), {
                            currentBid: val,
                          });
                          e.target.value="";
                        }
                      }
                    }}
                  />
                  <select 
                    className="input-box" 
                    value={currentBidTeam||""}
                    onChange={async (e)=>{
                      const teamName=e.target.value;
                      if(!teamName) return;
                      const newBid=currentBid || player?.basePrice || 0;
                      await updateDoc(doc(db,"rooms",roomId),{
                        currentBid:newBid,
                        currentBidTeam:teamName
                      });
                    }}
                  >
                    <option value="">--Select Team--</option>
                    {teams && Object.values(teams).map(t=>(
                      <option key={t.name} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* SOLD/UNSOLD always below */}
          {controlsAllowed && (
            <div className="action-buttons">
              <button 
                className="sold-btn" 
                disabled={!!status || currentBid===null} 
                onClick={(!status && currentBid!==null) ? handleSold : null}
              >
                SOLD
              </button>
              <button 
                className="unsold-btn" 
                disabled={!!status || currentBid!==null} 
                onClick={(!status && currentBid===null) ? handleUnsold : null}
              >
                UNSOLD
              </button>
            </div>
          )}
        </div>

        {/* CENTER: Player info */}
        <div className="oval-wrapper">
          <div className="player-header">
            {player?.jerseyNumber} <span className="player-name">{player?.name}</span>
          </div>
          <div className="oval">
            {player?.imageURL 
              ? <img src={player.imageURL} alt={player?.name} /> 
              : <div className="placeholder">👤</div>
            }
          </div>
        </div>

        {/* RIGHT: Status */}
        <div className="side-circle">
          {status && <div className={`status-circle ${status.toLowerCase()}`}>{status}</div>}
        </div>
      </div>

      {/* Info grid */}
      <table className="info-grid">
        <tbody>
          <tr>
            <td className="first-col">
              <table className="inner-col">
                <tbody>
                  <tr>
                    <td>
                      {player?.country && flagMap[player.country] && (
                        <img src={flagMap[player.country]} alt="flag" className="flag" />
                      )}
                    </td>
                  </tr>
                  <tr><td>{player?.category}</td></tr>
                  <tr><td>{player?.role}</td></tr>
                </tbody>
              </table>
            </td>
            <td>
  <div className="heading-row">Base Price</div>
  <div className="value-row">₹ {player?.basePrice} Lakhs</div>
</td>

<td>
  <div className="heading-row">
    {status === "SOLD" ? "Final Bid" : "Current Bid"}
  </div>

  {/* ✅ Animate only the numeric value; ₹ and Lakhs remain static */}
  <div className="value-row roll-up-cell">
    {currentBid !== null && currentBid !== undefined ? (
      <>
        <span className="currency">₹</span>
        <span className="roll-up">{currentBid}</span>
        <span>&nbsp;Lakhs</span>
      </>
    ) : (
      ""
    )}
  </div>
</td>

<td className="fourth-col">
  <div className="fourth-col-heading">
    {status === "SOLD" ? "Winning Team" : "With"}
  </div>

  {/* ✅ Static team name (no animation flicker) */}
  <div className="fourth-col-value">
    {currentBidTeam || ""}
  </div>
</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
