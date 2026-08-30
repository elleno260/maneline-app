import {
  getApp as getNativeFirebaseApp,
} from '@react-native-firebase/app';

import {
  getToken as getNativeAppCheckToken,
  initializeAppCheck as initializeNativeAppCheck,
  ReactNativeFirebaseAppCheckProvider,
} from '@react-native-firebase/app-check';

import {
  CustomProvider,
  getToken as getJsAppCheckToken,
  initializeAppCheck as initializeJsAppCheck,
  type AppCheck,
} from 'firebase/app-check';

import {
  firebaseApp,
} from '../firebaseConfig';

let jsAppCheck:
  AppCheck | null = null;

let initializationPromise:
  Promise<AppCheck> | null = null;

/* =========================================================
   INITIALIZE APP CHECK
   ========================================================= */

export function initializeManeLineAppCheck():
  Promise<AppCheck> {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise =
    initializeInternal();

  return initializationPromise;
}

async function initializeInternal():
  Promise<AppCheck> {
  const debugToken =
    process.env
      .EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN;

  if (
    __DEV__ &&
    !debugToken
  ) {
    throw new Error(
      'Missing EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN.'
    );
  }

  /* -------------------------------------------------------
     NATIVE ATTESTATION PROVIDER

     Development:
       Android → Debug
       iOS     → Debug

     Production:
       Android → Play Integrity
       iOS     → App Attest / DeviceCheck fallback
     ------------------------------------------------------- */

  const nativeProvider =
    new ReactNativeFirebaseAppCheckProvider();

  nativeProvider.configure({
    android: {
      provider:
        __DEV__
          ? 'debug'
          : 'playIntegrity',

      ...(debugToken
        ? {
            debugToken,
          }
        : {}),
    },

    apple: {
      provider:
        __DEV__
          ? 'debug'
          : 'appAttestWithDeviceCheckFallback',

      ...(debugToken
        ? {
            debugToken,
          }
        : {}),
    },
  });

  const nativeAppCheck =
    await initializeNativeAppCheck(
      getNativeFirebaseApp(),
      {
        provider:
          nativeProvider,

        isTokenAutoRefreshEnabled:
          true,
      }
    );

  /* -------------------------------------------------------
     BRIDGE NATIVE APP CHECK → FIREBASE JS SDK

     ManeLine's callable Functions currently use:

       firebase/functions

     rather than:

       @react-native-firebase/functions

     Therefore the JS Firebase app needs its own App Check
     provider.

     This provider obtains its token from the native
     App Check implementation above.
     ------------------------------------------------------- */

  const jsProvider =
    new CustomProvider({
      getToken: async () => {
        const result =
          await getNativeAppCheckToken(
            nativeAppCheck,
            false
          );

        /*
         * Your App Check TTL is currently 1 hour.
         *
         * Give the JS SDK a slightly shorter cache
         * lifetime so it refreshes before expiration.
         */
        return {
          token:
            result.token,

          expireTimeMillis:
            Date.now() +
            50 * 60 * 1000,
        };
      },
    });

  jsAppCheck =
    initializeJsAppCheck(
      firebaseApp,
      {
        provider:
          jsProvider,

        isTokenAutoRefreshEnabled:
          true,
      }
    );

  return jsAppCheck;
}

/* =========================================================
   DEVELOPMENT VERIFICATION
   ========================================================= */

export async function verifyManeLineAppCheck():
  Promise<boolean> {
  try {
    const appCheck =
      await initializeManeLineAppCheck();

    const result =
      await getJsAppCheckToken(
        appCheck,
        true
      );

    const valid =
      result.token.length >
      0;

    console.log(
      '[App Check] Verification:',
      valid
        ? 'PASSED'
        : 'FAILED'
    );

    return valid;
  } catch (error) {
    console.error(
      '[App Check] Verification failed:',
      error
    );

    return false;
  }
}