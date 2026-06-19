import { create } from 'zustand';
import { authApi } from '../api/auth.api';
import { jobseekerApi } from '../api/jobseeker.api';
import { storage } from '../services/storage';
import { setAuthFailureHandler, setAccessToken, clearAccessToken } from '../api/client';

export const useAuthStore = create((set, get) => ({
  user: null,
  role: null,
  isLoading: true,
  isAuthenticated: false,

  bootstrap: async () => {
    try {
      // Seeds the in-memory token cache from storage exactly once at app start.
      const token = await storage.getAccessToken();

      if (!token) {
        set({
          user: null,
          role: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      await setAccessToken(token);

      try {
        // Latest profile from API
        const res = await jobseekerApi.me();

        const user = res;

        // await storage.setUser(user);

        set({
          user,
          role: user.role,
          isAuthenticated: true,
        });
      } catch (err) {
        console.log('Profile fetch failed, using cached user', err);

        // Fallback to stored user
        const cachedUser = await storage.getUser();

        if (cachedUser) {
          set({
            user: cachedUser,
            role: cachedUser.role,
            isAuthenticated: true,
          });
        } else {
          set({
            user: null,
            role: null,
            isAuthenticated: false,
          });
        }
      }
    } catch (error) {
      console.log(error);
      set({
        user: null,
        role: null,
        isAuthenticated: false,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  setSession: async ({ accessToken, refreshToken, user }) => {
    // Memory cache first — any request fired right after this resolves uses it immediately.
    await setAccessToken(accessToken);
    await storage.setTokens({ accessToken, refreshToken });
    await storage.setUser(user);

    set({
      user,
      role: user.role,
      isAuthenticated: true,
    });

    return user;
  },

  updateUser: async (patch) => {
    const next = { ...get().user, ...patch };

    await storage.setUser(next);

    set({
      user: next,
      role: next.role,
    });
  },

  logout: async () => {
    try {
      const refreshToken = await storage.getRefreshToken();
      await authApi.logout(refreshToken).catch(() => {});
    } finally {
      await clearAccessToken();
      set({
        user: null,
        role: null,
        isAuthenticated: false,
      });
    }
  },
}));

setAuthFailureHandler(() => {
  useAuthStore.setState({
    user: null,
    role: null,
    isAuthenticated: false,
  });
});