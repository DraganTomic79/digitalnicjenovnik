import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCpPLBwAzPSrszYpjsl39dz0wq5WhaCuc4",
  authDomain: "digitalnicjenovnik-kafic5.firebaseapp.com",
  projectId: "digitalnicjenovnik-kafic5",
  storageBucket: "digitalnicjenovnik-kafic5.firebasestorage.app",
  messagingSenderId: "93520732804",
  appId: "1:93520732804:web:3c61d4e815c3d308e218d1",
  measurementId: "G-S9NN8EP5YT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
