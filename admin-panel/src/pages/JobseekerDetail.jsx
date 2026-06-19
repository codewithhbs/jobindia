import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API } from '../lib/api';
import { Spinner } from '../components/ui';

export default function JobseekerDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [meta, setMeta] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const j = await API.manage.getJobseeker(userId);
        setMeta(j.userId);
        setForm({
          headline: j.headline || '', about: j.about || '',
          skills: (j.skills || []).join(', '),
          totalExperienceMonths: j.totalExperienceMonths || 0,
          expMin: j.expectedSalary?.min || '', expMax: j.expectedSalary?.max || '',
          availability: j.availability || 'immediate', isOpenToWork: j.isOpenToWork ?? true,
          willingToRelocate: j.willingToRelocate || false,
        });
      } catch (e) { toast.error(e.message); }
    })();
  }, [userId]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const save = async () => {
    setBusy(true);
    try {
      await API.manage.updateJobseeker(userId, {
        headline: form.headline, about: form.about,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        totalExperienceMonths: Number(form.totalExperienceMonths) || 0,
        expectedSalary: { min: Number(form.expMin) || undefined, max: Number(form.expMax) || undefined },
        availability: form.availability, isOpenToWork: form.isOpenToWork, willingToRelocate: form.willingToRelocate,
      });
      toast.success('Jobseeker updated'); navigate('/candidates');
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  if (!form) return <Spinner />;
  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-extrabold">Edit Jobseeker</h1>
      {meta && <p className="text-sm text-muted">{meta.name} · {meta.phone}</p>}
      <div className="card space-y-4 p-6">
        <div><label className="label">Headline</label><input className="input" value={form.headline} onChange={(e) => set('headline')(e.target.value)} /></div>
        <div><label className="label">About</label><textarea className="input min-h-[90px]" value={form.about} onChange={(e) => set('about')(e.target.value)} /></div>
        <div><label className="label">Skills (comma separated)</label><input className="input" value={form.skills} onChange={(e) => set('skills')(e.target.value)} /></div>
        <div className="grid gap-4 md:grid-cols-3">
          <div><label className="label">Experience (months)</label><input type="number" className="input" value={form.totalExperienceMonths} onChange={(e) => set('totalExperienceMonths')(e.target.value)} /></div>
          <div><label className="label">Expected min ₹</label><input type="number" className="input" value={form.expMin} onChange={(e) => set('expMin')(e.target.value)} /></div>
          <div><label className="label">Expected max ₹</label><input type="number" className="input" value={form.expMax} onChange={(e) => set('expMax')(e.target.value)} /></div>
        </div>
        <div>
          <label className="label">Availability</label>
          <select className="input w-56" value={form.availability} onChange={(e) => set('availability')(e.target.value)}>
            {['immediate', 'within_15_days', 'within_1_month', 'more_than_1_month'].map((a) => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-primary" checked={form.isOpenToWork} onChange={(e) => set('isOpenToWork')(e.target.checked)} /> Open to work</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-primary" checked={form.willingToRelocate} onChange={(e) => set('willingToRelocate')(e.target.checked)} /> Will relocate</label>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary" disabled={busy} onClick={save}>{busy ? 'Saving...' : 'Save'}</button>
          <button className="btn-ghost" onClick={() => navigate('/candidates')}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
