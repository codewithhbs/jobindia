import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const KEY = { access: 'admin_access', refresh: 'admin_refresh', user: 'admin_user' };

export const tokenStore = {
  get access() { return localStorage.getItem(KEY.access); },
  get refresh() { return localStorage.getItem(KEY.refresh); },
  get user() { try { return JSON.parse(localStorage.getItem(KEY.user)); } catch { return null; } },
  set({ accessToken, refreshToken, user }) {
    if (accessToken) localStorage.setItem(KEY.access, accessToken);
    if (refreshToken) localStorage.setItem(KEY.refresh, refreshToken);
    if (user) localStorage.setItem(KEY.user, JSON.stringify(user));
  },
  clear() { Object.values(KEY).forEach((k) => localStorage.removeItem(k)); },
};

let onLogout = null;
export const setLogoutHandler = (fn) => { onLogout = fn; };

const api = axios.create({ baseURL: API_URL, timeout: 20000 });

api.interceptors.request.use((config) => {
  const t = tokenStore.access;
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

let refreshing = false;
let queue = [];
const flush = (err, token) => { queue.forEach((p) => (err ? p.reject(err) : p.resolve(token))); queue = []; };

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;
    if (status !== 401 || original._retry || original.url?.includes('/auth/refresh-token')) {
      return Promise.reject(normalize(error));
    }
    original._retry = true;
    if (refreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve: (token) => { original.headers.Authorization = `Bearer ${token}`; resolve(api(original)); }, reject });
      });
    }
    refreshing = true;
    try {
      const refreshToken = tokenStore.refresh;
      if (!refreshToken) throw new Error('No refresh token');
      const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
      const newAccess = data?.data?.accessToken;
      tokenStore.set({ accessToken: newAccess });
      flush(null, newAccess);
      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch (e) {
      flush(e, null);
      tokenStore.clear();
      onLogout?.();
      return Promise.reject(normalize(error));
    } finally {
      refreshing = false;
    }
  }
);

function normalize(error) {
  const msg = error?.response?.data?.message || error?.message || 'Request failed';
  const e = new Error(msg);
  e.status = error?.response?.status;
  return e;
}

export const unwrap = (p) => p.then((r) => r.data?.data ?? r.data);
export default api;
