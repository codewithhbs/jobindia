import client, { unwrap } from './client';

export const driverApi = {
  me: () => unwrap(client.get('/drivers/me')),
  update: (formData) =>
    unwrap(client.put('/drivers/me', formData, { headers: { 'Content-Type': 'multipart/form-data' } })),
  setAvailability: (isAvailable) => unwrap(client.put('/drivers/me/availability', { isAvailable })),
};
