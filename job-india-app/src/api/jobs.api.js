import client, { unwrap } from './client';

export const jobsApi = {
  list: (params) => client.get('/jobs', { params }).then((r) => r.data),
  recomended: (params) => client.get('/jobs/for-home', { params }).then((r) => r.data),

  nearby: (params) => unwrap(client.get('/jobs/nearby', { params })),
  get: (id) => unwrap(client.get(`/jobs/${id}`)),
  create: (body) => unwrap(client.post('/jobs', body)),
  update: (id, body) => unwrap(client.put(`/jobs/${id}`, body)),
  remove: (id) => client.delete(`/jobs/${id}`),
  apply: (id, body) => unwrap(client.post(`/jobs/${id}/apply`, body)),
  save: (id) => client.post(`/jobs/${id}/save`).then((r) => r.data),
  myApplications: (params) => client.get('/jobs/me/applications', { params }).then((r) => r.data),
  savedJobs: () => unwrap(client.get('/jobs/me/saved')),
  myJobs: (params) => client.get('/jobs/me/jobs', { params }).then((r) => r.data),
  jobApplications: (id, params) => client.get(`/jobs/${id}/applications`, { params }).then((r) => r.data),
  updateApplicationStatus: (id, body) => unwrap(client.put(`/jobs/applications/${id}/status`, body)),
};
