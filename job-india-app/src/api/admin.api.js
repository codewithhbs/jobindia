import client, { unwrap } from './client';

export const adminApi = {
  publicSettings: () => unwrap(client.get('/admin/settings/public')),
  sliders: () => unwrap(client.get('/admin/home-sliders')),

  categories: () => unwrap(client.get('/admin/categories')),
  onboarding: () => unwrap(client.get('/admin/onboarding')),
  faqs: () => unwrap(client.get('/admin/faqs')),
  plans: () => unwrap(client.get('/admin/plans')),
  cms: (slug) => unwrap(client.get(`/admin/cms/${slug}`)),
  formFields: (params) => unwrap(client.get('/admin/forms/fields', { params })),
};
