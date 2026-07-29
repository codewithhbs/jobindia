import { create } from 'zustand';
import { API } from '../lib/api';
import { tokenStore, setLogoutHandler } from '../lib/axios';

export const useAuth = create((set, get) => ({
  user: tokenStore.user,
  isAuthenticated: !!tokenStore.access && !!tokenStore.user,

  login: async ({ accessToken, refreshToken, user }) => {
    tokenStore.set({ accessToken, refreshToken, user });
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    try { await API.auth.logout(tokenStore.refresh).catch(() => {}); } finally {
      tokenStore.clear();
      set({ user: null, isAuthenticated: false });
    }
  },

  hasRole: (roles) => (roles ? roles.includes(get().user?.role) : true),
}));

// hard logout when refresh fails
setLogoutHandler(() => useAuth.setState({ user: null, isAuthenticated: false }));
