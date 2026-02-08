// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBL3nCHxFRPVpoiTAPYOHLJqqQV9xAiqT8",
  authDomain: "parkinson-app-5cd6a.firebaseapp.com",
  projectId: "parkinson-app-5cd6a",
  storageBucket: "parkinson-app-5cd6a.firebasestorage.app",
  messagingSenderId: "1078505030462",
  appId: "1:1078505030462:web:8ad45f9748744e4c55626f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);