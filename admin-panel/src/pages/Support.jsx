import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { API } from '../lib/api';
import { useFetch } from './_useFetch';
import { Spinner, Table, Badge, Modal } from '../components/ui';

const COLOR = { open: 'primary', pending: 'warning', resolved: 'success', closed: 'gray' };

export default function Support() {
  const [status, setStatus] = useState('');
  const { data, loading, refetch } = useFetch(() => API.support.list({ status: status || undefined }), [status]);
  const [active, setActive] = useState(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);

  const sendReply = async () => {
    if (!reply) return;
    setBusy(true);
    try { await API.support.adminReply(active._id, reply); toast.success('Reply sent'); setReply(''); setActive(null); refetch(); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const close = async (id) => {
    try { await API.support.setStatus(id, 'closed'); toast.success('Closed'); refetch(); } catch (e) { toast.error(e.message); }
  };

  const rows = data?.data || [];
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Support Tickets</h1>
        <select className="input w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All status</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      {loading ? <Spinner /> : (
        <Table
          columns={['Ticket', 'Subject', 'User', 'Status', 'Action']}
          rows={rows}
          empty="No tickets"
          renderRow={(t) => (
            <tr key={t._id}>
              <td className="td font-mono text-xs">{t.ticketId}</td>
              <td className="td font-semibold">{t.subject}</td>
              <td className="td">{t.user?.name || t.user?.phone || '—'}</td>
              <td className="td"><Badge color={COLOR[t.status] || 'gray'}>{t.status}</Badge></td>
              <td className="td">
                <div className="flex gap-2">
                  <button onClick={() => setActive(t)} className="btn-outline !py-1.5 !px-3 text-xs">Reply</button>
                  {t.status !== 'closed' && <button onClick={() => close(t._id)} className="btn-ghost !py-1.5 !px-3 text-xs">Close</button>}
                </div>
              </td>
            </tr>
          )}
        />
      )}

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.subject}
        footer={<button className="btn-primary" disabled={busy} onClick={sendReply}>Send Reply</button>}>
        <div className="space-y-3">
          <div className="max-h-60 space-y-2 overflow-y-auto">
            {(active?.messages || []).map((m, i) => (
              <div key={i} className={`rounded-xl p-3 text-sm ${m.sender === 'admin' ? 'bg-primary-light ml-8' : 'bg-bg mr-8'}`}>
                <p className="mb-1 text-xs font-bold capitalize text-muted">{m.sender}</p>
                {m.text}
              </div>
            ))}
          </div>
          <textarea className="input min-h-[80px]" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply..." />
        </div>
      </Modal>
    </div>
  );
}
