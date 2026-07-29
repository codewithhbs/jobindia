import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { CreditCard, Pencil } from 'lucide-react';
import { API } from '../lib/api';
import { useFetch } from './_useFetch';
import { Spinner, Badge, Modal } from '../components/ui';

export default function Plans() {
  const { data: plans, loading, refetch } = useFetch(() => API.plans.list(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  const start = (p) => {
    setForm({
      name: p.name, slug: p.slug, price: p.price, currency: p.currency || 'INR',
      duration: p.duration || 30, jobPostLimit: p.jobPostLimit || 3,
      isPopular: !!p.isPopular, isActive: p.isActive !== false, order: p.order || 0,
    });
    setOpen(true);
  };
  const save = async () => {
    setBusy(true);
    try { await API.plans.upsert(form); toast.success('Plan saved'); setOpen(false); refetch(); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  if (loading) return <Spinner />;
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Subscription Plans</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {(plans || []).map((p) => (
          <div key={p._id} className={`card p-6 ${p.isPopular ? 'ring-2 ring-accent' : ''}`}>
            <div className="mb-2 flex items-center justify-between">
              <CreditCard className="text-primary" size={22} />
              <div className="flex items-center gap-2">
                {p.isPopular && <Badge color="warning">Popular</Badge>}
                <button onClick={() => start(p)} className="text-muted hover:text-primary"><Pencil size={16} /></button>
              </div>
            </div>
            <h3 className="text-xl font-extrabold">{p.name}</h3>
            <p className="my-2 text-3xl font-black text-primary">{p.price === 0 ? 'Free' : `₹${p.price}`}
              {p.price > 0 && <span className="text-sm font-medium text-muted">/{p.duration}d</span>}</p>
            <ul className="space-y-1 text-sm text-muted">
              {(p.features || []).map((f, i) => <li key={i}>✓ {f.label}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit Plan"
        footer={<button className="btn-primary" disabled={busy} onClick={save}>{busy ? 'Saving...' : 'Save'}</button>}>
        {form && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="label">Slug</label><input className="input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="label">Price ₹</label><input type="number" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
              <div><label className="label">Days</label><input type="number" className="input" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} /></div>
              <div><label className="label">Job limit</label><input type="number" className="input" value={form.jobPostLimit} onChange={(e) => setForm({ ...form, jobPostLimit: Number(e.target.value) })} /></div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-primary" checked={form.isPopular} onChange={(e) => setForm({ ...form, isPopular: e.target.checked })} /> Popular</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-primary" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
