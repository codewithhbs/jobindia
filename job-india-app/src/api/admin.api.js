import client, { unwrap } from './client';

export const adminApi = {
  publicSettings: () => unwrap(client.get('/admin/settings/public')),
  sliders: (type) => unwrap(client.get(`/admin/home-sliders?type=${type}`)),

  categories: (type) => unwrap(client.get(`/admin/categories?is_Drivercat=${type}`)),
  onboarding: () => unwrap(client.get('/admin/onboarding')),
  faqs: () => unwrap(client.get('/admin/faqs')),
  plans: () => unwrap(client.get('/admin/plans')),
  allcms: () => unwrap(client.get(`/admin/cms`)),

  cms: (slug) => unwrap(client.get(`/admin/cms/${slug}`)),
  formFields: (params) => unwrap(client.get('/admin/forms/fields', { params })),
};
