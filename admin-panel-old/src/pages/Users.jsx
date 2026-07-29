import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { API } from '../lib/api';
import { useFetch } from './_useFetch';
import { Spinner, Table, Badge } from '../components/ui';

const ROLES = ['jobseeker', 'employer', 'driver', 'admin'];
const LIMIT = 10;

const placeholderUrl = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=random&size=64`;

const avatarUrl = (avatar, name) =>
  avatar ? `${import.meta.env.VITE_IMAGE_API_URL}${avatar}` : placeholderUrl(name);

export default function Users() {
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState(null);

  const { data, loading, refetch } = useFetch(
    () => API.users.list({ role: role || undefined, search: q || undefined, page, limit: LIMIT }),
    [role, q, page]
  );

  const runSearch = () => { setPage(1); setQ(search); };

  const toggle = async (u) => {
    try { await API.users.setStatus(u._id, !u.isActive); toast.success('Updated'); refetch(); }
    catch (e) { toast.error(e.message); }
  };

  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.name || u.phone}? This cannot be undone.`)) return;
    setDeleting(u._id);
    try { await API.users.delete(u._id); toast.success('Deleted'); refetch(); }
    catch (e) { toast.error(e.message); }
    finally { setDeleting(null); }
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
              className="input pl-9"
              placeholder="Search name / phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            />
          </div>
          <select
            className="input w-40"
            value={role}
            onChange={(e) => { setRole(e.target.value); setPage(1); }}
          >
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          <Table
            columns={['', 'Name', 'Phone', 'Role', 'KYC', 'Status', 'Action']}
            rows={users}
            empty="No users found"
            renderRow={(u) => (
              <tr key={u._id}>
                <td className="td">
                  <img
                    key={u._id}
                    src={avatarUrl(u.avatar, u.name)}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = placeholderUrl(u.name);
                    }}
                    alt={u.name || 'avatar'}
                    loading="lazy"
                    decoding="async"
                    className="w-9 h-9 rounded-full object-cover bg-gray-100"
                  />
                </td>
                <td className="td font-semibold">{u.name || '—'}</td>
                <td className="td">{u.phone}</td>
                <td className="td capitalize">{u.role}</td>
                <td className="td"><Badge color={u.isKYCVerified ? 'success' : 'gray'}>{u.kycStatus || 'n/a'}</Badge></td>
                <td className="td">
                  <button onClick={() => toggle(u)}>
                    <Badge color={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Blocked'}</Badge>
                  </button>
                </td>
                <td className="td">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/users/${u._id}`)}
                      className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1"
                    >
                      <Eye size={14} /> View
                    </button>
                    <button
                      onClick={() => remove(u)}
                      disabled={deleting === u._id}
                      className="btn-danger !py-1.5 !px-3 text-xs flex items-center gap-1 disabled:opacity-50"
                    >
                      <Trash2 size={14} /> {deleting === u._id ? '...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            )}
          />

          <div className="flex items-center justify-between text-sm text-muted">
            <span>
              Page {pagination.page} of {pagination.pages} · {pagination.total} users
            </span>
            <div className="flex gap-2">
              <button
                className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1 disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1 disabled:opacity-40"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}