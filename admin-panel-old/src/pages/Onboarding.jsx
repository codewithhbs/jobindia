import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { API } from '../lib/api';
import { useFetch } from './_useFetch';
import { Spinner, Modal, EmptyState } from '../components/ui';

export default function Onboarding() {
  const { data, loading, refetch } = useFetch(() => API.onboarding.list(), []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', order: 0 });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const start = (s) => {
    setEditing(s);
    setForm(s ? { title: s.title, description: s.description, order: s.order || 0 } : { title: '', description: '', order: 0 });
    setFile(null);
    setOpen(true);
  };

  const save = async () => {
    if (!form.title) return toast.error('Title required');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('order', String(form.order));
      if (file) fd.append('onboardImage', file);
      if (editing) await API.onboarding.update(editing._id, fd);
      else await API.onboarding.create(fd);
      toast.success('Saved'); setOpen(false); refetch();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const remove = async (id) => { if (!confirm('Delete slide?')) return; try { await API.onboarding.remove(id); toast.success('Deleted'); refetch(); } catch (e) { toast.error(e.message); } };

  const screens = data || [];
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Onboarding Screens</h1>
        <button className="btn-primary" onClick={() => start(null)}><Plus size={18} /> Add Slide</button>
      </div>
      {loading ? <Spinner /> : screens.length === 0 ? <EmptyState title="No onboarding slides" /> : (
        <div className="grid gap-4 md:grid-cols-3">
          {screens.map((s) => (
            <div key={s._id} className="card overflow-hidden">
              {s.image ? <img src={s.image} alt={s.title} className="h-36 w-full object-cover" /> : <div className="grid h-36 place-items-center bg-bg text-muted">No image</div>}
              <div className="p-4">
                <p className="font-bold">{s.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{s.description}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => start(s)} className="btn-outline !py-1.5 !px-3 text-xs">Edit</button>
                  <button onClick={() => remove(s._id)} className="btn-danger !py-1.5 !px-2 text-xs"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Slide' : 'New Slide'}
        footer={<button className="btn-primary" disabled={busy} onClick={save}>{busy ? 'Saving...' : 'Save'}</button>}>
        <div className="space-y-3">
          <div><label className="label">Title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">Description</label><textarea className="input min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Order</label><input type="number" className="input" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} /></div>
            <div><label className="label">Image</label><input type="file" accept="image/*" className="input !py-2" onChange={(e) => setFile(e.target.files[0])} /></div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
