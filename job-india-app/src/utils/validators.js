export const isValidPhone = (phone) => /^\+?[1-9]\d{9,14}$/.test(phone);

// Normalize a 10-digit Indian number to E.164 (+91...).
export const normalizePhone = (raw) => {
  const digits = (raw || '').replace(/[^\d]/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return raw.startsWith('+') ? raw : `+${digits}`;
};

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
