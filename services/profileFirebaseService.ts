import { db } from '../firebaseConfig';
import {
  getCurrentUserEmail,
  getCurrentUserIdOrThrow,
} from '../services/authService';
import { HairProfileForMatching } from '../types/product.types';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

export type RoutineStep = {
  id: string;
  title: string;
  frequency: string;
  productType: string;
  note: string;
};

export type UserHairProfile = HairProfileForMatching & {
  displayName: string;
  email: string;
  routineCompatibilityScore: number;
  routineSteps: RoutineStep[];
};

function getProfileRef(userId: string) {
  return doc(db, 'users', userId, 'profile', 'main');
}

export async function saveUserHairProfile(profile: UserHairProfile) {
  const userId = await getCurrentUserIdOrThrow();
  const email = await getCurrentUserEmail();

  const cleanedProfile: UserHairProfile = {
    ...profile,
    email: profile.email || email,
    goals: profile.goals ?? [],
    routineSteps: profile.routineSteps ?? [],
  };

  await setDoc(
    getProfileRef(userId),
    {
      ...cleanedProfile,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return cleanedProfile;
}

export async function getUserHairProfileOrNull(): Promise<UserHairProfile | null> {
  const userId = await getCurrentUserIdOrThrow();

  const snapshot = await getDoc(getProfileRef(userId));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as UserHairProfile;
}