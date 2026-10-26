"use client";

import { create } from "zustand";

export interface AdminProfile {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin";
}

interface AdminState {
  admin: AdminProfile | null;
  isLoading: boolean;
  setAdmin: (admin: AdminProfile | null) => void;
  checkAdminSession: () => Promise<AdminProfile | null>;
  logoutAdmin: () => Promise<void>;
}

const getInitialAdmin = (): AdminProfile | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("almoman_admin_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useAdminStore = create<AdminState>((set) => ({
  admin: getInitialAdmin(),
  isLoading: false,

  setAdmin: (admin) => {
    if (typeof window !== "undefined") {
      if (admin) {
        localStorage.setItem("almoman_admin_user", JSON.stringify(admin));
      } else {
        localStorage.removeItem("almoman_admin_user");
      }
    }
    set({ admin, isLoading: false });
  },

  checkAdminSession: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/admin/me");
      if (res.ok) {
        const data = await res.json();
        if (data.admin) {
          if (typeof window !== "undefined") {
            localStorage.setItem("almoman_admin_user", JSON.stringify(data.admin));
          }
          set({ admin: data.admin, isLoading: false });
          return data.admin;
        }
      }
      if (typeof window !== "undefined") {
        localStorage.removeItem("almoman_admin_user");
      }
      set({ admin: null, isLoading: false });
      return null;
    } catch {
      set({ isLoading: false });
      return null;
    }
  },

  logoutAdmin: async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {}
    if (typeof window !== "undefined") {
      localStorage.removeItem("almoman_admin_user");
    }
    set({ admin: null, isLoading: false });
    window.location.href = "/admin/login";
  },
}));
