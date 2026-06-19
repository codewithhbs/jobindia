import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { API } from '../lib/api';
import { useFetch } from './_useFetch';
import { Spinner, Table, Badge, Modal } from '../components/ui';

export default function Kyc() {
  const { data, loading, refetch } = useFetch(() => API.kyc.pending({ status: 'pending', limit: 50 }), []);
  const [active, setActive] = useState(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const review = async (status) => {
    setBusy(true);
    try {
      await API.kyc.review(active.userId?._id || active.userId, { status, adminNotes: notes });
      toast.success(`KYC ${status}`);
      setActive(null); setNotes('');
      refetch();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  const rows = data?.data || [];
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">KYC Review</h1>
      {loading ? <Spinner /> : (
        <Table
          columns={['User', 'Role', 'Documents', 'Submitted', 'Action']}
          rows={rows}
          empty="No pending KYC submissions"
          renderRow={(s) => (
            <tr key={s._id}>
              <td className="td font-semibold">{s.userId?.name || s.userId?.phone || s.userId}</td>
              <td className="td capitalize">{s.userRole}</td>
              <td className="td">{s.documents?.length || 0} docs</td>
              <td className="td">{s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : '—'}</td>
              <td className="td">
                <button onClick={() => setActive(s)} className="btn-outline !py-1.5 !px-3 text-xs">Review</button>
              </td>
            </tr>
          )}
        />
      )}

      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        title="Review KYC Submission"
        footer={
          <>
            <button className="btn-danger" disabled={busy} onClick={() => review('rejected')}>Reject</button>
            <button className="btn-primary" disabled={busy} onClick={() => review('approved')}>Approve</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            {(active?.documents || []).map((d) => (
              <div key={d._id} className="flex items-center justify-between rounded-xl bg-bg px-4 py-3">
                <span className="text-sm font-medium">{d.fieldName || d.documentType}</span>
                <div className="flex items-center gap-2">
                  {d.fileUrl && <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary">View</a>}
                  <Badge color="warning">{d.status}</Badge>
                </div>
              </div>
            ))}
            {!active?.documents?.length && <p className="text-sm text-muted">No documents attached</p>}
          </div>
          <div>
            <label className="label">Admin notes (optional)</label>
            <textarea className="input min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason / remarks" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
