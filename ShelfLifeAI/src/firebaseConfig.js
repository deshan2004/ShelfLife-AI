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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAsGToU-W0r3TkTK9BR1E6jFNzSJ4UE7Vw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "shelflife-ai-141df.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "shelflife-ai-141df",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "shelflife-ai-141df.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "916781512926",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:916781512926:web:5e2500ab7c7055bfccaa4f"
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

export const getUserSubscription = async (userId) => {
  try {
    const subDoc = await getDoc(doc(db, 'subscriptions', userId));
    if (subDoc.exists()) {
      return subDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return null;
  }
};

export const updateUserSubscription = async (userId, data) => {
  try {
    await updateDoc(doc(db, 'subscriptions', userId), {
      ...data,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error updating user subscription:', error);
    return false;
  }
};

export const getAllUsers = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
};

export const getAllSubscriptions = async () => {
  try {
    const subsSnapshot = await getDocs(collection(db, 'subscriptions'));
    return subsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting all subscriptions:', error);
    return [];
  }
};