import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
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

async function testStockUpdate() {
  const cred = await signInWithEmailAndPassword(auth, 'karim@gmail.com', 'password');
  console.log("Logged in:", cred.user.email);
  const snap = await getDocs(collection(db, 'products'));
  const firstDoc = snap.docs[0];
  console.log("First product:", firstDoc.id, firstDoc.data().title, "Current stock:", firstDoc.data().stock);
  
  try {
    const currentStock = firstDoc.data().stock || 10;
    await updateDoc(doc(db, 'products', firstDoc.id), {
      stock: currentStock - 1
    });
    console.log("SUCCESS: Stock updated directly!");
  } catch (err) {
    console.log("Stock update error:", err.code, err.message);
  }

  process.exit(0);
}

testStockUpdate();
