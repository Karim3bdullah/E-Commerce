import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
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

async function runSeed() {
  console.log("Authenticating as admin...");
  try {
    const userCredential = await signInWithEmailAndPassword(auth, 'karim@gmail.com', 'password');
    const uid = userCredential.user.uid;
    console.log("Logged in successfully. UID:", uid);

    // Ensure admin user doc exists with role 'admin'
    await setDoc(doc(db, 'users', uid), {
      email: 'karim@gmail.com',
      role: 'admin',
      status: 'active',
      firstName: 'Karim',
      lastName: 'Admin',
      name: 'Karim Admin'
    }, { merge: true });
    console.log("Admin user profile verified in Firestore.");

    // Fetch existing products
    const productsSnap = await getDocs(collection(db, 'products'));
    console.log(`Found ${productsSnap.docs.length} existing products.`);

    let groceryCount = 0;

    for (const docSnap of productsSnap.docs) {
      const data = docSnap.data();
      const cat = (data.category || '').toLowerCase();
      const title = (data.title || '').toLowerCase();

      const updates = {};

      if (cat.includes('grocer') || cat.includes('fruit') || cat.includes('vegetable') || title.includes('apple') || title.includes('tomato')) {
        updates.unitType = 'weight';
        groceryCount++;
      } else if (cat.includes('shoe') || cat.includes('footwear')) {
        updates.unitType = 'piece';
        updates.sizes = ['40', '41', '42', '43', '44', '45'];
        updates.colors = [
          { name: 'Grey', hex: '#6b7280' },
          { name: 'Black', hex: '#000000' },
          { name: 'White', hex: '#ffffff' }
        ];
      } else if (cat.includes('clothing') || cat.includes('shirt') || cat.includes('dress') || cat.includes('apparel')) {
        updates.unitType = 'piece';
        updates.sizes = ['S', 'M', 'L', 'XL', 'XXL'];
        updates.colors = [
          { name: 'Black', hex: '#111827' },
          { name: 'White', hex: '#ffffff' },
          { name: 'Navy', hex: '#1e3a8a' },
          { name: 'Burgundy', hex: '#831843' }
        ];
      } else if (cat.includes('electronic') || cat.includes('laptop') || cat.includes('watch')) {
        updates.unitType = 'piece';
        updates.colors = [
          { name: 'Space Grey', hex: '#374151' },
          { name: 'Silver', hex: '#e5e7eb' },
          { name: 'Midnight', hex: '#0f172a' }
        ];
      } else {
        updates.unitType = 'piece';
      }

      await updateDoc(docSnap.ref, updates);
      console.log(`Updated product: "${data.title}" -> unitType: ${updates.unitType}, variants: ${updates.sizes ? updates.sizes.length + ' sizes' : 'none'}`);
    }

    // If no weight-based grocery products exist, seed fresh produce items
    if (groceryCount === 0) {
      console.log("Seeding realistic weight-based produce items...");
      const sampleProduce = [
        {
          title: "Fresh Red Apples (تفاح أحمر طازج)",
          price: 35.00,
          category: "groceries",
          description: "تفاح أحمر طازج عالي الجودة وممتاز للعصائر والاستهلاك اليومي. يباع بالوزن بالكسور (ربع كيلو، نصف كيلو، كيلو).",
          image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80",
          stock: 150,
          lowStockThreshold: 20,
          unitType: "weight",
          averageRating: 4.8,
          reviewCount: 14
        },
        {
          title: "Organic Fresh Tomatoes (طماطم طازجة عضوية)",
          price: 25.50,
          category: "groceries",
          description: "طماطم بلدية عضوية طازجة منتقاة بعناية. تباع بالوزن بالكيلوجرام وكسوره.",
          image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80",
          stock: 200,
          lowStockThreshold: 25,
          unitType: "weight",
          averageRating: 4.7,
          reviewCount: 9
        },
        {
          title: "Fresh Sweet Bananas (موز سكري طازج)",
          price: 30.00,
          category: "groceries",
          description: "موز أصفر طازج وغني بالبوتاسيوم والطاقة. يوزن بالكيلو والكسور.",
          image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80",
          stock: 120,
          lowStockThreshold: 15,
          unitType: "weight",
          averageRating: 4.9,
          reviewCount: 19
        }
      ];

      for (const item of sampleProduce) {
        const newDocRef = doc(collection(db, 'products'));
        await setDoc(newDocRef, item);
        console.log(`Created produce item: "${item.title}" with ID: ${newDocRef.id}`);
      }
    }

    console.log("Seeding & migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

runSeed();
