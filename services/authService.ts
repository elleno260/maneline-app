import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,} from "firebase/auth";
import { auth } from "../firebaseConfig";
import { createUserProfile } from "./userProfileService";

export async function registerUser(email: string, password: string) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  await createUserProfile(userCredential.user.uid, {
    email: userCredential.user.email,
    hairType: "",
    porosity: "",
    density: "",
    goals: [],

    onboardingComplete: false,
    avatar: {
      skinTone: "",
      hairShape: "",
      hairLength: "",
      hairColor: "",
      shirtColor: "",
    },
  });

  return userCredential;
}

export async function loginUser(email: string, password: string) {
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function logoutUser() {
  return await signOut(auth);
}