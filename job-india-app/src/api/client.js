import axios from 'axios';
import { API_URL } from '../constants/config';
import { storage } from '../services/storage';

const client = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

let onAuthFailure = null;
export const setAuthFailureHandler = (fn) => {
  onAuthFailure = fn;
};

// ── In-memory cache, single source of truth for the running session ──
// Storage is for persistence across app restarts only — never the read path.
let accessTokenCache = null;
let tokenLoadPromise = null;

const loadTokenFromStorage = async () => {
  if (accessTokenCache !== null) return accessTokenCache;
  if (!tokenLoadPromise) {
    tokenLoadPromise = storage.getAccessToken().then((t) => {
      accessTokenCache = t || null;
      return accessTokenCache;
    });
  }
  return tokenLoadPromise;
};

export const setAccessToken = async (token) => {
  accessTokenCache = token;
  tokenLoadPromise = null;
  if (token) {
    await storage.setTokens({ accessToken: token });
  }
};

export const clearAccessToken = async () => {
  accessTokenCache = null;
  tokenLoadPromise = null;
  await storage.clear();
};

// ── Request: attach bearer token from memory cache ──
client.interceptors.request.use(async (config) => {
  const token = await loadTokenFromStorage();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: transparent refresh on 401 ──
let isRefreshing = false;
let queue = [];

const flushQueue = (error, token = null) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  queue = [];
};

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    const original = config || {};

    if (
      !response ||
      response.status !== 401 ||
      original._retry ||
      original.url?.includes('/auth/refresh-token')
    ) {
      return Promise.reject(normalize(error));
    }

    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(client(original));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const refreshToken = await storage.getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token');

      const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
      const newAccess = data?.data?.accessToken;
      if (!newAccess) throw new Error('Refresh failed');

      await setAccessToken(newAccess);
      flushQueue(null, newAccess);

      original.headers.Authorization = `Bearer ${newAccess}`;
      return client(original);
    } catch (err) {
      flushQueue(err, null);
      await clearAccessToken();
      if (onAuthFailure) onAuthFailure();
      return Promise.reject(normalize(error));
    } finally {
      isRefreshing = false;
    }
  }
);

function normalize(error) {
  const msg =
    error?.response?.data?.message ||
    error?.message ||
    'Something went wrong. Please try again.';
  const e = new Error(msg);
  e.status = error?.response?.status;
  e.data = error?.response?.data;
  return e;
}

export const unwrap = (promise) => promise.then((r) => r.data?.data ?? r.data);

export default client;