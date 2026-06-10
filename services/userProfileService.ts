import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export type HairProfile = {
  email?: string | null;

  // Recommendation profile
  hairType?: string;
  porosity?: string;
  density?: string;
  goals?: string[];

  // Onboarding status
  onboardingComplete?: boolean;

  // Avatar customization
  avatar?: {
    skinTone?: string;
    hairShape?: string;
    hairLength?: string;
    hairColor?: string;
    shirtColor?: string;
  };

  updatedAt?: string;
};
export async function createUserProfile(userId: string, profile: HairProfile) {
  const userRef = doc(db, "users", userId);

  await setDoc(userRef, {
    ...profile,
    updatedAt: new Date().toISOString(),
  });
}

export async function getUserProfile(userId: string) {
  const userRef = doc(db, "users", userId);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as HairProfile;
}



export async function updateUserProfile(userId: string, profile: Partial<HairProfile>) {
  const userRef = doc(db, "users", userId);

  await updateDoc(userRef, {
    ...profile,
    updatedAt: new Date().toISOString(),
  });
}