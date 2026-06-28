import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, X, ChevronLeft, ChevronRight, Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { API } from '../lib/api';
import { useFetch } from './_useFetch';
import { Spinner, Table, Badge } from '../components/ui';

const PAGE_SIZE = 20;
const JOB_TYPES = ['full_time', 'part_time', 'contract', 'freelance', 'internship'];
const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Newest first' },
  { value: 'salary', label: 'Highest salary' },
  { value: 'relevance', label: 'Relevance (needs search)' },
];

// Full status enum from schema — dropdown must cover all of these
const JOB_STATUSES = ['draft', 'active', 'paused', 'closed', 'expired', 'verified', 'rejected'];

const DEFAULT_FILTERS = {
  search: '', category: '', jobType: '', city: '', state: '',
  isRemote: '', salaryMin: '', salaryMax: '', sortBy: 'createdAt',
};

const DEFAULT_EXPIRY_DAYS = 7;

// ── Days until expiry, with createdAt+7d fallback when expiryDate missing ──
function getExpiryInfo(job) {
  let expiryDate = job.expiryDate;
  let isFallback = false;

  if (!expiryDate) {
    const base = new Date(job.createdAt || job.publishedAt || Date.now());
    base.setDate(base.getDate() + DEFAULT_EXPIRY_DAYS);
    expiryDate = base;
    isFallback = true;
  } else {
    expiryDate = new Date(expiryDate);
  }

  const target = new Date(expiryDate);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((target - today) / 86400000);

  return { date: expiryDate, days, isFallback };
}

function ExpiryCell({ job }) {
  const { date, days, isFallback } = getExpiryInfo(job);
  const dateLabel = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  let variant = 'success';
  let text = `${days}d left`;
  if (days < 0) { variant = 'danger'; text = `Expired ${Math.abs(days)}d ago`; }
  else if (days === 0) { variant = 'danger'; text = 'Expires today'; }
  else if (days <= 3) { variant = 'warning'; text = `${days}d left`; }

  return (
    <div>
      <Badge variant={variant}>
        {days <= 3 && <AlertTriangle size={11} className="inline mr-1 -mt-0.5" />}
        {text}
      </Badge>
      <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
        <Clock size={11} /> {dateLabel}
        {isFallback && <span className="text-gray-300">(default 7d)</span>}
      </div>
    </div>
  );
}

export default function Jobs() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');

  // Debounce the search box -> filters.search, resetting to page 1.
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput }));
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    API.categories.list().then(setCategories).catch(() => { });
  }, []);

  const updateFilter = (key) => (value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchInput('');
    setPage(1);
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([k, v]) => v && !(k === 'sortBy' && v === 'createdAt')
  );

  const { data, loading, refetch } = useFetch(
    () =>
      API.jobs.list({
        page,
        limit: PAGE_SIZE,
        admin: true,
        search: filters.search || undefined,
        category: filters.category || undefined,
        jobType: filters.jobType || undefined,
        city: filters.city || undefined,
        state: filters.state || undefined,
        isRemote: filters.isRemote || undefined,
        salaryMin: filters.salaryMin || undefined,
        salaryMax: filters.salaryMax || undefined,
        sortBy: filters.sortBy,
      }),
    [page, filters]
  );
  const updateJobField = async (id, updates) => {
    try {
      const row = rows.find(x => x._id === id);

      await API.manage.updateJob(id, {
        status: updates.status ?? row.status,
        isFeatured: updates.isFeatured ?? row.isFeatured,
      });

      toast.success('Updated');
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };
  const remove = async (id) => {
    if (!confirm('Delete this job?')) return;
    try { await API.jobs.remove(id); toast.success('Deleted'); refetch(); } catch (e) { toast.error(e.message); }
  };

  const rows = data?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, pages: 1 };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Jobs</h1>
        <button className="btn-primary" onClick={() => navigate('/jobs/new')}><Plus size={18} /> Create Job</button>
      </div>

      {/* ---- Filters bar ---- */}
      <div className="card space-y-3 p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search by title, skills, description..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <select className="input" value={filters.category} onChange={(e) => updateFilter('category')(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => {
              const v = c.name || c;
              return <option key={c._id || v} value={v}>{v}</option>;
            })}
          </select>

          <select className="input" value={filters.jobType} onChange={(e) => updateFilter('jobType')(e.target.value)}>
            <option value="">All job types</option>
            {JOB_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </select>

          <input className="input" placeholder="City" value={filters.city} onChange={(e) => updateFilter('city')(e.target.value)} />
          <input className="input" placeholder="State" value={filters.state} onChange={(e) => updateFilter('state')(e.target.value)} />

          <select className="input" value={filters.isRemote} onChange={(e) => updateFilter('isRemote')(e.target.value)}>
            <option value="">Remote & on-site</option>
            <option value="true">Remote only</option>
          </select>

          <select className="input" value={filters.sortBy} onChange={(e) => updateFilter('sortBy')(e.target.value)}>
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <input
            type="number" className="input" placeholder="Salary min ₹/mo"
            value={filters.salaryMin} onChange={(e) => updateFilter('salaryMin')(e.target.value)}
          />
          <input
            type="number" className="input" placeholder="Salary max ₹/mo"
            value={filters.salaryMax} onChange={(e) => updateFilter('salaryMax')(e.target.value)}
          />
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn-ghost flex items-center gap-1 justify-self-start">
              <X size={14} /> Clear filters
            </button>
          )}
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          <Table
            columns={['Job', 'Company', 'Category', 'Expiry', 'Featured', 'Status', 'Actions']}
            rows={rows}
            empty="No jobs found"
            renderRow={(j) => {
              const ep = j.employerProfile || {};
              const emp = j.employer || {};
              const logoUrl = ep.companyLogo
                ? `${API.BASE_URL || ''}${ep.companyLogo}`
                : null;

              return (
                <tr key={j._id}>
                  <td className="td">
                    <div className="font-semibold">{j.title}</div>
                    <div className="text-xs text-gray-400">{j.location?.city}, {j.location?.state}</div>
                  </td>

                  <td className="td">
                    <div className="flex items-center gap-3">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={ep.companyName}
                          className="h-9 w-9 rounded-lg object-cover border border-gray-200 shrink-0"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">
                          {(ep.companyName || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium truncate max-w-[160px]">
                          {ep.companyName || '—'}
                        </div>
                        <div className="text-xs text-gray-400 truncate max-w-[160px]">
                          {ep.industry || '—'} · {ep.companySize || '—'}
                        </div>
                        {ep.contactPerson?.name && (
                          <div className="text-xs text-gray-400 truncate max-w-[160px]">
                            {ep.contactPerson.name} ({ep.contactPerson.designation || 'Contact'})
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="td">{j.category || '—'}</td>

                  <td className="td">
                    <ExpiryCell job={j} />
                  </td>

                  <td className="td">
                    <input
                      type="checkbox"
                      checked={j.isFeatured}
                      onChange={(e) =>
                        updateJobField(j._id, { isFeatured: e.target.checked })
                      }
                    />
                  </td>

                  <td className="td">
                    <select
                      className="input !py-1"
                      value={j.status}
                      onChange={(e) => updateJobField(j._id, { status: e.target.value })}
                    >
                      {JOB_STATUSES.map((s) => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </td>

                  <td className="td">
                    <div className="flex gap-2">
                      <button onClick={() => navigate(`/jobs/${j._id}/view`)} className="btn-outline !py-1.5 !px-3 text-xs">View</button>

                      <button onClick={() => navigate(`/jobs/${j._id}/edit`)} className="btn-outline !py-1.5 !px-3 text-xs">Edit</button>
                      <button onClick={() => remove(j._id)} className="btn-danger !py-1.5 !px-3 text-xs">Delete</button>
                    </div>
                  </td>
                </tr>
              );
            }}
          />

          {/* ---- Pagination ---- */}
          {pagination.total > 0 && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                Showing {(pagination.page - 1) * PAGE_SIZE + 1}–{Math.min(pagination.page * PAGE_SIZE, pagination.total)} of {pagination.total} jobs
              </span>
              <div className="flex items-center gap-2">
                <button
                  className="btn-outline !py-1.5 !px-3 text-xs flex items-center gap-1 disabled:opacity-40"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <span className="px-2">Page {pagination.page} of {pagination.pages || 1}</span>
                <button
                  className="btn-outline !py-1.5 !px-3 text-xs flex items-center gap-1 disabled:opacity-40"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}