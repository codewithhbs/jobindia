import client, { unwrap } from './client';

export const employerApi = {
  me: () => unwrap(client.get('/employers/me')),
  update: (formData) =>
    unwrap(client.put('/employers/me', formData, { headers: { 'Content-Type': 'multipart/form-data' } })),
  uploadDocuments: (formData) =>
    unwrap(client.post('/employers/me/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } })),
  dashboard: () => unwrap(client.get('/employers/me/dashboard')),
  // admin
  list: (params) => client.get('/employers', { params }).then((r) => r.data),
  verify: (id, status) => unwrap(client.put(`/employers/${id}/verify`, { status })),
};
