import type { User } from "firebase/auth";

export interface AuthState {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;

  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}