import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API } from '../lib/api';
import { useFetch } from './_useFetch';
import { Spinner } from '../components/ui';

const ROLES = ['jobseeker', 'employer', 'driver', 'admin', 'superadmin'];

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading } = useFetch(() => API.users.list({ search: '', limit: 1 }).then(() => null), []);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  // load the single user via the public getUser endpoint
  useEffect(() => {
    (async () => {
      try {
        const u = await API.users.list({ limit: 200 }).then((r) => (r.data || []).find((x) => x._id === id));
        if (u) setForm({ name: u.name || '', email: u.email || '', role: u.role, isActive: u.isActive, kycStatus: u.kycStatus || 'not_submitted', phone: u.phone });
      } catch (e) { toast.error(e.message); }
    })();
  }, [id]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const save = async () => {
    setBusy(true);
    try {
      await API.manage.updateUser(id, { name: form.name, email: form.email, role: form.role, isActive: form.isActive, kycStatus: form.kycStatus });
      toast.success('User updated'); navigate('/users');
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  if (loading || !form) return <Spinner />;
  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-extrabold">Edit User</h1>
      <div className="card space-y-4 p-6">
        <div><label className="label">Phone</label><input className="input bg-bg" value={form.phone} disabled /></div>
        <div className="grid gap-4 md:grid-cols-2">
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => set('name')(e.target.value)} /></div>
          <div><label className="label">Email</label><input className="input" value={form.email} onChange={(e) => set('email')(e.target.value)} /></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={(e) => set('role')(e.target.value)}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="label">KYC Status</label>
            <select className="input" value={form.kycStatus} onChange={(e) => set('kycStatus')(e.target.value)}>
              {['not_submitted', 'pending', 'under_review', 'approved', 'rejected'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-primary" checked={form.isActive} onChange={(e) => set('isActive')(e.target.checked)} /> Active account</label>
        <div className="flex gap-2">
          <button className="btn-primary" disabled={busy} onClick={save}>{busy ? 'Saving...' : 'Save'}</button>
          <button className="btn-ghost" onClick={() => navigate('/users')}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
