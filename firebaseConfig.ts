import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBAkxNqOZpnti7BWU6DAT9qpPceuuTCi5w",
  authDomain: "maneline-bba75.firebaseapp.com",
  projectId: "maneline-bba75",
  storageBucket: "maneline-bba75.firebasestorage.app",
  messagingSenderId: "1057589010125",
  appId: "1:1057589010125:web:19f9f4565753b207c4d384"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const ai = getAI(app, {
  backend: new GoogleAIBackend(),
});

export const geminiModel = getGenerativeModel(ai, {
  model: "gemini-2.5-flash",
});
