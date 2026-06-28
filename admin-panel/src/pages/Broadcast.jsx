import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Megaphone, Users, Search, Send, X } from 'lucide-react';
import { API } from '../lib/api';

const ROLE_OPTIONS = [
  { value: '', label: 'All users' },
  { value: 'jobseeker', label: 'Job Seekers' },
  { value: 'employer', label: 'Employers' },
  { value: 'driver', label: 'Drivers' },
];

export default function Broadcast() {
  const [mode, setMode] = useState('role'); // 'role' | 'selected'
  const [form, setForm] = useState({ title: '', body: '', targetRole: '' });
  const [busy, setBusy] = useState(false);

  // ---- Selected-users mode state ----
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await API.users.listUsers({
        role: roleFilter || undefined,
        search: search || undefined,
      });
      setUsers(res?.data || []);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (mode !== 'selected') return;
    const t = setTimeout(fetchUsers, 350); // debounce search
    return () => clearTimeout(t);
  }, [mode, roleFilter, search]);

  const toggleUser = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (prev.size === users.length) return new Set();
      return new Set(users.map((u) => u._id));
    });
  };

  const selectedUsers = useMemo(
    () => users.filter((u) => selectedIds.has(u._id)),
    [users, selectedIds]
  );

  const removeSelected = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const send = async () => {
    if (!form.title || !form.body) return toast.error('Title and message required');

    if (mode === 'selected' && selectedIds.size === 0) {
      return toast.error('Select at least one user');
    }

    setBusy(true);
    try {
      if (mode === 'selected') {
        await API.notifications.broadcastSelected({
          userIds: Array.from(selectedIds),
          title: form.title,
          body: form.body,
        });
        toast.success(`Notification queued for ${selectedIds.size} user(s)`);
        setSelectedIds(new Set());
      } else {
        await API.notifications.broadcast({
          title: form.title,
          body: form.body,
          targetRole: form.targetRole || undefined,
        });
        toast.success('Broadcast queued');
      }
      setForm({ title: '', body: '', targetRole: '' });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Send Notification</h1>

      {/* ---- Mode tabs ---- */}
      <div className="flex border-b border-gray-200 max-w-2xl">
        <button
          onClick={() => setMode('role')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            mode === 'role' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Megaphone size={15} /> Broadcast
        </button>
        <button
          onClick={() => setMode('selected')}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            mode === 'selected' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users size={15} /> Select Users
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 max-w-5xl">
        {/* ---- Left: message form ---- */}
        <div className="card space-y-4 p-6 h-fit">
          {mode === 'role' ? (
            <div className="flex items-center gap-3 rounded-xl bg-primary-light p-3 text-primary">
              <Megaphone size={20} /><span className="text-sm font-semibold">Sends a push to all users or a specific role.</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl bg-primary-light p-3 text-primary">
              <Users size={20} /><span className="text-sm font-semibold">Sends a push only to the users you pick — any role mix.</span>
            </div>
          )}

          <div><label className="label">Title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">Message</label><textarea className="input min-h-[100px]" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>

          {mode === 'role' && (
            <div>
              <label className="label">Target audience</label>
              <select className="input" value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })}>
                {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          )}

          {mode === 'selected' && (
            <div className="text-sm text-gray-500">
              {selectedIds.size > 0
                ? <span className="font-semibold text-indigo-600">{selectedIds.size} user(s) selected</span>
                : 'No users selected yet — pick from the list on the right.'}
            </div>
          )}

          {mode === 'selected' && selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {selectedUsers.map((u) => (
                <span key={u._id} className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 pl-3 pr-1.5 py-1 text-xs font-medium text-gray-700">
                  {u.name || u.phone || u._id}
                  <button onClick={() => removeSelected(u._id)} className="rounded-full hover:bg-gray-200 p-0.5">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <button className="btn-primary w-full flex items-center justify-center gap-2" disabled={busy} onClick={send}>
            <Send size={16} /> {busy ? 'Sending...' : mode === 'selected' ? `Send to ${selectedIds.size || 0} user(s)` : 'Send Broadcast'}
          </button>
        </div>

        {/* ---- Right: user picker (only in 'selected' mode) ---- */}
        {mode === 'selected' && (
          <div className="card p-0 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="input pl-9"
                  placeholder="Search by name, phone, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <select className="input !py-1.5 text-sm" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <button onClick={toggleSelectAll} className="btn-outline !py-1.5 !px-3 text-xs whitespace-nowrap">
                  {selectedIds.size === users.length && users.length > 0 ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              <p className="text-xs text-gray-400">Only users with a registered device (push token) are shown.</p>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[480px]">
              {usersLoading ? (
                <div className="text-center text-gray-400 py-10 text-sm">Loading...</div>
              ) : users.length === 0 ? (
                <div className="text-center text-gray-400 py-10 text-sm">No users with push tokens found</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <label
                      key={u._id}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-indigo-600 shrink-0"
                        checked={selectedIds.has(u._id)}
                        onChange={() => toggleUser(u._id)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">{u.name || 'Unnamed'}</div>
                        <div className="text-xs text-gray-400 truncate">{u.phone || '—'}</div>
                      </div>
                      {u.role && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize shrink-0">
                          {u.role}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}