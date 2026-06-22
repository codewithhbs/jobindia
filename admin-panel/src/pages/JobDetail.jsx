import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Briefcase, Users, Eye, Bookmark, Calendar,
  Globe, Mail, Phone, Building2, BadgeCheck, ExternalLink, Award,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API } from '../lib/api';
import { useFetch } from './_useFetch';
import { Spinner, Badge } from '../components/ui';

const STATUS_VARIANT = {
  active: 'success', paused: 'warning', closed: 'danger', draft: 'gray',
};

const APPLICATION_STATUS_VARIANT = {
  applied: 'gray', shortlisted: 'info', rejected: 'danger',
  hired: 'success', withdrawn: 'gray',
};

function formatSalary(salary) {
  if (!salary) return '—';
  if (salary.isHidden) return 'Hidden';
  const { min, max, currency = 'INR', period = 'monthly' } = salary;
  const fmt = (n) => new Intl.NumberFormat('en-IN').format(n);
  const symbol = currency === 'INR' ? '₹' : currency + ' ';
  const range = min && max ? `${symbol}${fmt(min)} – ${symbol}${fmt(max)}` : symbol + fmt(min || max);
  return `${range} / ${period}`;
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function timeAgo(d) {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-gray-500" />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-bold leading-tight">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

function SectionCard({ title, children, action }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-gray-700">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('applications');

  const { data, loading, refetch } = useFetch(() => API.jobs.getFull(id), [id]);

  if (loading) return <Spinner />;
  if (!data) return <div className="text-center text-gray-400 py-10">Job not found</div>;

  const { job, employerProfile: ep = {}, applications = { total: 0, data: [] }, savedBy = { total: 0, data: [] } } = data;
  const logoUrl = ep.companyLogo ? `${API.BASE_URL || ''}${ep.companyLogo}` : null;

  const remove = async () => {
    if (!confirm('Delete this job?')) return;
    try {
      await API.jobs.remove(job._id);
      toast.success('Deleted');
      navigate('/jobs');
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* ---- Header ---- */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate('/jobs')} className="btn-outline !p-2 mt-1">
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold">{job.title}</h1>
              <Badge variant={STATUS_VARIANT[job.status] || 'gray'}>{job.status}</Badge>
              {job.isFeatured && <Badge variant="warning">Featured</Badge>}
            </div>
            <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <MapPin size={14} />
              {job.location?.city}, {job.location?.state}
              {job.location?.isRemote && <Badge variant="info">Remote</Badge>}
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => navigate(`/jobs/${job._id}/edit`)} className="btn-outline">Edit</button>
          <button onClick={remove} className="btn-danger">Delete</button>
        </div>
      </div>

      {/* ---- Stat strip ---- */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard icon={Eye} label="Views" value={job.views ?? 0} />
        <StatCard icon={Users} label="Applications" value={applications.total ?? job.applications ?? 0} />
        <StatCard icon={Award} label="Shortlisted" value={job.shortlisted ?? 0} />
        <StatCard icon={Bookmark} label="Saved" value={savedBy.total ?? 0} />
        <StatCard icon={Briefcase} label="Vacancies" value={job.vacancies ?? '—'} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* ---- Left: job + company ---- */}
        <div className="lg:col-span-2 space-y-5">
          <SectionCard title="Job description">
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{job.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 pt-4 border-t border-gray-100">
              <div>
                <div className="text-xs text-gray-400">Category</div>
                <div className="font-medium">{job.category || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Job type</div>
                <div className="font-medium capitalize">{job.jobType?.replace('_', ' ') || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Salary</div>
                <div className="font-medium">{formatSalary(job.salary)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Experience</div>
                <div className="font-medium">
                  {job.requirements?.experience?.min ?? 0}+ {job.requirements?.experience?.unit || 'years'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Published</div>
                <div className="font-medium">{formatDate(job.publishedAt)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Gender</div>
                <div className="font-medium capitalize">{job.requirements?.gender || 'Any'}</div>
              </div>
            </div>

            {job.requirements?.skills?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-400 mb-2">Skills required</div>
                <div className="flex gap-2 flex-wrap">
                  {job.requirements.skills.map((s) => (
                    <span key={s} className="px-2.5 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-600">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {job.benefits?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-400 mb-2">Benefits</div>
                <div className="flex gap-2 flex-wrap">
                  {job.benefits.map((b) => (
                    <span key={b} className="px-2.5 py-1 rounded-full bg-green-50 text-xs font-medium text-green-700">{b}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
              <MapPin size={14} className="inline mr-1" />
              {job.location?.address}
            </div>
          </SectionCard>

          {/* ---- Tabs: applications / saved by ---- */}
          <div className="card p-0 overflow-hidden">
            <div className="flex border-b border-gray-100">
              {[
                { key: 'applications', label: `Applications (${applications.total ?? 0})` },
                { key: 'saved', label: `Saved by (${savedBy.total ?? 0})` },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                    tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-4">
              {tab === 'applications' && (
                applications.data?.length ? (
                  <div className="divide-y divide-gray-100">
                    {applications.data.map((app) => (
                      <div key={app._id} className="py-3 flex items-center gap-3">
                        <img
                          src={app.applicant?.avatar ? `${API.BASE_URL || ''}${app.applicant.avatar}` : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(app.applicant?.name || '?')}
                          alt={app.applicant?.name}
                          className="h-10 w-10 rounded-full object-cover border border-gray-200 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{app.applicant?.name || 'Unnamed'}</span>
                            {app.applicant?.isKYCVerified && <BadgeCheck size={14} className="text-green-600 shrink-0" />}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {app.applicant?.phone} · {app.applicant?.location?.city || '—'}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 shrink-0">{timeAgo(app.appliedAt)}</div>
                        <Badge variant={APPLICATION_STATUS_VARIANT[app.status] || 'gray'}>{app.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8 text-sm">No applications yet</div>
                )
              )}

              {tab === 'saved' && (
                savedBy.data?.length ? (
                  <div className="divide-y divide-gray-100">
                    {savedBy.data.map((s) => (
                      <div key={s._id} className="py-3 flex items-center gap-3">
                        <div className="font-medium">{s.name || s.phone || s._id}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8 text-sm">No one has saved this job yet</div>
                )
              )}
            </div>
          </div>
        </div>

        {/* ---- Right: company card ---- */}
        <div className="space-y-5">
          <SectionCard title="Company">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt={ep.companyName} className="h-14 w-14 rounded-xl object-cover border border-gray-200" />
              ) : (
                <div className="h-14 w-14 rounded-xl bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-400">
                  {(ep.companyName || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="font-semibold truncate flex items-center gap-1">
                  {ep.companyName || '—'}
                  {ep.verificationStatus === 'approved' && <BadgeCheck size={14} className="text-green-600" />}
                </div>
                <div className="text-xs text-gray-400 truncate">{ep.industry || '—'} · {ep.companySize || '—'} employees</div>
              </div>
            </div>

            {ep.description && (
              <p className="text-sm text-gray-600 mt-4 leading-relaxed">{ep.description}</p>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2.5 text-sm">
              {ep.website && (
                <a href={ep.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-indigo-600 hover:underline">
                  <Globe size={14} /> {ep.website} <ExternalLink size={12} />
                </a>
              )}
              {ep.foundedYear && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={14} className="text-gray-400" /> Founded {ep.foundedYear}
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={14} className="text-gray-400" />
                {[ep.address?.street, ep.address?.city, ep.address?.state, ep.address?.pincode].filter(Boolean).join(', ') || '—'}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-gray-400">Plan</div>
                <div className="font-medium capitalize">{ep.subscriptionPlan || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Jobs posted</div>
                <div className="font-medium">{ep.totalJobsPosted ?? 0} ({ep.activeJobs ?? 0} active)</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">GST</div>
                <div className="font-medium truncate">{ep.gstNumber || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">PAN</div>
                <div className="font-medium truncate">{ep.panNumber || '—'}</div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Contact person">
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-gray-400" />
                <span className="font-medium">{ep.contactPerson?.name || '—'}</span>
                {ep.contactPerson?.designation && <span className="text-gray-400">· {ep.contactPerson.designation}</span>}
              </div>
              {ep.contactPerson?.email && (
                <a href={`mailto:${ep.contactPerson.email}`} className="flex items-center gap-2 text-indigo-600 hover:underline">
                  <Mail size={14} /> {ep.contactPerson.email}
                </a>
              )}
              {ep.contactPerson?.phone && (
                <a href={`tel:${ep.contactPerson.phone}`} className="flex items-center gap-2 text-indigo-600 hover:underline">
                  <Phone size={14} /> {ep.contactPerson.phone}
                </a>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}