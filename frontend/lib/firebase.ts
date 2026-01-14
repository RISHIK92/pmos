import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your Firebase configuration from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAfxUIy-xfT4SFW03m86mnxQXXljLzbW5g",
  authDomain: "pmos-fb3ee.firebaseapp.com",
  projectId: "pmos-fb3ee",
  storageBucket: "pmos-fb3ee.firebasestorage.app",
  messagingSenderId: "259162332596",
  appId: "1:259162332596:web:60b685662860de75faa6e1",
  measurementId: "G-F8X75B2ZDZ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export default app;
