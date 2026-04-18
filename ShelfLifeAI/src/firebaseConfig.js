// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider, FacebookAuthProvider } from "firebase/auth";
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

// Social Providers
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

// Add scopes for additional user data
googleProvider.addScope('profile');
googleProvider.addScope('email');
githubProvider.addScope('user:email');
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');