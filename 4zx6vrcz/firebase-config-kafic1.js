import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCW6EehwraJazNSMOXxrdUNEYx8YIQgRQE",
  authDomain: "digitalnicjenovnik-kafic1.firebaseapp.com",
  projectId: "digitalnicjenovnik-kafic1",
  storageBucket: "digitalnicjenovnik-kafic1.firebasestorage.app",
  messagingSenderId: "1020174209293",
  appId: "1:1020174209293:web:33125083ba0b9d9cb5a044",
  measurementId: "G-EDDYKYZG4J"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };