import { api } from "./client";
import { buildQueryString } from "@/lib/utils";

export const settingsApi = {
  list: (params) => api.get(`/admin/settings${buildQueryString(params)}`),
  upsert: (payload) => api.post("/admin/settings", payload),
  bulkUpdate: (settings) => api.put("/admin/settings/bulk", { settings }),
};

export const categoriesApi = {
  list: (params) => api.get(`/admin/categories${buildQueryString(params)}`),
  create: (formData) =>
    api.post("/admin/categories", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id, formData) =>
    api.put(`/admin/categories/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  remove: (id) => api.delete(`/admin/categories/${id}`),
};

export const cmsApi = {
  list: () => api.get("/admin/cms"),
  getBySlug: (slug) => api.get(`/admin/cms/${slug}`),
  upsert: (payload) => api.post("/admin/cms", payload),
};

export const onboardingApi = {
  list: () => api.get("/admin/onboarding"),
  create: (formData) =>
    api.post("/admin/onboarding", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id, formData) =>
    api.put(`/admin/onboarding/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  remove: (id) => api.delete(`/admin/onboarding/${id}`),
};

export const faqsApi = {
  list: (params) => api.get(`/admin/faqs${buildQueryString(params)}`),
  create: (payload) => api.post("/admin/faqs", payload),
  update: (id, payload) => api.put(`/admin/faqs/${id}`, payload),
  remove: (id) => api.delete(`/admin/faqs/${id}`),
};

export const plansApi = {
  list: () => api.get("/admin/plans"),
  upsert: (payload) => api.post("/admin/plans", payload),
};

export const slidersApi = {
  list: (params) => api.get(`/admin/home-sliders${buildQueryString({ type: "all", ...params })}`),
  getById: (id) => api.get(`/admin/home-sliders/${id}`),
  create: (formData) =>
    api.post("/admin/home-sliders", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id, formData) =>
    api.put(`/admin/home-sliders/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  remove: (id) => api.delete(`/admin/home-sliders/${id}`),
};

export const formFieldsApi = {
  list: (params) => api.get(`/admin/forms/fields/all${buildQueryString(params)}`),
  create: (payload) => api.post("/admin/forms/fields", payload),
  update: (id, payload) => api.put(`/admin/forms/fields/${id}`, payload),
  remove: (id) => api.delete(`/admin/forms/fields/${id}`),
  reorder: (fields) => api.post("/admin/forms/fields/reorder", { fields }),
};

export const roleOptionsApi = {
  listAll: () => api.get("/admin/role-options/all"),
  create: (payload) => api.post("/admin/role-options", payload),
  update: (id, payload) => api.put(`/admin/role-options/${id}`, payload),
  remove: (id) => api.delete(`/admin/role-options/${id}`),
  reorder: (order) => api.patch("/admin/role-options/reorder", { order }),
};
