//-------------------------------------------------------
// Central App orchestrator
// - Handles navigation (home → player/host/bidding/reports/rooms)
// - Host Config with default purse = 12000 Lakhs (120 Cr)
// - Firestore connections
//-------------------------------------------------------
import React, { useState, useEffect } from "react";
import "./AuctionBackground.css";
import AuctionBackground from "./AuctionBackground";
import HostSetsPage from "./HostSetsPage";
import HostPlayersInSet from "./HostPlayersInSet";
import PlayerManager from "./PlayerManager";
import BiddingTeamSetup from "./BiddingTeamSetup";
import BiddingRoom from "./BiddingRoom";
import PlayersListPage from "./PlayersListPage";
import RemainingPursePage from "./RemainingPursePage";
import PlayersBoughtPage from "./PlayersBoughtPage";
import RoomsLogin from "./RoomsLogin";
import RoomsPage from "./RoomsPage";
import { createRoom, joinRoom, listenRoom } from "./firestoreRooms";
import { listenPlayers } from "./firestorePlayers";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

// Password page reusable
function PasswordPage({ label, correctPassword, onSuccess }) {
  const [input, setInput] = useState("");
  return (
    <div className="center-box">
      <h2 className="page-title">{label}</h2>
      <input
        className="input-box"
        type="password"
        placeholder="Enter Password"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button
        className="menu-bar"
        onClick={() =>
          input === correctPassword ? onSuccess() : alert("Wrong password!")
        }
      >
        Submit
      </button>
    </div>
  );
}

export default function App() {
  // navigation
  const [page, setPage] = useState("home");

  // players global
  const [players, setPlayers] = useState([]);

  // room control
  const [roomId, setRoomId] = useState("");
  const [roomData, setRoomData] = useState(null);

  // host config
  const [numTeams, setNumTeams] = useState(2);
  const [budget, setBudget] = useState(12000); // default 12000 Lakhs = 120 Cr
  const [maxPlayers, setMaxPlayers] = useState(25);
  const [maxOverseas, setMaxOverseas] = useState(8);

  const [teamName, setTeamName] = useState("");
  const [teamTheme, setTeamTheme] = useState("");
  
  const [jumpBidAllowed] = useState(false);
  const [selectedSet, setSelectedSet] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  if (!localStorage.getItem("myDeviceId")) {
    localStorage.setItem("myDeviceId", Math.random().toString(36).substr(2, 9));
  }
  const myDeviceId = localStorage.getItem("myDeviceId");

  // Firestore listeners
  useEffect(() => {
    const unsub = listenPlayers(setPlayers);
    return () => unsub();
  }, []);
  useEffect(() => {
    if (roomId) {
      const unsub = listenRoom(roomId, (data) => setRoomData(data));
      return () => unsub && unsub();
    }
  }, [roomId]);
useEffect(() => {
  if (!roomData) return;

  const myTeam = localStorage.getItem("myTeam");
  const myRoom = localStorage.getItem("myRoomId");

  // If I'm in a bidding room but my team no longer exists in Firestore
  if (
    page === "biddingRoom" &&
    myRoom === roomId &&
    myTeam &&
    (!roomData.teams || !roomData.teams[myTeam])
  ) {
    alert("❌ You have been removed from this room by the host.");
    localStorage.removeItem("myTeam");
    localStorage.removeItem("myRoomId");
    setPage("home");
  }
}, [roomData, page, roomId]);

  const getIncrement = (price) => {
    if (price < 100) return 10;
    if (price < 1500) return 25;
    return 50;
  };

  const increaseBid = (val, override = false) => {
    if (!roomData) return;
    if (override) setRoomData({ ...roomData, currentBid: val });
    else {
      const newBid =
        !roomData.currentBid || roomData.currentBid < val
          ? val
          : roomData.currentBid + getIncrement(roomData.currentBid);
      setRoomData({ ...roomData, currentBid: newBid });
    }
  };

  const decreaseBid = (val) => {
    if (!roomData) return;
    const newBid =
      !roomData.currentBid || roomData.currentBid <= val
        ? val
        : roomData.currentBid - getIncrement(roomData.currentBid);
    setRoomData({ ...roomData, currentBid: newBid });
  };

  // --- SOLD / UNSOLD / RESET HANDLERS ---
const handleSold = async () => {
  if (!roomData?.currentPlayer || !roomData?.currentBidTeam || !roomData?.currentBid) return;
  
  const player = roomData.currentPlayer;
  const teamName = roomData.currentBidTeam;
  const price = roomData.currentBid;
  const team = roomData.teams[teamName];

  // ✅ Update team purse and team history in room doc
  await updateDoc(doc(db, "rooms", roomId), {
    status: "SOLD",
    [`teams.${teamName}.purse`]: team.purse - price,
    [`teams.${teamName}.history`]: [
      ...(team.history || []),
      {
        playerName: player.name,
        price,
        country: player.country,
        id: player.id || null,  // store player id reference too
      },
    ],
    fireworks: true
  });

  // ✅ Update player doc in players collection
  if (player.id) {
    await updateDoc(doc(db, "players", player.id), {
      soldPrice: price,
      team: teamName,
      status: "SOLD",
    });
  }
};

const handleUnsold = async () => {
  if (!roomData?.currentPlayer || roomData?.currentBid !== null) return;

  const player = roomData.currentPlayer;

  // ✅ Update player doc, move to "UnSold" set
  if (player.id) {
    await updateDoc(doc(db, "players", player.id), {
      originalSet: player.playerSet || "Set 1",
      playerSet: "UnSold",
      soldPrice: null,
      team: null,
      status: "UNSOLD",
    });
  }

  // ✅ Update room doc status
  await updateDoc(doc(db, "rooms", roomId), {
    status: "UNSOLD",
  });
};

const handleReset = async () => {
  if (!roomData?.currentPlayer) return;
  const player = roomData.currentPlayer;
  const teamName = roomData.currentBidTeam;
  const price = roomData.currentBid;

  // ✅ Undo SOLD safely (refund purse & clean history)
  if (roomData.status === "SOLD" && teamName && price) {
    const team = roomData.teams[teamName];

    const refunded = team.purse + price;
    const newHistory = (team.history || []).filter(h => h.id !== player.id);

    await updateDoc(doc(db, "rooms", roomId), {
      [`teams.${teamName}.purse`]: refunded,
      [`teams.${teamName}.history`]: newHistory,
    });

    if (player.id) {
      await updateDoc(doc(db, "players", player.id), {
        soldPrice: null,
        team: null,
        status: null,
        playerSet: player.originalSet || player.playerSet || "Set 1"
      });
    }
  }

  // ✅ Undo UNSOLD: put back to original set (ensure everything is cleared)
  if (roomData.status === "UNSOLD" && player.id) {
    await updateDoc(doc(db, "players", player.id), {
      soldPrice: null,
      team: null,
      status: null,
      playerSet: player.originalSet || "Set 1"
    });
  }

  // ✅ Always clear current auction round state
  await updateDoc(doc(db, "rooms", roomId), {
    status: null,
    currentBid: null,
    currentBidTeam: null,
    activeBidders: [],
  });
};
  // --- navigation back ---
  const goBack = () => {
    if (
      roomData?.accessType === "private" &&
      roomData?.createdBy !== myDeviceId &&
      page === "auctionPlayer"
    ) {
      setPage("home");
      return;
    }
    switch (page) {
      case "auctionPlayer": setPage("hostPlayers"); break;
      case "hostPlayers": setPage("hostSets"); break;
      case "hostSets": setPage("hostConfig"); break;
      case "hostConfig": setPage("hostRoom"); break;
      case "hostRoom":
      case "hostContinue": setPage("hostHome"); break;
      case "hostHome":
      case "player":
      case "roomsLogin":
      case "roomsPage":
      case "playersList":
      case "remainingPurse":
      case "playersBought": setPage("home"); break;
      default: setPage("home"); break;
    }
  };

  return (
    <div className="auction-bg">
      {page !== "home" && (
        <div className="back-btn" onClick={goBack}>←</div>
      )}

      {page === "home" && (
        <div className="center-box">
          <h1 className="page-title">🏏 Mock Auction</h1>
          <button className="menu-bar" onClick={() => setPage("playerPass")}>Player Management</button>
          <button className="menu-bar" onClick={() => setPage("hostPass")}>Host Section</button>
          <button className="menu-bar" onClick={() => setPage("bidding")}>Bidding</button>
          <button className="menu-bar" onClick={() => setPage("playersList")}>Players List</button>
          <button className="menu-bar" onClick={() => setPage("remainingPurse")}>Remaining Purse</button>
          <button className="menu-bar" onClick={() => setPage("playersBought")}>Players Bought</button>
          <button className="menu-bar" onClick={() => setPage("roomsLogin")}>Rooms</button>
        </div>
      )}

      {page === "playerPass" && (
        <PasswordPage
          label="Enter Player Password"
          correctPassword="player123"
          onSuccess={() => setPage("player")}
        />
      )}
      {page === "player" && (
        <PlayerManager players={players} setPlayers={setPlayers} goHome={() => setPage("home")} />
      )}

      {page === "hostPass" && (
        <PasswordPage
          label="Enter Host Password"
          correctPassword="host123"
          onSuccess={() => setPage("hostHome")}
        />
      )}

      {page === "hostHome" && (
        <div className="center-box">
          <h2 className="page-title">Host Section</h2>
          <button className="menu-bar" onClick={() => { setRoomId(""); setPage("hostRoom"); }}>▶ Start New Auction</button>
          <button className="menu-bar" onClick={() => setPage("hostContinue")}>⏩ Continue Auction</button>
        </div>
      )}

      {page === "hostContinue" && (
        <div className="center-box">
          <h2 className="page-title">Continue Auction</h2>
          <input className="input-box" placeholder="Enter Room ID" value={roomId} onChange={(e) => setRoomId(e.target.value)} />
          <button className="menu-bar" onClick={() => { if (!roomId) return alert("Enter room ID"); setPage("auctionPlayer"); }}>Continue</button>
        </div>
      )}

      {page === "hostRoom" && (
        <div className="center-box">
          <h2 className="page-title">Create Room</h2>
          <input className="input-box" placeholder="Room ID" value={roomId} onChange={(e) => setRoomId(e.target.value)} />
          <button className="menu-bar" onClick={() => { createRoom(roomId,{ numTeams, budget, maxPlayers, maxOverseas },myDeviceId); setPage("hostConfig"); }}>✅ Create</button>
        </div>
      )}

      {page === "hostConfig" && (
        <div className="center-box">
          <h2>Configure Auction</h2>
          <input type="number" className="input-box" value={numTeams} onChange={(e)=>setNumTeams(+e.target.value)} placeholder="Number of Teams" />
          <input type="number" className="input-box" value={budget} onChange={(e)=>setBudget(+e.target.value)} placeholder="Purse per team (Lakhs)" />
          <input type="number" className="input-box" value={maxPlayers} onChange={(e)=>setMaxPlayers(+e.target.value)} placeholder="Max Players" />
          <input type="number" className="input-box" value={maxOverseas} onChange={(e)=>setMaxOverseas(+e.target.value)} placeholder="Max Overseas" />
          <p>Teams {numTeams}, Purse {budget} Lakhs</p>
          <button className="menu-bar" onClick={() => setPage("hostSets")}>▶ Start Auction</button>
        </div>
      )}

      {page === "hostSets" && (
        <HostSetsPage
          players={players}
          onSelectSet={(setName) => { setSelectedSet(setName); setPage("hostPlayers"); }}
        />
      )}

      {page === "hostPlayers" && (
  <HostPlayersInSet
    players={players}
    setName={selectedSet}
    onSelectPlayer={async (p) => {
      setSelectedPlayer(p);

      // ✅ Firestore-safe snapshot (no base64!)
      const safePlayer = {
        id: p?.id || null,
        name: p?.name || "",
        jerseyNumber: p?.jerseyNumber || "",
        playerSet: p?.playerSet || "",
        category: p?.category || "",
        role: p?.role || "",
        basePrice: Number(p?.basePrice) || 0,
        country: p?.country || "",
        imageURL: p?.imageURL || null,   // ✅ Only reference
      };

      try {
        await updateDoc(doc(db, "rooms", roomId), {
          currentPlayer: safePlayer,
          currentBid: null,
          currentBidTeam: null,
          status: null,
        });
      } catch (err) {
        console.error("🚨 Firestore error writing currentPlayer:", err);
        alert("Failed to load player. Check Firestore config/data!");
      }

      setPage("auctionPlayer");
    }}
  />
)}

      {page === "auctionPlayer" && (
        roomData ? (
          <AuctionBackground
  player={roomData?.currentPlayer}
  currentBid={roomData?.currentBid}
  currentBidTeam={roomData?.currentBidTeam}
  increaseBid={increaseBid}
  decreaseBid={decreaseBid}
  handleSold={handleSold}
  handleUnsold={handleUnsold}
  handleReset={handleReset}
  status={roomData?.status}
  numTeams={numTeams}
  maxPlayers={maxPlayers}
  maxOverseas={maxOverseas}
  budget={budget}
  teams={roomData?.teams || {}}
  roomId={roomId}
  isHost={roomData?.createdBy === myDeviceId}
  isPrivate={roomData?.accessType === "private"}
  jumpBidAllowed={roomData?.jumpBidAllowed || false}   // ✅ read directly from Firestore
  activeBidders={roomData?.activeBidders || []}
  accessMode={roomData?.accessMode || "max"}
  roomData={roomData}    // ✅ add this line
/>
        ) : (
          <div className="center-box"><h2>Loading auction…</h2></div>
        )
      )}

      {page === "bidding" && (
        <div className="center-box">
          <h2>Enter Room ID</h2>
          <input className="input-box" value={roomId} onChange={(e)=>setRoomId(e.target.value)} />
          <button className="menu-bar" onClick={()=>{
            const savedRoom=localStorage.getItem("myRoomId");
            const savedTeam=localStorage.getItem("myTeam");
            if(savedRoom && savedTeam && savedRoom===roomId){ setPage("biddingRoom"); }
            else{ setPage("biddingTeam"); }
          }}>Next</button>
        </div>
      )}

      {page === "biddingTeam" && (
  <BiddingTeamSetup
    teamName={teamName}
    setTeamName={setTeamName}
    teamTheme={teamTheme}
    setTeamTheme={setTeamTheme}
    onEnter={async (teamObj) => {
      try {
        await joinRoom(roomId, teamObj);
        localStorage.setItem("myTeam", teamObj.name);
        localStorage.setItem("myRoomId", roomId);
        setPage("biddingRoom");
      } catch (err) {
        if (err.message.includes("Maximum number of teams")) {
          alert(`❌ Room is full. Maximum ${numTeams} teams are allowed.`);
        } else {
          alert(err.message);
        }
      }
    }}
  />
)}

      {page === "biddingRoom" && (
        <BiddingRoom roomData={roomData} roomId={roomId} jumpBidAllowed={jumpBidAllowed} />
      )}

      {page === "playersList" && <PlayersListPage players={players} />}
      {page === "remainingPurse" && <RemainingPursePage teams={roomData?.teams || {}} />}
      {page === "playersBought" && <PlayersBoughtPage teams={roomData?.teams || {}} />}
      {page === "roomsLogin" && <RoomsLogin onSuccess={()=>setPage("roomsPage")} />}
      {page === "roomsPage" && <RoomsPage />}
    </div>
  );
}
