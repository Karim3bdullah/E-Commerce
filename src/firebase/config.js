import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: "ecommerce-2e876.firebaseapp.com",
    projectId: "ecommerce-2e876",
    storageBucket: "ecommerce-2e876.firebasestorage.app",
    messagingSenderId: "820743360165",
    appId: "1:820743360165:web:a9ff7ff66758b336e1c74c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app)