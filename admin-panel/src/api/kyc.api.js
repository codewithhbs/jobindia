import { api } from "./client";
import { buildQueryString } from "@/lib/utils";

export const kycApi = {
  pending: (params) => api.get(`/kyc/pending${buildQueryString(params)}`),
  stats: () => api.get("/kyc/stats"),
  review: (userId, payload) => api.put(`/kyc/${userId}/review`, payload),
};
