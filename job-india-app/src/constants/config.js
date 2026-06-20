import Constants from 'expo-constants';

// API base URL. Defaults are emulator-friendly:
//  - Android emulator -> 10.0.2.2 maps to host machine localhost
//  - iOS simulator    -> localhost works
// Override via app.json -> expo.extra.apiUrl, or set EXPO_PUBLIC_API_URL.
export const API_URL =
  'http://192.168.1.18:4000/api/v1';

export const ROLES = {
  JOBSEEKER: 'jobseeker',
  EMPLOYER: 'employer',
  DRIVER: 'driver',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
};

export const JOB_TYPES = [
  { label: 'Full Time', value: 'full_time' },
  { label: 'Part Time', value: 'part_time' },
  { label: 'Contract', value: 'contract' },
  { label: 'Freelance', value: 'freelance' },
  { label: 'Internship', value: 'internship' },
];

export const APPLICATION_STATUS = {
  applied: { label: 'Applied', color: '#4F6EF7' },
  viewed: { label: 'Viewed', color: '#6B6B85' },
  shortlisted: { label: 'Shortlisted', color: '#0EA5A0' },
  interview_scheduled: { label: 'Interview', color: '#F59E0B' },
  offered: { label: 'Offered', color: '#22C55E' },
  hired: { label: 'Hired', color: '#22C55E' },
  rejected: { label: 'Rejected', color: '#F43F5E' },
  withdrawn: { label: 'Withdrawn', color: '#9898B0' },
};

export const EDUCATION_LEVELS = [
  { label: '10th', value: '10th' },
  { label: '12th', value: '12th' },
  { label: 'Diploma', value: 'diploma' },
  { label: 'ITI', value: 'iti' },
  { label: 'Graduate', value: 'graduate' },
  { label: 'Post Graduate', value: 'post_graduate' },
  { label: 'Doctorate', value: 'doctorate' },
  { label: 'Other', value: 'other' },
];