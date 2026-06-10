import { create } from "zustand";
import type { AuthState } from "../types/auth.types";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  isLoggedIn: false,

  setUser: (user) =>
    set({
      user,
      isLoggedIn: !!user,
      loading: false,
    }),

  setLoading: (loading) => set({ loading }),

  clearUser: () =>
    set({
      user: null,
      isLoggedIn: false,
      loading: false,
    }),
}));