import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { API } from '../lib/api';
import { useFetch } from './_useFetch';
import { Spinner, Table, Badge, Modal } from '../components/ui';

export default function Categories() {
  const { data: cats, loading, refetch } = useFetch(() => API.categories.list(), []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', icon: '', order: 0 });
  const [busy, setBusy] = useState(false);

  const start = (c) => {
    setEditing(c);
    setForm(c ? { name: c.name, icon: c.icon || '', order: c.order || 0 } : { name: '', icon: '', order: 0 });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name) return toast.error('Name required');
    setBusy(true);
    try {
      const body = { ...form, slug: form.name.toLowerCase().replace(/\s+/g, '-') };
      if (editing) await API.categories.update(editing._id, body);
      else await API.categories.create(body);
      toast.success('Saved'); setOpen(false); refetch();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Categories</h1>
        <button className="btn-primary" onClick={() => start(null)}><Plus size={18} /> Add</button>
      </div>
      {loading ? <Spinner /> : (
        <Table
          columns={['Icon', 'Name', 'Slug', 'Order', 'Action']}
          rows={cats || []}
          empty="No categories"
          renderRow={(c) => (
            <tr key={c._id}>
              <td className="td text-xl">{c.icon}</td>
              <td className="td font-semibold">{c.name}</td>
              <td className="td text-muted">{c.slug}</td>
              <td className="td">{c.order}</td>
              <td className="td"><button onClick={() => start(c)} className="btn-outline !py-1.5 !px-3 text-xs">Edit</button></td>
            </tr>
          )}
        />
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Category' : 'New Category'}
        footer={<button className="btn-primary" disabled={busy} onClick={save}>{busy ? 'Saving...' : 'Save'}</button>}>
        <div className="space-y-3">
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Icon (emoji)</label><input className="input" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🚗" /></div>
          <div><label className="label">Order</label><input type="number" className="input" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} /></div>
        </div>
      </Modal>
    </div>
  );
}
