import client, { unwrap } from './client';

export const authApi = {
  sendOtp: (phone, purpose = 'login') => unwrap(client.post('/auth/send-otp', { phone, purpose })),
  verifyOtp: (payload) => unwrap(client.post('/auth/verify-otp', payload)),
  sendAdminOtp: (phone) => unwrap(client.post('/auth/send-otp-admin', { phone })),
  verifyAdminOtp: (payload) => unwrap(client.post('/auth/verify-otp-admin', payload)),
  logout: (refreshToken) => client.post('/auth/logout', { refreshToken }),
  logoutAll: () => client.post('/auth/logout-all'),
};
