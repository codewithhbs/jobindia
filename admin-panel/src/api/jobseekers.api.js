import { api } from "./client";
import { buildQueryString } from "@/lib/utils";

export const jobseekersApi = {
  search: (params) => api.get(`/jobseekers${buildQueryString(params)}`),
  getById: (id) => api.get(`/jobseekers/${id}`),
  fullUpdate: (userId, payload) => api.put(`/jobseekers/${userId}`, payload),
};
