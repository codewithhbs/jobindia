import { api } from "./client";
import { buildQueryString } from "@/lib/utils";

export const jobsApi = {
  list: (params) => api.get(`/jobs${buildQueryString({ admin: true, ...params })}`),
  getFullById: (id) => api.get(`/jobs/full/${id}`),
  getById: (id) => api.get(`/jobs/${id}${buildQueryString({ admin: true })}`),
  pendingVerification: () => api.get("/jobs/pending-vericiation"),
  create: (payload) => api.post("/jobs", payload),
  update: (id, payload) => api.put(`/jobs/${id}`, payload),
  remove: (id) => api.delete(`/jobs/${id}`),
  applications: (id, params) => api.get(`/jobs/${id}/applications${buildQueryString(params)}`),
  exportApplicationsUrl: (id, status) =>
    `${api.defaults.baseURL}/jobs/${id}/applications/export${buildQueryString({ status })}`,
  updateApplicationStatus: (appId, payload) => api.put(`/jobs/applications/${appId}/status`, payload),
};
