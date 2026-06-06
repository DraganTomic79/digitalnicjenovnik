import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvegEdujvS-INu91MhMtcawYfXnDiZg-Y",
  authDomain: "digitalnicjenovnik-kafic2.firebaseapp.com",
  projectId: "digitalnicjenovnik-kafic2",
  storageBucket: "digitalnicjenovnik-kafic2.firebasestorage.app",
  messagingSenderId: "1029765650849",
  appId: "1:1029765650849:web:574922e70636681dfe53e0",
  measurementId: "G-LBKXFJPGJ7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };