import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAsGToU-W0r3TkTK9BR1E6jFNzSJ4UE7Vw",
  authDomain: "shelflife-ai-141df.firebaseapp.com",
  projectId: "shelflife-ai-141df",
  storageBucket: "shelflife-ai-141df.firebasestorage.app",
  messagingSenderId: "916781512926",
  appId: "1:916781512926:web:5e2500ab7c7055bfccaa4f"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);