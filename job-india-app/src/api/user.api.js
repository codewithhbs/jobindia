import client, { unwrap } from './client';

export const userApi = {
  getProfile: () => unwrap(client.get('/users/me/profile')),
  getUniversalProfile: (id) => unwrap(client.get(`/users/profile/${id}`)),

  updateProfile: (formData) => unwrap(client.put('/users/me/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } })),
  updateLocation: (loc) => unwrap(client.put('/users/me/location', loc)),
  updatePushToken: (tokens) => client.put('/users/me/push-token', tokens),
  nearby: (params) => unwrap(client.get('/users/nearby/search', { params })),
  // admin
  list: (params) => client.get('/users', { params }).then((r) => r.data),
  stats: () => unwrap(client.get('/users/stats/overview')),
  setStatus: (id, isActive) => unwrap(client.put(`/users/${id}/status`, { isActive })),
};
