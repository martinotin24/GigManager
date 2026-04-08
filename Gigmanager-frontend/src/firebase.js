import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Ponemos los datos directamente aquí para evitar problemas con Vite
const firebaseConfig = {
  apiKey: "AIzaSyCp90VZmS8AZab9PTCRuTeCtcEj9TARa-Y",
  authDomain: "capstone-gigmanager.firebaseapp.com",
  projectId: "capstone-gigmanager",
  storageBucket: "capstone-gigmanager.firebasestorage.app",
  messagingSenderId: "245472370386",
  appId: "1:245472370386:web:328ca1fbe88ee82a22970b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);