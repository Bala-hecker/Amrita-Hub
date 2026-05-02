// src/firebase.js
// ─────────────────────────────────────────────────────────────────────────────
//  HOW TO SET UP FIREBASE FOR AMRITAHUB  (Step by step)
//
//  STEP 1 — Create project
//    → Go to https://console.firebase.google.com
//    → Click "Add project"
//    → Name it:  amritahub  (or anything you like)
//    → Disable Google Analytics (not needed)
//    → Click "Create project"
//
//  STEP 2 — Get your config keys
//    → In your new project, click the "</>" (Web) icon
//    → Register app with nickname:  AmritaHub Web
//    → Copy the firebaseConfig object shown
//    → Paste it below, replacing each "REPLACE_..." placeholder
//
//  STEP 3 — Enable Authentication
//    → Left sidebar → Build → Authentication
//    → Click "Get started"
//    → Sign-in method tab → Enable "Email/Password"
//    → Save
//
//  STEP 4 — Enable Firestore Database
//    → Left sidebar → Build → Firestore Database
//    → Click "Create database"
//    → Choose "Start in test mode" (we'll add rules later)
//    → Select your region → Enable
//
//  STEP 5 — Enable Storage
//    → Left sidebar → Build → Storage
//    → Click "Get started"
//    → Choose "Start in test mode"
//    → Select your region → Done
//
//  STEP 6 — Paste your config below and save the file
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp }  from "firebase/app";
import { getAuth }        from "firebase/auth";
import { getFirestore }   from "firebase/firestore";
import { getStorage }     from "firebase/storage";

const firebaseConfig = {
  apiKey:            "AIzaSyBGEbhL9bijSYI_cPTgV0dXV91B2InJ-Q8",
  authDomain:        "amritahub-ba6d8.firebaseapp.com",
  projectId:         "amritahub-ba6d8",
  storageBucket:     "amritahub-ba6d8.firebasestorage.app",
  messagingSenderId: "1028396093456",
  appId:             "1:1028396093456:web:ee34de376b7fead6d47a95",
};

const app        = initializeApp(firebaseConfig);
export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);
export default app;
