import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { API } from '../lib/api';
import { Spinner, Badge } from '../components/ui';

const ROLES = ['jobseeker', 'employer', 'driver', 'admin', 'superadmin'];
const KYC_STATUSES = ['not_submitted', 'pending', 'under_review', 'approved', 'rejected'];
const AVAILABILITY = ['immediate', '15_days', '30_days', '60_days', 'flexible'];

function fmtDate(d, withTime = true) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' });
}

function emptyEducation() {
  return { _isNew: true, tempId: Date.now() + Math.random(), level: '', degree: '', institution: '', fieldOfStudy: '', startYear: '', grade: '', isPursuing: false };
}
function emptyExperience() {
  return { _isNew: true, tempId: Date.now() + Math.random(), jobTitle: '', company: '', employmentType: 'full_time', location: '', startDate: '', endDate: '', isCurrent: false, description: '' };
}

export default function UserDetailJobseeker() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(null); // account-level fields
  const [pForm, setPForm] = useState(null); // profile-level fields
  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [removedEducation, setRemovedEducation] = useState([]);
  const [removedExperience, setRemovedExperience] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await API.users.get(id);
        if (!res?.user) { setNotFound(true); return; }
        const u = res.user;
        const p = res.profile || {};
        setUser(u);
        setForm({
          name: u.name || '', email: u.email || '', role: u.role, isActive: u.isActive,
          kycStatus: u.kycStatus || 'not_submitted', phone: u.phone,
        });
        setPForm({
          headline: p.headline || '',
          about: p.about || '',
          skills: (p.skills || []).join(', '),
          totalExperienceMonths: p.totalExperienceMonths ?? 0,
          availability: p.availability || 'immediate',
          noticePeriodDays: p.noticePeriodDays ?? 0,
          isOpenToWork: p.isOpenToWork ?? true,
          willingToRelocate: p.willingToRelocate ?? false,
          currentSalary: p.currentSalary ?? '',
          expectedSalaryMin: p.expectedSalary?.min ?? '',
          expectedSalaryMax: p.expectedSalary?.max ?? '',
          expectedSalaryPeriod: p.expectedSalary?.period || 'monthly',
          linkedin: p.links?.linkedin || '',
          github: p.links?.github || '',
          portfolio: p.links?.portfolio || '',
        });
        setEducation((p.education || []).map((e) => ({ ...e, tempId: e._id })));
        setExperience((p.experience || []).map((e) => ({ ...e, tempId: e._id })));
      } catch (e) {
        toast.error(e.message);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const setP = (k) => (v) => setPForm((f) => ({ ...f, [k]: v }));

  const updateEduField = (tempId, key, val) => {
    setEducation((list) => list.map((e) => (e.tempId === tempId ? { ...e, [key]: val } : e)));
  };
  const updateExpField = (tempId, key, val) => {
    setExperience((list) => list.map((e) => (e.tempId === tempId ? { ...e, [key]: val } : e)));
  };

  const addEducation = () => setEducation((l) => [...l, emptyEducation()]);
  const addExperience = () => setExperience((l) => [...l, emptyExperience()]);

  const removeEducation = (tempId, isNew, realId) => {
    setEducation((l) => l.filter((e) => e.tempId !== tempId));
    if (!isNew && realId) setRemovedEducation((r) => [...r, realId]);
  };
  const removeExperience = (tempId, isNew, realId) => {
    setExperience((l) => l.filter((e) => e.tempId !== tempId));
    if (!isNew && realId) setRemovedExperience((r) => [...r, realId]);
  };

  const save = async () => {
    setBusy(true);
    try {
      // 1. account-level fields (role, isActive, kycStatus, name, email) — admin/employer route
      await API.manage.updateUser(id, {
        name: form.name, email: form.email, role: form.role, isActive: form.isActive, kycStatus: form.kycStatus,
      });

      // 2. profile fields — jobseeker fullUpdate route
      const eduAdd = education.filter((e) => e._isNew).map(({ tempId, _isNew, ...rest }) => rest);
      const eduUpdate = education.filter((e) => !e._isNew).map(({ tempId, _id, ...rest }) => ({ itemId: _id, ...rest }));
      const expAdd = experience.filter((e) => e._isNew).map(({ tempId, _isNew, ...rest }) => rest);
      const expUpdate = experience.filter((e) => !e._isNew).map(({ tempId, _id, ...rest }) => ({ itemId: _id, ...rest }));

      await API.jobseekers.fullUpdate(id, {
        profile: {
          headline: pForm.headline,
          about: pForm.about,
          skills: pForm.skills.split(',').map((s) => s.trim()).filter(Boolean),
          totalExperienceMonths: Number(pForm.totalExperienceMonths) || 0,
          availability: pForm.availability,
          noticePeriodDays: Number(pForm.noticePeriodDays) || 0,
          willingToRelocate: pForm.willingToRelocate,
          currentSalary: pForm.currentSalary ? Number(pForm.currentSalary) : undefined,
          expectedSalary: {
            min: pForm.expectedSalaryMin ? Number(pForm.expectedSalaryMin) : undefined,
            max: pForm.expectedSalaryMax ? Number(pForm.expectedSalaryMax) : undefined,
            period: pForm.expectedSalaryPeriod,
            currency: 'INR',
          },
          links: { linkedin: pForm.linkedin, github: pForm.github, portfolio: pForm.portfolio },
        },
        isOpenToWork: pForm.isOpenToWork,
        education: { add: eduAdd, update: eduUpdate, remove: removedEducation },
        experience: { add: expAdd, update: expUpdate, remove: removedExperience },
      });

      toast.success('Jobseeker updated');
      navigate('/users');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner />;

  if (notFound || !form || !pForm || !user) {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-2xl font-extrabold">User not found</h1>
        <button className="btn-ghost" onClick={() => navigate('/users')}>Back to Users</button>
      </div>
    );
  }

  const loc = user.location || {};
  const hasLocation = loc.city || loc.address;

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Edit Jobseeker</h1>
        <button className="btn-ghost" onClick={() => navigate('/users')}>← Back to Users</button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        {/* ===== LEFT: All editable fields ===== */}
        <div className="space-y-5">
          {/* Account */}
          <div className="card space-y-4 p-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              {user.avatar ? (
                <img src={`https://jobapi.adsdigitalmedia.com${user.avatar}`} alt={user.name} className="h-14 w-14 rounded-full object-cover border" />
              ) : (
                <div className="h-14 w-14 rounded-full bg-bg flex items-center justify-center text-lg font-bold text-muted">
                  {(user.name || '?')[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-bold text-lg">{user.name || 'Unnamed'}</p>
                <p className="text-xs text-muted font-mono">{user._id}</p>
              </div>
            </div>

            <h2 className="font-bold text-sm text-muted uppercase tracking-wide">Account</h2>
            <div><label className="label">Phone</label><input className="input bg-bg" value={form.phone} disabled /></div>
            <div className="grid gap-4 grid-cols-2">
              <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => set('name')(e.target.value)} /></div>
              <div><label className="label">Email</label><input className="input" value={form.email} onChange={(e) => set('email')(e.target.value)} /></div>
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div>
                <label className="label">Role</label>
                <select className="input" value={form.role} onChange={(e) => set('role')(e.target.value)}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="label">KYC Status</label>
                <select className="input" value={form.kycStatus} onChange={(e) => set('kycStatus')(e.target.value)}>
                  {KYC_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-primary" checked={form.isActive} onChange={(e) => set('isActive')(e.target.checked)} /> Active account
            </label>
          </div>

          {/* Profile */}
          <div className="card space-y-4 p-6">
            <h2 className="font-bold text-sm text-muted uppercase tracking-wide">Jobseeker Profile</h2>
            <div><label className="label">Headline</label><input className="input" value={pForm.headline} onChange={(e) => setP('headline')(e.target.value)} /></div>
            <div><label className="label">About</label><textarea className="input" rows={3} value={pForm.about} onChange={(e) => setP('about')(e.target.value)} /></div>
            <div><label className="label">Skills (comma separated)</label><input className="input" value={pForm.skills} onChange={(e) => setP('skills')(e.target.value)} /></div>

            <div className="grid gap-4 grid-cols-2">
              <div><label className="label">Total Experience (months)</label><input type="number" className="input" value={pForm.totalExperienceMonths} onChange={(e) => setP('totalExperienceMonths')(e.target.value)} /></div>
              <div><label className="label">Notice Period (days)</label><input type="number" className="input" value={pForm.noticePeriodDays} onChange={(e) => setP('noticePeriodDays')(e.target.value)} /></div>
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div>
                <label className="label">Availability</label>
                <select className="input" value={pForm.availability} onChange={(e) => setP('availability')(e.target.value)}>
                  {AVAILABILITY.map((a) => <option key={a} value={a}>{a.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div><label className="label">Current Salary</label><input type="number" className="input" value={pForm.currentSalary} onChange={(e) => setP('currentSalary')(e.target.value)} /></div>
            </div>

            <div className="grid gap-4 grid-cols-3">
              <div><label className="label">Expected Min</label><input type="number" className="input" value={pForm.expectedSalaryMin} onChange={(e) => setP('expectedSalaryMin')(e.target.value)} /></div>
              <div><label className="label">Expected Max</label><input type="number" className="input" value={pForm.expectedSalaryMax} onChange={(e) => setP('expectedSalaryMax')(e.target.value)} /></div>
              <div>
                <label className="label">Period</label>
                <select className="input" value={pForm.expectedSalaryPeriod} onChange={(e) => setP('expectedSalaryPeriod')(e.target.value)}>
                  <option value="monthly">Monthly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4 accent-primary" checked={pForm.isOpenToWork} onChange={(e) => setP('isOpenToWork')(e.target.checked)} /> Open to work
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4 accent-primary" checked={pForm.willingToRelocate} onChange={(e) => setP('willingToRelocate')(e.target.checked)} /> Willing to relocate
              </label>
            </div>

            <div className="grid gap-4 grid-cols-3">
              <div><label className="label">LinkedIn</label><input className="input" value={pForm.linkedin} onChange={(e) => setP('linkedin')(e.target.value)} /></div>
              <div><label className="label">GitHub</label><input className="input" value={pForm.github} onChange={(e) => setP('github')(e.target.value)} /></div>
              <div><label className="label">Portfolio</label><input className="input" value={pForm.portfolio} onChange={(e) => setP('portfolio')(e.target.value)} /></div>
            </div>
          </div>

          {/* Education */}
          <div className="card space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-muted uppercase tracking-wide">Education</h2>
              <button className="btn-outline !py-1 !px-2 text-xs flex items-center gap-1" onClick={addEducation}><Plus size={14} /> Add</button>
            </div>
            {education.map((ed) => (
              <div key={ed.tempId} className="border border-border rounded-lg p-3 space-y-2 relative">
                <button onClick={() => removeEducation(ed.tempId, ed._isNew, ed._id)} className="absolute top-2 right-2 text-danger">
                  <Trash2 size={14} />
                </button>
                <div className="grid gap-3 grid-cols-2">
                  <input className="input" placeholder="Degree" value={ed.degree || ''} onChange={(e) => updateEduField(ed.tempId, 'degree', e.target.value)} />
                  <input className="input" placeholder="Institution" value={ed.institution || ''} onChange={(e) => updateEduField(ed.tempId, 'institution', e.target.value)} />
                  <input className="input" placeholder="Field of Study" value={ed.fieldOfStudy || ''} onChange={(e) => updateEduField(ed.tempId, 'fieldOfStudy', e.target.value)} />
                  <input className="input" placeholder="Start Year" value={ed.startYear || ''} onChange={(e) => updateEduField(ed.tempId, 'startYear', e.target.value)} />
                  <input className="input" placeholder="Grade" value={ed.grade || ''} onChange={(e) => updateEduField(ed.tempId, 'grade', e.target.value)} />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="h-4 w-4 accent-primary" checked={!!ed.isPursuing} onChange={(e) => updateEduField(ed.tempId, 'isPursuing', e.target.checked)} /> Pursuing
                  </label>
                </div>
              </div>
            ))}
            {education.length === 0 && <p className="text-sm text-muted">No education entries.</p>}
          </div>

          {/* Experience */}
          <div className="card space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-muted uppercase tracking-wide">Experience</h2>
              <button className="btn-outline !py-1 !px-2 text-xs flex items-center gap-1" onClick={addExperience}><Plus size={14} /> Add</button>
            </div>
            {experience.map((ex) => (
              <div key={ex.tempId} className="border border-border rounded-lg p-3 space-y-2 relative">
                <button onClick={() => removeExperience(ex.tempId, ex._isNew, ex._id)} className="absolute top-2 right-2 text-danger">
                  <Trash2 size={14} />
                </button>
                <div className="grid gap-3 grid-cols-2">
                  <input className="input" placeholder="Job Title" value={ex.jobTitle || ''} onChange={(e) => updateExpField(ex.tempId, 'jobTitle', e.target.value)} />
                  <input className="input" placeholder="Company" value={ex.company || ''} onChange={(e) => updateExpField(ex.tempId, 'company', e.target.value)} />
                  <input className="input" placeholder="Location" value={ex.location || ''} onChange={(e) => updateExpField(ex.tempId, 'location', e.target.value)} />
                  <input className="input" placeholder="Start Date" value={ex.startDate || ''} onChange={(e) => updateExpField(ex.tempId, 'startDate', e.target.value)} />
                  <input className="input" placeholder="End Date" value={ex.endDate || ''} onChange={(e) => updateExpField(ex.tempId, 'endDate', e.target.value)} disabled={ex.isCurrent} />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="h-4 w-4 accent-primary" checked={!!ex.isCurrent} onChange={(e) => updateExpField(ex.tempId, 'isCurrent', e.target.checked)} /> Currently working
                  </label>
                </div>
                <textarea className="input" rows={2} placeholder="Description" value={ex.description || ''} onChange={(e) => updateExpField(ex.tempId, 'description', e.target.value)} />
              </div>
            ))}
            {experience.length === 0 && <p className="text-sm text-muted">No experience entries.</p>}
          </div>

          <div className="flex gap-2">
            <button className="btn-primary flex-1" disabled={busy} onClick={save}>{busy ? 'Saving...' : 'Save All Changes'}</button>
            <button className="btn-ghost" onClick={() => navigate('/users')}>Cancel</button>
          </div>
        </div>

        {/* ===== RIGHT: Read-only context ===== */}
        <div className="space-y-5">
          <div className="card space-y-3 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-muted uppercase tracking-wide">Status</h2>
              <Badge color={user.isActive ? 'success' : 'gray'}>{user.isActive ? 'Active' : 'Inactive'}</Badge>
            </div>
            <div className="grid gap-3 grid-cols-2 text-sm">
              <Detail label="Phone Verified" value={user.isPhoneVerified ? 'Yes' : 'No'} good={user.isPhoneVerified} />
              <Detail label="Email Verified" value={user.isEmailVerified ? 'Yes' : 'No'} good={user.isEmailVerified} />
              <Detail label="Profile Complete" value={user.isProfileComplete ? 'Yes' : 'No'} good={user.isProfileComplete} />
              <Detail label="Last Seen" value={fmtDate(user.lastSeen)} />
              <Detail label="Created" value={fmtDate(user.createdAt)} />
            </div>
          </div>

          {hasLocation && (
            <div className="card space-y-3 p-6">
              <h2 className="font-bold text-sm text-muted uppercase tracking-wide">Location</h2>
              <div className="grid gap-3 grid-cols-2 text-sm">
                <Detail label="City" value={loc.city || '—'} />
                <Detail label="State" value={loc.state || '—'} />
                <Detail label="Pincode" value={loc.pincode || '—'} />
                <Detail label="Country" value={loc.country || '—'} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, good }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className={`font-medium ${good === false ? 'text-danger' : good === true ? 'text-success' : ''}`}>{value}</p>
    </div>
  );
}