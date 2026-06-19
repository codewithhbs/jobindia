import React from 'react';
import { Users, Building2, Car, ShieldCheck } from 'lucide-react';
import { API } from '../lib/api';
import { useFetch } from './_useFetch';
import { Spinner, StatCard } from '../components/ui';

export default function Dashboard() {
  const { data: stats, loading } = useFetch(() => API.users.stats(), []);
  const { data: kyc } = useFetch(() => API.kyc.stats(), []);

  if (loading) return <Spinner label="Loading dashboard..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Dashboard</h1>
        <p className="text-muted">Overview of your marketplace</p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={stats?.total ?? 0} color="#4F6EF7" />
        <StatCard icon={Building2} label="Employers" value={stats?.employers ?? 0} color="#0EA5A0" />
        <StatCard icon={Car} label="Drivers" value={stats?.drivers ?? 0} color="#F59E0B" />
        <StatCard icon={Users} label="Job Seekers" value={stats?.jobseekers ?? 0} color="#22C55E" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-3 font-bold">KYC Pipeline</h3>
          <div className="space-y-2">
            {Object.entries(kyc || {}).length === 0 ? (
              <p className="text-sm text-muted">No submissions yet</p>
            ) : Object.entries(kyc || {}).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-sm">
                <span className="capitalize text-muted">{k.replace('_', ' ')}</span>
                <span className="font-bold">{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="mb-3 font-bold">Today</h3>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">New users (24h)</span>
            <span className="font-bold">{stats?.activeToday ?? 0}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-muted">Admins</span>
            <span className="font-bold">{stats?.admins ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
