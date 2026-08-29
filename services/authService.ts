import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';

import {
  auth,
} from '../firebaseConfig';

const AUTH_WAIT_TIMEOUT_MS =
  3000;

/* =========================================================
   WAIT FOR FIREBASE AUTH TO RESTORE
   ========================================================= */

function waitForInitialAuthState():
  Promise<User | null> {
  if (auth.currentUser) {
    return Promise.resolve(
      auth.currentUser
    );
  }

  return new Promise(
    (resolve) => {
      let settled =
        false;

      let timeout:
        ReturnType<
          typeof setTimeout
        >;

      const unsubscribe =
        onAuthStateChanged(
          auth,
          (user) => {
            if (settled) {
              return;
            }

            settled =
              true;

            clearTimeout(
              timeout
            );

            unsubscribe();

            resolve(
              user
            );
          }
        );

      timeout =
        setTimeout(
          () => {
            if (settled) {
              return;
            }

            settled =
              true;

            unsubscribe();

            resolve(
              auth.currentUser ??
                null
            );
          },
          AUTH_WAIT_TIMEOUT_MS
        );
    }
  );
}

/* =========================================================
   GUEST AUTH
   ========================================================= */

export async function getOrCreateGuestUser():
  Promise<User> {
  const existingUser =
    await waitForInitialAuthState();

  /*
   * This may already be:
   *
   * - an anonymous guest
   * - a registered user
   *
   * Never replace an existing user
   * with another anonymous account.
   */
  if (existingUser) {
    return existingUser;
  }

  const credential =
    await signInAnonymously(
      auth
    );

  return credential.user;
}

export async function continueAsGuest():
  Promise<User> {
  return getOrCreateGuestUser();
}

/* =========================================================
   LOGIN
   ========================================================= */

export async function loginUser(
  email: string,
  password: string
): Promise<User> {
  const normalizedEmail =
    email
      .trim()
      .toLowerCase();

  const credential =
    await signInWithEmailAndPassword(
      auth,
      normalizedEmail,
      password
    );

  return credential.user;
}

/* =========================================================
   CREATE ACCOUNT
   ========================================================= */

export async function registerUser(
  email: string,
  password: string
): Promise<User> {
  const normalizedEmail =
    email
      .trim()
      .toLowerCase();

  const currentUser =
    await waitForInitialAuthState();

  /*
   * CASE 1:
   * The user already uses ManeLine
   * as a guest.
   *
   * Instead of creating a new Firebase
   * user, link email/password to their
   * anonymous account.
   *
   * Their UID stays exactly the same.
   */
  if (
    currentUser?.isAnonymous
  ) {
    const credential =
      EmailAuthProvider
        .credential(
          normalizedEmail,
          password
        );

    const linkedUser =
      await linkWithCredential(
        currentUser,
        credential
      );

    return linkedUser.user;
  }

  /*
   * CASE 2:
   * No current Firebase session.
   *
   * Create a normal email/password
   * account.
   */
  if (!currentUser) {
    const credential =
      await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );

    return credential.user;
  }

  /*
   * CASE 3:
   * Already logged into a registered
   * account.
   */
  return currentUser;
}

/* =========================================================
   LOG OUT
   ========================================================= */

export async function logoutUser():
  Promise<void> {
  await signOut(
    auth
  );
}

/* =========================================================
   CURRENT USER HELPERS
   ========================================================= */

export async function waitForAuthUser():
  Promise<User | null> {
  return waitForInitialAuthState();
}

export async function getCurrentUserIdOrThrow():
  Promise<string> {
  const user =
    await getOrCreateGuestUser();

  return user.uid;
}

export async function getCurrentUserEmail():
  Promise<string> {
  const user =
    await waitForAuthUser();

  return (
    user?.email ??
    ''
  );
}

export async function isSignedIn():
  Promise<boolean> {
  const user =
    await waitForAuthUser();

  return !!user;
}

export async function isGuestUser():
  Promise<boolean> {
  const user =
    await waitForAuthUser();

  return !!(
    user &&
    user.isAnonymous
  );
}

export async function isRegisteredUser():
  Promise<boolean> {
  const user =
    await waitForAuthUser();

  return !!(
    user &&
    !user.isAnonymous
  );
}