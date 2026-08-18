import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAnV5t8nv3In0rlQ3EKBTTTV6rMWb5Wqbo",
  authDomain: "digitalnicjenovnik-kafic4.firebaseapp.com",
  projectId: "digitalnicjenovnik-kafic4",
  storageBucket: "digitalnicjenovnik-kafic4.firebasestorage.app",
  messagingSenderId: "579052981017",
  appId: "1:579052981017:web:08bb83b2f3728cf1499388"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
