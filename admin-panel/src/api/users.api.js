import { api } from "./client";
import { buildQueryString } from "@/lib/utils";

export const usersApi = {
  list: (params) => api.get(`/users${buildQueryString(params)}`),
  stats: () => api.get("/users/stats/overview"),
  getById: (id) => api.get(`/users/${id}`),
  updateStatus: (id, isActive) => api.put(`/users/${id}/status`, { isActive }),
  updateProfile: (id, formData) =>
    api.put(`/users/manage/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  withFcmToken: (params) => api.get(`/users/with-fcm-token${buildQueryString(params)}`),
  nearby: (params) => api.get(`/users/nearby/search${buildQueryString(params)}`),
};
