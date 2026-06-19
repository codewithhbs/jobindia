import * as SecureStore from 'expo-secure-store';

// expo-secure-store keys must be alphanumeric + . - _
const KEYS = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
  USER: 'auth_user',
};

export const storage = {
  async setTokens({ accessToken, refreshToken }) {
    if (accessToken) await SecureStore.setItemAsync(KEYS.ACCESS, accessToken);
    if (refreshToken) await SecureStore.setItemAsync(KEYS.REFRESH, refreshToken);
  },
  getAccessToken: () => SecureStore.getItemAsync(KEYS.ACCESS),
  getRefreshToken: () => SecureStore.getItemAsync(KEYS.REFRESH),

  async setUser(user) {
    await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));
  },
  async getUser() {
    const raw = await SecureStore.getItemAsync(KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  },

  async clear() {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.ACCESS),
      SecureStore.deleteItemAsync(KEYS.REFRESH),
      SecureStore.deleteItemAsync(KEYS.USER),
    ]);
  },
};
