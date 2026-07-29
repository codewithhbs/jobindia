import { api } from "./client";
import { buildQueryString } from "@/lib/utils";

export const employersApi = {
  list: (params) => api.get(`/employers${buildQueryString(params)}`),
  getById: (id) => api.get(`/employers/${id}`),
  verify: (id, status) => api.put(`/employers/${id}/verify`, { status }),
  update: (id, formData) =>
    api.put(`/employers/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};
