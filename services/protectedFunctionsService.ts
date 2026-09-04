import {
  getFunctions,
  type Functions,
} from 'firebase/functions';

import {
  firebaseApp,
} from '../firebaseConfig';

import {
  initializeManeLineAppCheck,
} from './appCheckService';

let functionsPromise:
  Promise<Functions> | null =
  null;

export async function getProtectedFunctions():
  Promise<Functions> {
  if (
    functionsPromise
  ) {
    return functionsPromise;
  }

  functionsPromise =
    (async () => {
      /*
       * IMPORTANT:
       *
       * Make sure the Firebase JS App Check
       * provider exists before Firebase
       * Functions is instantiated.
       */
      await initializeManeLineAppCheck();

      return getFunctions(
        firebaseApp,
        'us-central1'
      );
    })().catch(
      (error) => {
        /*
         * Allow a future retry if
         * initialization failed.
         */
        functionsPromise =
          null;

        throw error;
      }
    );

  return functionsPromise;
}