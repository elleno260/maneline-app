import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../firebaseConfig";
import { useAuthStore } from "../store/authStore";

export function useAuthListener() {
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    setLoading(true);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return unsubscribe;
  }, [setUser, setLoading]);
}