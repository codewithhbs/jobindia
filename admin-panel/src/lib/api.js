import api, { unwrap } from './axios';

export const API = {
  BASE_URL:'https://jobapi.adsdigitalmedia.com',
  auth: {
    sendOtp: (phone) => unwrap(api.post('/auth/send-otp-admin', { phone })),
    verifyOtp: (payload) => unwrap(api.post('/auth/verify-otp-admin', payload)),
    logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  },
  users: {
    list: (params) => api.get('/users', { params }).then((r) => r.data),
    get: (id) => api.get(`/users/${id}`).then((r) => r.data.data),

    stats: () => unwrap(api.get('/users/stats/overview')),

    setStatus: (id, isActive) => unwrap(api.put(`/users/${id}/status`, { isActive })),
  },
  employers: {
    list: (params) => api.get('/employers', { params }).then((r) => r.data),
    verify: (id, status) => unwrap(api.put(`/employers/${id}/verify`, { status })),
  },
  kyc: {
    pending: (params) => api.get('/kyc/pending', { params }).then((r) => r.data),
    stats: () => unwrap(api.get('/kyc/stats')),
    review: (userId, body) => unwrap(api.put(`/kyc/${userId}/review`, body)),
  },
  jobs: {
    list: (params) => api.get('/jobs', { params }).then((r) => r.data),
    get: (id) => unwrap(api.get(`/jobs/${id}`)),
    getFull: (id) => unwrap(api.get(`/jobs/full/${id}`)),
    getPendingVerification: () => unwrap(api.get(`/jobs/pending-vericiation`)),
    remove: (id) => api.delete(`/jobs/${id}`),
  },
  categories: {
    list: () => unwrap(api.get('/admin/categories')),
    create: (body) => unwrap(api.post('/admin/categories', body)),
    update: (id, body) => unwrap(api.put(`/admin/categories/${id}`, body)),
  },
  notifications: {
    broadcast: (body) => unwrap(api.post('/notifications/broadcast', body)),
  },
  support: {
    list: (params) => api.get('/support', { params }).then((r) => r.data),
    adminReply: (id, message) => unwrap(api.post(`/support/${id}/admin-reply`, { message })),
    setStatus: (id, status) => unwrap(api.patch(`/support/${id}/status`, { status })),
  },
  settings: {
    all: () => unwrap(api.get('/admin/settings')),
    upsert: (body) => unwrap(api.post('/admin/settings', body)),
  },
  plans: {
    list: () => unwrap(api.get('/admin/plans')),
    upsert: (body) => unwrap(api.post('/admin/plans', body)),
  },
  onboarding: {
    list: () => unwrap(api.get('/admin/onboarding')),
    create: (formData) => unwrap(api.post('/admin/onboarding', formData, { headers: { 'Content-Type': 'multipart/form-data' } })),
    update: (id, formData) => unwrap(api.put(`/admin/onboarding/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })),
    remove: (id) => api.delete(`/admin/onboarding/${id}`),
  },
  faqs: {
    list: () => unwrap(api.get('/admin/faqs')),
    create: (body) => unwrap(api.post('/admin/faqs', body)),
    update: (id, body) => unwrap(api.put(`/admin/faqs/${id}`, body)),
    remove: (id) => api.delete(`/admin/faqs/${id}`),
  },
  cms: {
    list: () => unwrap(api.get('/admin/cms')),
    upsert: (body) => unwrap(api.post('/admin/cms', body)),
  },
  analytics: {
    overview: () => unwrap(api.get('/analytics/overview')),
  },
  jobseekers: {
    fullUpdate: (userId,body) => api.get(`/jobseekers/${userId}`, body),
    search: (params) => api.get('/jobseekers', { params }).then((r) => r.data),
  },
  manage: {
    createJob: (body) => unwrap(api.post('/jobs', body)),
    getJob: (id) => unwrap(api.get(`/jobs/${id}`)),
    updateJob: (id, body) => unwrap(api.put(`/jobs/${id}`, body)),
    updateUser: (id, body) => unwrap(api.put(`/users/manage/${id}`, body)),
    getEmployer: (userId) => unwrap(api.get(`/employers/${userId}`)),
    updateEmployer: (userId, body) => unwrap(api.put(`/employers/${userId}`, body)),
    getJobseeker: (userId) => unwrap(api.get(`/manage/jobseekers/${userId}`)),
    updateJobseeker: (userId, body) => unwrap(api.put(`/manage/jobseekers/${userId}`, body)),
  },
};
