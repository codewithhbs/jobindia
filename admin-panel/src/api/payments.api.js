import { api } from "./client";

export const paymentsApi = {
  myPayments: () => api.get("/payments/me"),
};
