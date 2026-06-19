import client, { unwrap } from './client';

export const paymentsApi = {
  createOrder: (body) => unwrap(client.post('/payments/create-order', body)),
  verify: (body) => unwrap(client.post('/payments/verify', body)),
  myPayments: () => unwrap(client.get('/payments/me')),
};
