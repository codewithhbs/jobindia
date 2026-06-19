import client, { unwrap } from './client';

export const supportApi = {
  create: (body) => unwrap(client.post('/support', body)),
  myTickets: () => client.get('/support/my').then((r) => r.data),
  get: (id) => unwrap(client.get(`/support/${id}`)),
  reply: (id, message) => unwrap(client.post(`/support/${id}/reply`, { message })),
  close: (id) => unwrap(client.patch(`/support/${id}/close`)),
};
