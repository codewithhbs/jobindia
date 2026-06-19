import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { API } from '../lib/api';
import { useFetch } from './_useFetch';
import JoditEditor from 'jodit-react';
import { Spinner, Modal, EmptyState, Badge } from '../components/ui';

export default function Cms() {
  const { data, loading, refetch } = useFetch(() => API.cms.list(), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ slug: '', title: '', content: '', isActive: true });
  const [busy, setBusy] = useState(false);

  const start = (p) => {
    setForm(p ? { slug: p.slug, title: p.title, content: p.content, isActive: p.isActive } : { slug: '', title: '', content: '', isActive: true });
    setOpen(true);
  };
  const save = async () => {
    if (!form.slug || !form.title) return toast.error('Slug & title required');
    setBusy(true);
    try { await API.cms.upsert(form); toast.success('Saved'); setOpen(false); refetch(); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  const pages = data || [];
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">CMS Pages</h1>
        <button className="btn-primary" onClick={() => start(null)}><Plus size={18} /> New Page</button>
      </div>
      {loading ? <Spinner /> : pages.length === 0 ? <EmptyState title="No CMS pages" /> : (
        <div className="space-y-3">
          {pages.map((p) => (
            <div key={p._id || p.slug} className="card flex items-center justify-between p-4">
              <div>
                <p className="font-bold">{p.title}</p>
                <p className="text-xs text-muted">/{p.slug}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge color={p.isActive ? 'success' : 'gray'}>{p.isActive ? 'Active' : 'Hidden'}</Badge>
                <button onClick={() => start(p)} className="btn-outline !py-1.5 !px-3 text-xs">Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="CMS Page"
        footer={<button className="btn-primary" disabled={busy} onClick={save}>{busy ? 'Saving...' : 'Save'}</button>}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Slug</label><input className="input" placeholder="about-us" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
            <div><label className="label">Title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          </div>
          <div>
            <label className="label">Content</label>
            <JoditEditor
              value={form.content}
              config={{ readonly: false, height: 320, toolbarButtonSize: 'small' }}
              onBlur={(html) => setForm((prev) => ({ ...prev, content: html }))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-primary" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
        </div>
      </Modal>
    </div>
  );
}
