// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  FacebookAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  deleteDoc,
  addDoc,
  serverTimestamp
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAsGToU-W0r3TkTK9BR1E6jFNzSJ4UE7Vw",
  authDomain: "shelflife-ai-141df.firebaseapp.com",
  projectId: "shelflife-ai-141df",
  storageBucket: "shelflife-ai-141df.firebasestorage.app",
  messagingSenderId: "916781512926",
  appId: "1:916781512926:web:5e2500ab7c7055bfccaa4f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const facebookProvider = new FacebookAuthProvider();

googleProvider.addScope('profile');
googleProvider.addScope('email');
githubProvider.addScope('user:email');
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');

export {
  auth,
  db,
  googleProvider,
  githubProvider,
  facebookProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  addDoc,
  serverTimestamp
};