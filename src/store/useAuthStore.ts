import { create } from "zustand";

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  role: "user" | "admin";
  createdAt?: string;
}

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const getInitialUser = (): UserProfile | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("almoman_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getInitialUser(),
  isLoading: false,

  setUser: (user) => {
    if (typeof window !== "undefined") {
      if (user) {
        localStorage.setItem("almoman_user", JSON.stringify(user));
      } else {
        localStorage.removeItem("almoman_user");
      }
    }
    set({ user, isLoading: false });
  },

  fetchUser: async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (typeof window !== "undefined") {
          if (data.user) {
            localStorage.setItem("almoman_user", JSON.stringify(data.user));
          } else {
            localStorage.removeItem("almoman_user");
          }
        }
        set({ user: data.user, isLoading: false });
      } else {
        if (typeof window !== "undefined") {
          localStorage.removeItem("almoman_user");
        }
        set({ user: null, isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("almoman_user");
      }
      set({ user: null, isLoading: false });
    }
  },
}));
