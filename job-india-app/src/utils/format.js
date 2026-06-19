import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

export const timeAgo = (date) => (date ? dayjs(date).fromNow() : '');
export const formatDate = (date, fmt = 'DD MMM YYYY') => (date ? dayjs(date).format(fmt) : '');

export const formatSalary = (salary) => {
  if (!salary) return 'Not disclosed';
  if (salary.isHidden) return 'Not disclosed';
  const { min, max, period = 'monthly' } = salary;
  const k = (n) => (n >= 1000 ? `₹${Math.round(n / 1000)}k` : `₹${n}`);
  const per = period === 'monthly' ? '/mo' : period === 'yearly' ? '/yr' : '';
  if (min && max) return `${k(min)} - ${k(max)}${per}`;
  if (min) return `${k(min)}+${per}`;
  return 'Negotiable';
};

export const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';

export const jobLocation = (loc) => {
  if (!loc) return '';
  if (loc.isRemote) return 'Remote';
  return [loc.city, loc.state].filter(Boolean).join(', ');
};
