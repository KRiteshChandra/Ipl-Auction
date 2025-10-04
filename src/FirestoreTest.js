import React, { useEffect } from "react";
import { db } from "./firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";

export default function FirestoreTest() {
  useEffect(() => {
    const testFirestore = async () => {
      try {
        // 1️⃣ Reference collection
        const playersRef = collection(db, "players");

        // 2️⃣ Add a test document
        const docRef = await addDoc(playersRef, {
          name: "Test Player",
          role: "Bat",
          basePrice: 100,
          createdAt: new Date().toISOString()
        });
        console.log("✅ Test player added with ID:", docRef.id);

        // 3️⃣ Fetch all documents to confirm
        const snap = await getDocs(playersRef);
        snap.forEach(doc => {
          console.log("📄 Player doc:", doc.id, doc.data());
        });
      } catch (err) {
        console.error("🔥 Firestore test error:", err);
      }
    };

    testFirestore();
  }, []);

  return (
    <div className="center-box">
      <h2>Firestore Test</h2>
      <p>Open console + Firestore database → check “players”.</p>
    </div>
  );
}