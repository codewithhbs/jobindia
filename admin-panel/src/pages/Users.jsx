import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API } from '../lib/api';
import { useFetch } from './_useFetch';
import { Spinner, Table, Badge } from '../components/ui';

export default function Users() {
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const { data, loading, refetch } = useFetch(() => API.users.list({ role: role || undefined, search: q || undefined, limit: 50 }), [role, q]);

  const toggle = async (u) => {
    try { await API.users.setStatus(u._id, !u.isActive); toast.success('Updated'); refetch(); }
    catch (e) { toast.error(e.message); }
  };

  const users = data?.data || [];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Users</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-muted" size={16} />
            <input className="input pl-9" placeholder="Search name / phone" value={search}
              onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setQ(search)} />
          </div>
          <select className="input w-40" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All roles</option>
            <option value="jobseeker">Job Seeker</option>
            <option value="employer">Employer</option>
            <option value="driver">Driver</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <Table
          columns={['Name', 'Phone', 'Role', 'KYC', 'Status', 'Actions']}
          rows={users}
          empty="No users found"
          renderRow={(u) => (
            <tr key={u._id}>
              <td className="td font-semibold">{u.name || '—'}</td>
              <td className="td">{u.phone}</td>
              <td className="td capitalize">{u.role}</td>
              <td className="td"><Badge color={u.isKYCVerified ? 'success' : 'gray'}>{u.kycStatus || 'n/a'}</Badge></td>
              <td className="td"><Badge color={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Blocked'}</Badge></td>
              <td className="td">
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/users/${u._id}`)} className="btn-outline !py-1.5 !px-3 text-xs">Edit</button>
                  <button onClick={() => toggle(u)} className={u.isActive ? 'btn-danger !py-1.5 !px-3 text-xs' : 'btn-primary !py-1.5 !px-3 text-xs'}>
                    {u.isActive ? 'Block' : 'Activate'}
                  </button>
                </div>
              </td>
            </tr>
          )}
        />
      )}
    </div>
  );
}
