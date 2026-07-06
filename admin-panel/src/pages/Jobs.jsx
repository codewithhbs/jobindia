import React from 'react';
import toast from 'react-hot-toast';
import { API } from '../lib/api';
import { useFetch } from './_useFetch';
import { Spinner, Table, Badge } from '../components/ui';

export default function Jobs() {
  const { data, loading, refetch } = useFetch(() => API.jobs.list({ limit: 50 }), []);
  const remove = async (id) => {
    if (!confirm('Delete this job?')) return;
    try { await API.jobs.remove(id); toast.success('Deleted'); refetch(); } catch (e) { toast.error(e.message); }
  };
  const rows = data?.data || [];
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Jobs</h1>
      {loading ? <Spinner /> : (
        <Table
          columns={['Title', 'Company', 'Category', 'Status', 'Action']}
          rows={rows}
          empty="No jobs posted"
          renderRow={(j) => (
            <tr key={j._id}>
              <td className="td font-semibold">{j.title}</td>
              <td className="td">{j.companyName || '—'}</td>
              <td className="td">{j.category || '—'}</td>
              <td className="td"><Badge color={j.status === 'active' ? 'success' : 'gray'}>{j.status}</Badge></td>
              <td className="td"><button onClick={() => remove(j._id)} className="btn-danger !py-1.5 !px-3 text-xs">Delete</button></td>
            </tr>
          )}
        />
      )}
    </div>
  );
}
