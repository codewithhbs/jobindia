import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import { API } from '../lib/api';
import { useFetch } from './_useFetch';
import { Spinner } from '../components/ui';

export default function Settings() {
  const { data: settings, loading } = useFetch(() => API.settings.all(), []);
  const [edited, setEdited] = useState({});

  useEffect(() => { setEdited({}); }, [settings]);

  const list = Array.isArray(settings) ? settings : settings?.data || [];
  const save = async (s) => {
    try {
      await API.settings.upsert({ key: s.key, value: edited[s.key] ?? s.value, type: s.type, category: s.category, isPublic: s.isPublic });
      toast.success(`Saved ${s.key}`);
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <Spinner />;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">App Settings</h1>
        <p className="text-muted">Superadmin only · controls the mobile app remotely</p>
      </div>
      <div className="card divide-y divide-line">
        {list.map((s) => (
          <div key={s.key} className="flex items-center gap-4 p-4">
            <div className="flex-1">
              <p className="font-semibold">{s.key}</p>
              <p className="text-xs text-muted">{s.category} · {s.type}</p>
            </div>
            {s.type === 'boolean' ? (
              <input type="checkbox" className="h-5 w-5 accent-primary"
                defaultChecked={!!s.value}
                onChange={(e) => setEdited({ ...edited, [s.key]: e.target.checked })} />
            ) : (
              <input className="input w-64" defaultValue={typeof s.value === 'object' ? JSON.stringify(s.value) : s.value}
                onChange={(e) => setEdited({ ...edited, [s.key]: e.target.value })} />
            )}
            <button className="btn-ghost !py-2 !px-3" onClick={() => save(s)}><Save size={16} /></button>
          </div>
        ))}
        {list.length === 0 && <p className="p-6 text-sm text-muted">No settings found. Run the backend seed.</p>}
      </div>
    </div>
  );
}
