import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Search, Filter, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API } from '../lib/api';
import { useFetch } from './_useFetch';
import { Spinner, Table, Badge } from '../components/ui';

const KYC_STATUSES = ['not_submitted', 'pending', 'under_review', 'approved', 'rejected'];

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const initialFilters = {
  role: '',
  search: '',
  kycStatus: '',
  isActive: '',
  isEmailVerified: '',
  isPhoneVerified: '',
  isKYCVerified: '',
  startDate: '',
  endDate: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export default function Users() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(initialFilters);
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const setF = (k) => (v) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setSearchInput('');
    setPage(1);
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => v && !['sortBy', 'sortOrder'].includes(k)
  ).length;

  const { data, loading, refetch } = useFetch(
    () =>
      API.users.list({
        page,
        limit: 20,
        role: filters.role || undefined,
        search: filters.search || undefined,
        kycStatus: filters.kycStatus || undefined,
        isActive: filters.isActive || undefined,
        isEmailVerified: filters.isEmailVerified || undefined,
        isPhoneVerified: filters.isPhoneVerified || undefined,
        isKYCVerified: filters.isKYCVerified || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      }),
    [page, filters]
  );

  const toggle = async (u) => {
    try {
      await API.users.setStatus(u._id, !u.isActive);
      toast.success('Updated');
      refetch();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const users = data?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, pages: 1 };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Users</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-muted" size={16} />
            <input
              className="input pl-9 w-64"
              placeholder="Search name / phone / email"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setF('search')(searchInput)}
            />
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`btn-outline relative ${activeFilterCount > 0 ? '!border-primary !text-primary' : ''}`}
          >
            <Filter size={16} /> Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ===== Filter panel ===== */}
      {showFilters && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-muted uppercase tracking-wide">Filters</h2>
            <button onClick={clearFilters} className="text-xs text-danger flex items-center gap-1 hover:underline">
              <X size={14} /> Clear all
            </button>
          </div>

          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <div>
              <label className="label">Role</label>
              <select className="input" value={filters.role} onChange={(e) => setF('role')(e.target.value)}>
                <option value="">All roles</option>
                <option value="jobseeker">Job Seeker</option>
                <option value="employer">Employer</option>
                <option value="driver">Driver</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>

            <div>
              <label className="label">KYC Status</label>
              <select className="input" value={filters.kycStatus} onChange={(e) => setF('kycStatus')(e.target.value)}>
                <option value="">Any</option>
                {KYC_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Account Status</label>
              <select className="input" value={filters.isActive} onChange={(e) => setF('isActive')(e.target.value)}>
                <option value="">Any</option>
                <option value="true">Active</option>
                <option value="false">Blocked</option>
              </select>
            </div>

            <div>
              <label className="label">KYC Verified</label>
              <select className="input" value={filters.isKYCVerified} onChange={(e) => setF('isKYCVerified')(e.target.value)}>
                <option value="">Any</option>
                <option value="true">Verified</option>
                <option value="false">Not Verified</option>
              </select>
            </div>

            <div>
              <label className="label">Email Verified</label>
              <select className="input" value={filters.isEmailVerified} onChange={(e) => setF('isEmailVerified')(e.target.value)}>
                <option value="">Any</option>
                <option value="true">Verified</option>
                <option value="false">Not Verified</option>
              </select>
            </div>

            <div>
              <label className="label">Phone Verified</label>
              <select className="input" value={filters.isPhoneVerified} onChange={(e) => setF('isPhoneVerified')(e.target.value)}>
                <option value="">Any</option>
                <option value="true">Verified</option>
                <option value="false">Not Verified</option>
              </select>
            </div>

            <div>
              <label className="label">From Date</label>
              <input type="date" className="input" value={filters.startDate} onChange={(e) => setF('startDate')(e.target.value)} />
            </div>

            <div>
              <label className="label">To Date</label>
              <input type="date" className="input" value={filters.endDate} onChange={(e) => setF('endDate')(e.target.value)} />
            </div>

            <div>
              <label className="label">Sort By</label>
              <select className="input" value={filters.sortBy} onChange={(e) => setF('sortBy')(e.target.value)}>
                <option value="createdAt">Created Date</option>
                <option value="lastSeen">Last Seen</option>
                <option value="name">Name</option>
              </select>
            </div>

            <div>
              <label className="label">Sort Order</label>
              <select className="input" value={filters.sortOrder} onChange={(e) => setF('sortOrder')(e.target.value)}>
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ===== Table ===== */}
      {loading ? (
        <Spinner />
      ) : (
        <>
          <Table
            columns={['User', 'Contact', 'Location', 'Role', 'KYC', 'Status', 'Joined', 'Actions']}
            rows={users}
            empty="No users found"
            renderRow={(u) => (
              <tr key={u._id}>
                <td className="td">
                  <div className="flex items-center gap-3">
                    {u.avatar ? (
                      <img
                        src={`https://jobapi.adsdigitalmedia.com${u.avatar}`}
                        alt={u.name}
                        className="h-9 w-9 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-bg flex items-center justify-center text-sm font-bold text-muted">
                        {(u.name || '?')[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="font-semibold">{u.name || '—'}</span>
                  </div>
                </td>
                <td className="td">
                  <p className="text-sm">{u.phone}</p>
                  <p className="text-xs text-muted">{u.email || '—'}</p>
                </td>
                <td className="td text-sm">
                  {u.location?.city ? `${u.location.city}${u.location.state ? `, ${u.location.state}` : ''}` : '—'}
                </td>
                <td className="td capitalize">{u.role}</td>
                <td className="td">
                  <Badge color={u.isKYCVerified ? 'success' : 'gray'}>{u.kycStatus?.replace('_', ' ') || 'n/a'}</Badge>
                </td>
                <td className="td"><Badge color={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Blocked'}</Badge></td>
                <td className="td text-sm text-muted">{fmtDate(u.createdAt)}</td>
                <td className="td">
                  <div className="flex gap-2">
                    <button onClick={() => navigate(u.role === 'jobseeker' ? `/users/jobseeker/${u._id}` : `/users/${u._id}`)} className="btn-outline !py-1.5 !px-3 text-xs">Edit</button>
                    <button onClick={() => toggle(u)} className={u.isActive ? 'btn-danger !py-1.5 !px-3 text-xs' : 'btn-primary !py-1.5 !px-3 text-xs'}>
                      {u.isActive ? 'Block' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            )}
          />

          {/* ===== Pagination ===== */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <p className="text-muted">
                Page {pagination.page} of {pagination.pages} • {pagination.total} users
              </p>
              <div className="flex gap-2">
                <button
                  className="btn-outline !py-1.5 !px-3 text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                <button
                  className="btn-outline !py-1.5 !px-3 text-xs"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}