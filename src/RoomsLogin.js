// RoomsLogin.js
//-------------------------------------------------------
// Login screen for admin overview of rooms.
//-------------------------------------------------------
import React, { useState } from "react";

export default function RoomsLogin({ onSuccess }) {
  const [usr, setUsr] = useState("");
  const [pwd, setPwd] = useState("");

  return (
    <div className="center-box">
      <h2 className="page-title">Rooms Access</h2>

      {/* Input: Admin name */}
      <input 
        className="input-box" 
        placeholder="User ID" 
        value={usr} 
        onChange={(e)=>setUsr(e.target.value)} 
      />

      {/* Input: Password */}
      <input 
        className="input-box" 
        type="password" 
        placeholder="Password" 
        value={pwd}
        onChange={(e)=>setPwd(e.target.value)} 
      />

      {/* Button: login */}
      <button 
        className="menu-bar"
        onClick={()=>{
          if(usr==="Ritesh Chandra K" && pwd==="K.RitCha@13"){
            onSuccess();
          } else alert("❌ Invalid credentials!");
        }}
      >Submit</button>
    </div>
  );
}