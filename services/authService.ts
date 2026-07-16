import { auth } from '../firebaseConfig';
import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';

const AUTH_WAIT_TIMEOUT_MS = 3000;

function waitForInitialAuthState(): Promise<User | null> {
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }

  return new Promise((resolve) => {
    let settled = false;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        unsubscribe();
        resolve(user);
      }
    });

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        unsubscribe();
        resolve(auth.currentUser ?? null);
      }
    }, AUTH_WAIT_TIMEOUT_MS);
  });
}

export async function getOrCreateGuestUser(): Promise<User> {
  const existingUser = await waitForInitialAuthState();

  if (existingUser) {
    return existingUser;
  }

  const credential = await signInAnonymously(auth);
  return credential.user;
}

export async function waitForAuthUser(): Promise<User | null> {
  try {
    return await getOrCreateGuestUser();
  } catch (error) {
    console.warn('Guest auth failed:', error);
    return null;
  }
}

export async function getCurrentUserIdOrThrow() {
  const user = await getOrCreateGuestUser();
  return user.uid;
}

export async function getCurrentUserEmail() {
  const user = await waitForAuthUser();
  return user?.email ?? '';
}

export async function isSignedIn() {
  const user = await waitForAuthUser();
  return !!user;
}