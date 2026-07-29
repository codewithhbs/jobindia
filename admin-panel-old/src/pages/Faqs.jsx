import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { API } from '../lib/api';
import { useFetch } from './_useFetch';
import { Spinner, Modal, EmptyState } from '../components/ui';

export default function Faqs() {
  const { data, loading, refetch } = useFetch(() => API.faqs.list(), []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ question: '', answer: '', category: 'general', order: 0 });
  const [busy, setBusy] = useState(false);

  const start = (f) => {
    setEditing(f);
    setForm(f ? { question: f.question, answer: f.answer, category: f.category || 'general', order: f.order || 0 } : { question: '', answer: '', category: 'general', order: 0 });
    setOpen(true);
  };
  const save = async () => {
    if (!form.question || !form.answer) return toast.error('Question & answer required');
    setBusy(true);
    try {
      if (editing) await API.faqs.update(editing._id, form);
      else await API.faqs.create(form);
      toast.success('Saved'); setOpen(false); refetch();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const remove = async (id) => { if (!confirm('Delete FAQ?')) return; try { await API.faqs.remove(id); toast.success('Deleted'); refetch(); } catch (e) { toast.error(e.message); } };

  const faqs = data || [];
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">FAQs</h1>
        <button className="btn-primary" onClick={() => start(null)}><Plus size={18} /> Add FAQ</button>
      </div>
      {loading ? <Spinner /> : faqs.length === 0 ? <EmptyState title="No FAQs yet" /> : (
        <div className="space-y-3">
          {faqs.map((f) => (
            <div key={f._id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{f.question}</p>
                  <p className="mt-1 text-sm text-muted">{f.answer}</p>
                  <span className="mt-2 inline-block text-xs text-primary">#{f.category}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => start(f)} className="btn-outline !py-1.5 !px-3 text-xs">Edit</button>
                  <button onClick={() => remove(f._id)} className="btn-danger !py-1.5 !px-2 text-xs"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit FAQ' : 'New FAQ'}
        footer={<button className="btn-primary" disabled={busy} onClick={save}>{busy ? 'Saving...' : 'Save'}</button>}>
        <div className="space-y-3">
          <div><label className="label">Question</label><input className="input" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} /></div>
          <div><label className="label">Answer</label><textarea className="input min-h-[90px]" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Category</label><input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            <div><label className="label">Order</label><input type="number" className="input" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} /></div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
