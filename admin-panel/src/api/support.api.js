import { api } from "./client";
import { buildQueryString } from "@/lib/utils";

export const supportApi = {
  listAll: (params) => api.get(`/support${buildQueryString(params)}`),
  getById: (id) => api.get(`/support/${id}`),
  adminReply: (id, message) => api.post(`/support/${id}/admin-reply`, { message }),
  updateStatus: (id, status) => api.patch(`/support/${id}/status`, { status }),
};
