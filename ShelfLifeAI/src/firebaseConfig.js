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
  deleteDoc
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAsGToU-W0r3TkTK9BR1E6jFNzSJ4UE7Vw",
  authDomain: "shelflife-ai-141df.firebaseapp.com",
  projectId: "shelflife-ai-141df",
  storageBucket: "shelflife-ai-141df.firebasestorage.app",
  messagingSenderId: "916781512926",
  appId: "1:916781512926:web:5e2500ab7c7055bfccaa4f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

// Social Providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Add scopes for providers
googleProvider.addScope('profile');
googleProvider.addScope('email');
githubProvider.addScope('user:email');
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');

// Export everything
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
  limit
};

// Helper function to get user role
export const getUserRole = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data().role || 'user';
    }
    return 'user';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }
};

// Helper function to set user role
export const setUserRole = async (userId, role) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      role: role,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error setting user role:', error);
    return false;
  }
};