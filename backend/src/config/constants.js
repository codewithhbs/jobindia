// Central place for role + status enums so every module stays consistent.
const ROLES = {
  JOBSEEKER: 'jobseeker',
  EMPLOYER: 'employer',
  DRIVER: 'driver',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
};

const ALL_ROLES = Object.values(ROLES);
const ADMIN_ROLES = [ROLES.ADMIN, ROLES.SUPERADMIN];

const KYC_STATUS = {
  NOT_SUBMITTED: 'not_submitted',
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

module.exports = { ROLES, ALL_ROLES, ADMIN_ROLES, KYC_STATUS };
