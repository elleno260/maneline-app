import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { ingredientsSeed } from "../data/ingredientsSeed";

const firebaseConfig = {
  apiKey: "AIzaSyBAkxNqOZpnti7BWU6DAT9qpPceuuTCi5w",
  authDomain: "maneline-bba75.firebaseapp.com",
  projectId: "maneline-bba75",
  storageBucket: "maneline-bba75.firebasestorage.app",
  messagingSenderId: "1057589010125",
  appId: "1:1057589010125:web:19f9f4565753b207c4d384"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

async function seedIngredients() {
  try {
    console.log("Starting ingredient seed...");

    for (const ingredient of ingredientsSeed) {
      const { id, ...ingredientData } = ingredient;

      await setDoc(doc(db, "ingredients", id), ingredientData, {
        merge: true,
      });

      console.log(`Seeded: ${ingredient.name}`);
    }

    console.log("Ingredient seed complete.");
  } catch (error) {
    console.error("Error seeding ingredients:", error);
  }
}

seedIngredients();