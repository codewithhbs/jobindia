import { api } from "./client";

export const authApi = {
  sendOtpAdmin: (phone) => api.post("/auth/send-otp-admin", { phone }),
  verifyOtpAdmin: (phone, otp) => api.post("/auth/verify-otp-admin", { phone, otp }),
  logout: (refreshToken) => api.post("/auth/logout", { refreshToken }),
  logoutAll: () => api.post("/auth/logout-all"),
  refreshToken: (refreshToken) => api.post("/auth/refresh-token", { refreshToken }),
};
