import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
//import {getFunctions} from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyBAkxNqOZpnti7BWU6DAT9qpPceuuTCi5w",
  authDomain: "maneline-bba75.firebaseapp.com",
  projectId: "maneline-bba75",
  storageBucket: "maneline-bba75.firebasestorage.app",
  messagingSenderId: "1057589010125",
  appId: "1:1057589010125:web:19f9f4565753b207c4d384"
};
const firebaseApp =
  getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig);

export {
  firebaseApp,
};

export const app =
  firebaseApp;

export const auth =
  getAuth(firebaseApp);

export const db =
  getFirestore(firebaseApp);