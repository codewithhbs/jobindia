import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API } from '../lib/api';
import { useFetch } from './_useFetch';
import { Spinner, Table, Badge } from '../components/ui';

const COLOR = { approved: 'success', pending: 'warning', rejected: 'danger', not_submitted: 'gray' };

export default function Employers() {
  const navigate = useNavigate();
  const { data, loading, refetch } = useFetch(() => API.employers.list({ limit: 50 }), []);
  const act = async (e, status) => {
    try { await API.employers.verify(e.userId?._id || e.userId, status); toast.success(`Employer ${status}`); refetch(); }
    catch (err) { toast.error(err.message); }
  };
  const rows = data?.data || [];
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Employers</h1>
      {loading ? <Spinner /> : (
        <Table
          columns={['Company', 'Contact', 'Plan', 'Status', 'Actions']}
          rows={rows}
          empty="No employers"
          renderRow={(e) => (
            <tr key={e._id}>
              <td className="td font-semibold">{e.companyName || '—'}</td>
              <td className="td">{e.userId?.name} · {e.userId?.phone}</td>
              <td className="td capitalize">{e.subscriptionPlan}</td>
              <td className="td"><Badge color={COLOR[e.verificationStatus] || 'gray'}>{e.verificationStatus}</Badge></td>
              <td className="td">
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/employers/${e.userId?._id || e.userId}`)} className="btn-outline !py-1.5 !px-3 text-xs">Edit</button>
                  <button onClick={() => act(e, 'approved')} className="btn-primary !py-1.5 !px-3 text-xs">Approve</button>
                  <button onClick={() => act(e, 'rejected')} className="btn-danger !py-1.5 !px-3 text-xs">Reject</button>
                </div>
              </td>
            </tr>
          )}
        />
      )}
    </div>
  );
}
