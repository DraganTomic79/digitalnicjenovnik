import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDkdX8R51_tM5KBgSBWvDEGkzW65F-jo8w",
  authDomain: "digitalnicjenovnik-kafic3.firebaseapp.com",
  projectId: "digitalnicjenovnik-kafic3",
  storageBucket: "digitalnicjenovnik-kafic3.firebasestorage.app",
  messagingSenderId: "848812318853",
  appId: "1:848812318853:web:573e474a946c2a8be189ec",
  measurementId: "G-HB2DWVHGFT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };