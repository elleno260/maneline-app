import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getApp,
  getApps,
  initializeApp,
} from 'firebase/app';

import * as FirebaseAuth from 'firebase/auth';

import type {
  Auth,
  Persistence,
} from 'firebase/auth';

import {
  getFirestore,
} from 'firebase/firestore';

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
    : initializeApp(
        firebaseConfig
      );

/* =========================================================
   REACT NATIVE PERSISTENCE
   ========================================================= */

/*
 * Firebase's React Native runtime exports
 * getReactNativePersistence, but Firebase 12
 * can expose the wrong declaration file to
 * TypeScript in Expo projects.
 *
 * We access the React Native runtime export
 * through the module namespace instead of
 * importing it as a named TypeScript export.
 */

const getReactNativePersistence =
  (
    FirebaseAuth as typeof FirebaseAuth & {
      getReactNativePersistence: (
        storage: typeof AsyncStorage
      ) => Persistence;
    }
  ).getReactNativePersistence;

/* =========================================================
   FIREBASE AUTH
   ========================================================= */

let auth: Auth;

try {
  auth =
    FirebaseAuth.initializeAuth(
      firebaseApp,
      {
        persistence:
          getReactNativePersistence(
            AsyncStorage
          ),
      }
    );
} catch {
  /*
   * Fast Refresh may try to initialize
   * Firebase Auth more than once.
   */
  auth =
    FirebaseAuth.getAuth(
      firebaseApp
    );
}

/* =========================================================
   FIRESTORE
   ========================================================= */

const db =
  getFirestore(
    firebaseApp
  );

/* =========================================================
   EXPORTS
   ========================================================= */

export {
  firebaseApp,
  auth,
  db,
};

export const app =
  firebaseApp;