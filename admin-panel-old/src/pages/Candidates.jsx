import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { API } from '../lib/api';
import { useFetch } from './_useFetch';
import { Spinner, Table, Badge } from '../components/ui';

export default function Candidates() {
  const navigate = useNavigate();
  const [skill, setSkill] = useState('');
  const [q, setQ] = useState('');
  const { data, loading } = useFetch(() => API.jobseekers.search({ skill: q || undefined, limit: 50 }), [q]);

  const rows = data?.data || [];
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Candidates</h1>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-muted" size={16} />
          <input className="input pl-9" placeholder="Search by skill" value={skill}
            onChange={(e) => setSkill(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setQ(skill)} />
        </div>
      </div>
      {loading ? <Spinner /> : (
        <Table
          columns={['Name', 'Headline', 'Skills', 'Open', 'Action']}
          rows={rows}
          empty="No candidates"
          renderRow={(c) => (
            <tr key={c._id}>
              <td className="td font-semibold">{c.userId?.name || '—'}</td>
              <td className="td">{c.headline || '—'}</td>
              <td className="td text-muted">{(c.skills || []).slice(0, 3).join(', ')}</td>
              <td className="td"><Badge color={c.isOpenToWork ? 'success' : 'gray'}>{c.isOpenToWork ? 'Yes' : 'No'}</Badge></td>
              <td className="td"><button onClick={() => navigate(`/candidates/${c.userId?._id || c.userId}`)} className="btn-outline !py-1.5 !px-3 text-xs">Edit</button></td>
            </tr>
          )}
        />
      )}
    </div>
  );
}
