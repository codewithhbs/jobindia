import client, { unwrap } from './client';

export const kycApi = {
  submit: (body) => unwrap(client.post('/kyc/submit', body)),
  status: () => unwrap(client.get('/kyc/status')),
  // admin
  pending: (params) => client.get('/kyc/pending', { params }).then((r) => r.data),
  review: (userId, body) => unwrap(client.put(`/kyc/${userId}/review`, body)),
  stats: () => unwrap(client.get('/kyc/stats')),
};
