import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

function guessCategory(functions: string[]) {
  const text = functions.join(" ").toLowerCase();

  if (text.includes("humectant")) return "humectant";
  if (text.includes("emollient")) return "emollient";
  if (text.includes("surfactant") || text.includes("cleansing")) return "surfactant";
  if (text.includes("preservative")) return "preservative";
  if (text.includes("fragrance") || text.includes("perfuming")) return "fragrance";
  if (text.includes("colorant")) return "colorant";
  if (text.includes("film forming")) return "film-former";
  if (text.includes("conditioning")) return "conditioning-agent";

  return "uncategorized";
}

function buildDescription(name: string, functions: string[]) {
  if (functions.length === 0) {
    return `${name} is a cosmetic ingredient. ManeLine has not added a plain-language explanation for this ingredient yet.`;
  }

  return `${name} is commonly used in cosmetics as: ${functions.join(", ")}. ManeLine can add more hair-specific context for this ingredient over time.`;
}

async function importIngredients() {
  const csvPath = path.join(
    process.cwd(),
    "data",
    "imports",
    "cosing-ingredients.csv"
  );

  const csvText = fs.readFileSync(csvPath, "utf8");

  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`Found ${records.length} rows.`);

  let importedCount = 0;

  for (const row of records) {
    /**
     * These column names may need to be adjusted based on your CSV.
     * After you open the CSV, check the exact headers.
     */
    const name =
      row["INCI name"] ||
      row["INCI Name"] ||
      row["Name"] ||
      row["Ingredient"] ||
      row["ingredient"] ||
      "";

    if (!name) continue;

    const functionsRaw =
      row["Function"] ||
      row["Functions"] ||
      row["Cosmetic Function"] ||
      row["function"] ||
      "";

    const functions = String(functionsRaw)
      .split(/,|;/)
      .map((item) => item.trim())
      .filter(Boolean);

    const casNumber = row["CAS No"] || row["CAS"] || row["CAS Number"] || "";

    const id = slugify(name);

    if (!id) continue;

    const ingredientDoc = {
      name,
      normalizedName: normalize(name),
      inciName: name,
      aliases: [],
      functions,
      function: functions[0] || "Unknown",
      category: guessCategory(functions),
      description: buildDescription(name, functions),

      casNumber: casNumber || null,

      safetyRating: "unknown",
      safetyScore: 0,

      porosityCompatibility: {
        low: "unknown",
        medium: "unknown",
        high: "unknown",
      },

      hairTypeFlags: {
        straight: "unknown",
        wavy: "unknown",
        curly: "unknown",
        coily: "unknown",
      },

      concerns: [],
      benefits: [],
      avoidIf: [],
      goodFor: [],

      source: "CosIng",
      sourceRegion: "EU",
      needsManeLineReview: true,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, "ingredients", id), ingredientDoc, {
      merge: true,
    });

    importedCount += 1;

    if (importedCount % 100 === 0) {
      console.log(`Imported ${importedCount} ingredients...`);
    }
  }

  console.log(`Done. Imported ${importedCount} ingredients into Firestore.`);
}

importIngredients().catch((error) => {
  console.error("Import failed:", error);
});