import client, { unwrap } from './client';

export const jobseekerApi = {
  me: () => unwrap(client.get('/jobseekers/me')),
  update: (body) => unwrap(client.put('/jobseekers/me', body)),
  uploadResume: (formData) =>
    unwrap(client.put('/jobseekers/me/resume', formData, { headers: { 'Content-Type': 'multipart/form-data' } })),
  toggleOpenToWork: (isOpenToWork) => unwrap(client.put('/jobseekers/me/open-to-work', { isOpenToWork })),
  dashboard: () => unwrap(client.get('/jobseekers/me/dashboard')),
  addEducation: (body) => unwrap(client.post('/jobseekers/me/education', body)),
  updateEducation: (id, body) => unwrap(client.put(`/jobseekers/me/education/${id}`, body)),
  deleteEducation: (id) => unwrap(client.delete(`/jobseekers/me/education/${id}`)),
  addExperience: (body) => unwrap(client.post('/jobseekers/me/experience', body)),
  updateExperience: (id, body) => unwrap(client.put(`/jobseekers/me/experience/${id}`, body)),
  deleteExperience: (id) => unwrap(client.delete(`/jobseekers/me/experience/${id}`)),
  // employer/admin
  search: (params) => client.get('/jobseekers', { params }).then((r) => r.data),
  publicProfile: (id) => unwrap(client.get(`/jobseekers/${id}`)),
};
