import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API } from '../lib/api';
import { Spinner, Badge } from '../components/ui';
const COMPANY_SIZE_OPTIONS = [
  { label: '1-10 employees', value: '1-10' },
  { label: '11-50 employees', value: '11-50' },
  { label: '51-200 employees', value: '51-200' },
  { label: '201-500 employees', value: '201-500' },
  { label: '500+ employees', value: '500+' },
];
export default function EmployerDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [meta, setMeta] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const e = await API.manage.getEmployer(userId);
        setMeta(e.userId);
        setForm({
          companyName: e.companyName || '',
          industry: e.industry || '',
          companySize: e.companySize || '',
          foundedYear: e.foundedYear || '',
          website: e.website || '',
          description: e.description || '',
          gstNumber: e.gstNumber || '',
          panNumber: e.panNumber || '',

          subscriptionPlan: e.subscriptionPlan || 'free',
          jobPostLimit: e.jobPostLimit || 3,
          verificationStatus: e.verificationStatus || 'not_submitted',

          contactPerson: {
            name: e.contactPerson?.name || '',
            designation: e.contactPerson?.designation || '',
            email: e.contactPerson?.email || '',
            phone: e.contactPerson?.phone || '',
          },

          address: {
            street: e.address?.street || '',
            city: e.address?.city || '',
            state: e.address?.state || '',
            country: e.address?.country || '',
            pincode: e.address?.pincode || '',
          },

          companyLogo: e.companyLogo || '',
        });
      } catch (err) { toast.error(err.message); }
    })();
  }, [userId]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const save = async () => {
    setBusy(true);
    try { await API.manage.updateEmployer(userId, form); toast.success('Employer updated'); navigate('/employers'); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  const setNested = (parent, key) => (value) =>
    setForm((f) => ({
      ...f,
      [parent]: {
        ...f[parent],
        [key]: value,
      },
    }));
  if (!form) return <Spinner />;
  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-extrabold">Edit Company</h1>
        <Badge color={form.verificationStatus === 'approved' ? 'success' : 'warning'}>{form.verificationStatus}</Badge>
      </div>
      {meta && <p className="text-sm text-muted">{meta.name} · {meta.phone}</p>}
      <div className="card space-y-4 p-6">
        <div><label className="label">Company Name</label><input className="input" value={form.companyName} onChange={(e) => set('companyName')(e.target.value)} /></div>
        <div className="grid gap-4 md:grid-cols-2">
          <div><label className="label">Industry</label><input className="input" value={form.industry} onChange={(e) => set('industry')(e.target.value)} /></div>
          <div><label className="label">Website</label><input className="input" value={form.website} onChange={(e) => set('website')(e.target.value)} /></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Company Size</label>
            <select
              className="input"
              value={form.companySize}
              onChange={(e) => set('companySize')(e.target.value)}
            >
              <option value="">Select company size</option>

              {COMPANY_SIZE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Founded Year</label>
            <input
              type="number"
              className="input"
              value={form.foundedYear}
              onChange={(e) => set('foundedYear')(e.target.value)}
            />
          </div>
        </div>
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-4">Contact Person</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="input"
              placeholder="Name"
              value={form.contactPerson.name}
              onChange={(e) => setNested('contactPerson', 'name')(e.target.value)}
            />

            <input
              className="input"
              placeholder="Designation"
              value={form.contactPerson.designation}
              onChange={(e) => setNested('contactPerson', 'designation')(e.target.value)}
            />

            <input
              className="input"
              placeholder="Email"
              value={form.contactPerson.email}
              onChange={(e) => setNested('contactPerson', 'email')(e.target.value)}
            />

            <input
              className="input"
              placeholder="Phone"
              value={form.contactPerson.phone}
              onChange={(e) => setNested('contactPerson', 'phone')(e.target.value)}
            />
          </div>
        </div>
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-4">Address</h3>

          <input
            className="input mb-4"
            placeholder="Street"
            value={form.address.street}
            onChange={(e) => setNested('address', 'street')(e.target.value)}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="input"
              placeholder="City"
              value={form.address.city}
              onChange={(e) => setNested('address', 'city')(e.target.value)}
            />

            <input
              className="input"
              placeholder="State"
              value={form.address.state}
              onChange={(e) => setNested('address', 'state')(e.target.value)}
            />

            <input
              className="input"
              placeholder="Country"
              value={form.address.country}
              onChange={(e) => setNested('address', 'country')(e.target.value)}
            />

            <input
              className="input"
              placeholder="Pincode"
              value={form.address.pincode}
              onChange={(e) => setNested('address', 'pincode')(e.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div><label className="label">GST Number</label><input className="input" value={form.gstNumber} onChange={(e) => set('gstNumber')(e.target.value)} /></div>
          <div><label className="label">PAN Number</label><input className="input" value={form.panNumber} onChange={(e) => set('panNumber')(e.target.value)} /></div>
        </div>
        <div><label className="label">About</label><textarea className="input min-h-[90px]" value={form.description} onChange={(e) => set('description')(e.target.value)} /></div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="label">Plan</label>
            <select className="input" value={form.subscriptionPlan} onChange={(e) => set('subscriptionPlan')(e.target.value)}>
              {['free', 'premium', 'enterprise'].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div><label className="label">Job Limit</label><input type="number" className="input" value={form.jobPostLimit} onChange={(e) => set('jobPostLimit')(Number(e.target.value))} /></div>
          <div>
            <label className="label">Verification</label>
            <select className="input" value={form.verificationStatus} onChange={(e) => set('verificationStatus')(e.target.value)}>
              {['not_submitted', 'pending', 'approved', 'rejected'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary" disabled={busy} onClick={save}>{busy ? 'Saving...' : 'Save'}</button>
          <button className="btn-ghost" onClick={() => navigate('/employers')}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
