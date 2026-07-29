import { api } from "./client";
import { buildQueryString } from "@/lib/utils";

export const driversApi = {
  list: (params) => api.get(`/drivers${buildQueryString(params)}`),
  getById: (id) => api.get(`/drivers/${id}`),
  update: (id, formData) =>
    api.put(`/drivers/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};
