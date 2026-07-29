import { create } from "zustand";
import { tokenStore } from "@/api/client";

const USER_KEY = "admin_user";

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem(USER_KEY) || "null"),
  isAuthenticated: !!tokenStore.getAccess(),

  setSession: ({ user, accessToken, refreshToken }) => {
    tokenStore.set(accessToken, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  updateUser: (patch) => {
    const updated = { ...get().user, ...patch };
    localStorage.setItem(USER_KEY, JSON.stringify(updated));
    set({ user: updated });
  },

  logout: () => {
    tokenStore.clear();
    localStorage.removeItem(USER_KEY);
    set({ user: null, isAuthenticated: false });
  },
}));
