import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAoMASaR3_RoLAxfB-sptpHQz-dmzW6VVE",
  authDomain: "spendpilot-dc613.firebaseapp.com",
  projectId: "spendpilot-dc613",
  storageBucket: "spendpilot-dc613.firebasestorage.app",
  messagingSenderId: "344894426452",
  appId: "1:344894426452:web:75d45766b8bf3561a24cc1",
  measurementId: "G-HD1BZ1NTSY",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
