import client, { unwrap } from './client';

export const notificationsApi = {
  list: (params) => client.get('/notifications', { params }).then((r) => r.data),
  markRead: (id) => client.put(`/notifications/${id}/read`),
  markAllRead: () => client.put('/notifications/read-all'),
  // admin
  broadcast: (body) => unwrap(client.post('/notifications/broadcast', body)),
};
