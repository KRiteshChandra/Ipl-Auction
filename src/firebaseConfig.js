// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";   
import { getStorage } from "firebase/storage";   // ✅ import storage at the top

// ✅ Your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAp6K0SQrLd7L2H81xNCt8u9vJeCbpuV10",
  authDomain: "mock-auction-de620.firebaseapp.com",
  projectId: "mock-auction-de620",
  storageBucket: "mock-auction-de620.appspot.com",   // ✅ REQUIRED – this is exactly what your storage uses
  messagingSenderId: "215341310087",
  appId: "1:215341310087:web:241a5b824fc8af891d5822"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Export Firestore and Storage references
export const db = getFirestore(app);
export const storage = getStorage(app);