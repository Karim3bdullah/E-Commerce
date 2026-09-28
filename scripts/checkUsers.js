import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDb6iz5_vNHQRcH7X7MuI0I4sA_wzcolI8",
  authDomain: "ecommerce-2e876.firebaseapp.com",
  projectId: "ecommerce-2e876",
  storageBucket: "ecommerce-2e876.firebasestorage.app",
  messagingSenderId: "820743360165",
  appId: "1:820743360165:web:a9ff7ff66758b336e1c74c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function checkUsers() {
  try {
    const credAdmin = await signInWithEmailAndPassword(auth, 'admin@gmail.com', 'password');
    console.log("admin@gmail.com UID:", credAdmin.user.uid);
    const docAdmin = await getDoc(doc(db, 'users', credAdmin.user.uid));
    console.log("admin@gmail.com data:", docAdmin.exists() ? docAdmin.data() : 'NOT_FOUND');
  } catch (e) {
    console.log("admin@gmail.com login error:", e.message);
  }

  try {
    const credKarim = await signInWithEmailAndPassword(auth, 'karim@gmail.com', 'password');
    console.log("karim@gmail.com UID:", credKarim.user.uid);
    const docKarim = await getDoc(doc(db, 'users', credKarim.user.uid));
    console.log("karim@gmail.com data:", docKarim.exists() ? docKarim.data() : 'NOT_FOUND');
  } catch (e) {
    console.log("karim@gmail.com login error:", e.message);
  }

  process.exit(0);
}

checkUsers();
