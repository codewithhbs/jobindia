import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API } from '../lib/api';
import { Spinner, Badge } from '../components/ui';

const ROLES = ['jobseeker', 'employer', 'driver', 'admin', 'superadmin'];
const KYC_STATUSES = ['not_submitted', 'pending', 'under_review', 'approved', 'rejected'];

function fmtDate(d, withTime = true) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' });
}

export default function UserDetailDriver() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await API.users.get(id);
        if (!res?.user) { setNotFound(true); return; }
        setUser(res.user);
        setProfile(res.profile || null);
        setForm({
          name: res.user.name || '',
          email: res.user.email || '',
          role: res.user.role,
          isActive: res.user.isActive,
          kycStatus: res.user.kycStatus || 'not_submitted',
          phone: res.user.phone,
        });
      } catch (e) {
        toast.error(e.message);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      await API.manage.updateUser(id, {
        name: form.name,
        email: form.email,
        role: form.role,
        isActive: form.isActive,
        kycStatus: form.kycStatus,
      });
      toast.success('User updated');
      setUser((prev) => ({ ...prev, ...form }));
      navigate('/users');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner />;

  if (notFound || !form || !user) {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-2xl font-extrabold">User not found</h1>
        <button className="btn-ghost" onClick={() => navigate('/users')}>Back to Users</button>
      </div>
    );
  }

  const loc = user.location || {};
  const device = user.deviceInfo || {};
  const hasLocation = loc.city || loc.address || loc.coordinates?.length;
  const hasDevice = device.platform || device.model;

  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Edit Driver</h1>
        <button className="btn-ghost" onClick={() => navigate('/users')}>← Back to Users</button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        {/* ===== LEFT: Edit form (user-level fields only) ===== */}
        <div className="card space-y-4 p-6 h-fit lg:sticky lg:top-5">
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

          <div><label className="label">Phone</label><input className="input bg-bg" value={form.phone} disabled /></div>
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => set('name')(e.target.value)} /></div>
          <div><label className="label">Email</label><input className="input" value={form.email} onChange={(e) => set('email')(e.target.value)} /></div>

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

          <div className="flex gap-2 pt-2">
            <button className="btn-primary flex-1" disabled={busy} onClick={save}>{busy ? 'Saving...' : 'Save Changes'}</button>
            <button className="btn-ghost" onClick={() => navigate('/users')}>Cancel</button>
          </div>
        </div>

        {/* ===== RIGHT: Read-only details ===== */}
        <div className="space-y-5">
          <div className="card space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-muted uppercase tracking-wide">Overview</h2>
              <div className="flex items-center gap-2">
                <Badge color="gray">{user.role}</Badge>
                <Badge color={user.isActive ? 'success' : 'gray'}>{user.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
            </div>
            <div className="grid gap-3 grid-cols-2 text-sm">
              <Detail label="Phone" value={user.phone} />
              <Detail label="Email" value={user.email || '—'} />
              <Detail label="Phone Verified" value={user.isPhoneVerified ? 'Yes' : 'No'} good={user.isPhoneVerified} />
              <Detail label="Email Verified" value={user.isEmailVerified ? 'Yes' : 'No'} good={user.isEmailVerified} />
              <Detail label="Profile Complete" value={user.isProfileComplete ? 'Yes' : 'No'} good={user.isProfileComplete} />
              <Detail
                label="KYC Status"
                value={`${user.kycStatus?.replace('_', ' ') || 'not submitted'}${user.isKYCVerified ? ' ✓' : ''}`}
                good={user.isKYCVerified}
              />
              <Detail label="Last Seen" value={fmtDate(user.lastSeen)} />
              <Detail label="Created" value={fmtDate(user.createdAt)} />
              <Detail label="Updated" value={fmtDate(user.updatedAt)} />
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
                <Detail label="Address" value={loc.address || '—'} full />
                <Detail
                  label="Coordinates"
                  value={loc.coordinates?.length === 2 ? `${loc.coordinates[1]}, ${loc.coordinates[0]}` : '—'}
                  mono
                  full
                />
              </div>
            </div>
          )}

          {hasDevice && (
            <div className="card space-y-3 p-6">
              <h2 className="font-bold text-sm text-muted uppercase tracking-wide">Device Info</h2>
              <div className="grid gap-3 grid-cols-2 text-sm">
                <Detail label="Platform" value={device.platform || '—'} />
                <Detail label="Type" value={device.type || '—'} />
                <Detail label="Brand" value={device.brand || '—'} />
                <Detail label="Model" value={device.model || '—'} />
                <Detail label="OS" value={device.os || '—'} />
                <Detail label="OS Version" value={device.osVersion || '—'} />
                <Detail label="Physical Device" value={device.isDevice ? 'Yes' : 'No'} full />
              </div>
            </div>
          )}

          {profile && (
            <>
              <div className="card space-y-3 p-6">
                <h2 className="font-bold text-sm text-muted uppercase tracking-wide">Vehicle Details</h2>
                <div className="grid gap-3 grid-cols-2 text-sm">
                  <Detail label="Vehicle Types" value={profile.vehicleTypes?.join(', ') || '—'} />
                  <Detail label="Vehicle Model" value={profile.vehicleModel || '—'} />
                  <Detail label="Vehicle Number" value={profile.vehicleNumber || '—'} mono />
                  <Detail label="License Number" value={profile.licenseNumber || '—'} mono />
                  <Detail label="Years of Experience" value={profile.yearsOfExperience != null ? `${profile.yearsOfExperience} yrs` : '—'} />
                  <Detail label="Available for Rides" value={profile.isAvailable ? 'Yes' : 'No'} good={profile.isAvailable} />
                </div>
              </div>

              {profile.documents?.length > 0 && (
                <div className="card space-y-3 p-6">
                  <h2 className="font-bold text-sm text-muted uppercase tracking-wide">Documents</h2>
                  <div className="space-y-2">
                    {profile.documents.map((doc) => (
                      <div key={doc._id} className="flex items-center gap-3 p-2 rounded-lg border border-border">
                        <a href={`https://jobapi.adsdigitalmedia.com${doc.fileUrl}`} target="_blank" rel="noreferrer">
                          <img src={`https://jobapi.adsdigitalmedia.com${doc.fileUrl}`} alt={doc.fieldName} className="h-12 w-12 rounded object-cover border" />
                        </a>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{doc.fieldName}</p>
                          <p className="text-xs text-muted">{fmtDate(doc.uploadedAt, false)}</p>
                        </div>
                        <Badge color={doc.verificationStatus === 'approved' ? 'success' : doc.verificationStatus === 'rejected' ? 'danger' : 'gray'}>
                          {doc.verificationStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value, mono, full, good }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-xs text-muted">{label}</p>
      <p className={`font-medium ${mono ? 'font-mono text-xs break-all' : ''} ${good === false ? 'text-danger' : good === true ? 'text-success' : ''}`}>
        {value}
      </p>
    </div>
  );
}