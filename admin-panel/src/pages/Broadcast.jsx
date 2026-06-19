import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Megaphone } from 'lucide-react';
import { API } from '../lib/api';

export default function Broadcast() {
  const [form, setForm] = useState({ title: '', body: '', targetRole: '' });
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (!form.title || !form.body) return toast.error('Title and message required');
    setBusy(true);
    try {
      await API.notifications.broadcast({ title: form.title, body: form.body, targetRole: form.targetRole || undefined });
      toast.success('Broadcast queued');
      setForm({ title: '', body: '', targetRole: '' });
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Broadcast Notification</h1>
      <div className="card max-w-lg space-y-4 p-6">
        <div className="flex items-center gap-3 rounded-xl bg-primary-light p-3 text-primary">
          <Megaphone size={20} /><span className="text-sm font-semibold">Sends a push to all users or a specific role.</span>
        </div>
        <div><label className="label">Title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div><label className="label">Message</label><textarea className="input min-h-[100px]" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
        <div>
          <label className="label">Target audience</label>
          <select className="input" value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })}>
            <option value="">All users</option>
            <option value="jobseeker">Job Seekers</option>
            <option value="employer">Employers</option>
            <option value="driver">Drivers</option>
          </select>
        </div>
        <button className="btn-primary w-full" disabled={busy} onClick={send}>{busy ? 'Sending...' : 'Send Broadcast'}</button>
      </div>
    </div>
  );
}
