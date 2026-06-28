const mongoose = require('mongoose');

// ── Lightweight audit log for ANY field change on a job ──
// Separate collection so Job doc doesn't bloat with every edit's diff.
const jobAuditLogSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  changedByRole: { type: String },
  changes: { type: mongoose.Schema.Types.Mixed, required: true }, // { field: { from, to } }
  createdAt: { type: Date, default: Date.now, index: true },
});

const JobAuditLog = mongoose.model('JobAuditLog', jobAuditLogSchema);

module.exports = JobAuditLog;