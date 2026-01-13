import { initializeApp } from "firebase/app";
// @ts-ignore
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAfxUIy-xfT4SFW03m86mnxQXXljLzbW5g",
  authDomain: "pmos-fb3ee.firebaseapp.com",
  projectId: "pmos-fb3ee",
  storageBucket: "pmos-fb3ee.firebasestorage.app",
  messagingSenderId: "259162332596",
  appId: "1:259162332596:web:60b685662860de75faa6e1",
  measurementId: "G-F8X75B2ZDZ",
};

// Initialize App
const app = initializeApp(firebaseConfig);

// 2. Initialize Auth with Persistence (This keeps the user logged in!)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
