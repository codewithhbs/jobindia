import React from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Users, Briefcase, FileText, IndianRupee } from 'lucide-react';
import { API } from '../lib/api';
import { useFetch } from './_useFetch';
import { Spinner, StatCard } from '../components/ui';

const PIE_COLORS = ['#4F6EF7', '#0EA5A0', '#F59E0B', '#22C55E', '#F43F5E', '#6B6B85'];

function ChartCard({ title, children }) {
  return (
    <div className="card p-5">
      <h3 className="mb-4 font-bold">{title}</h3>
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </div>
  );
}

export default function Analytics() {
  const { data, loading } = useFetch(() => API.analytics.overview(), []);
  if (loading) return <Spinner label="Crunching numbers..." />;
  if (!data) return null;

  const t = data.totals || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Analytics</h1>
        <p className="text-muted">Last 30 days</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={Users} label="Users" value={t.users ?? 0} color="#4F6EF7" />
        <StatCard icon={Briefcase} label="Jobs" value={t.jobs ?? 0} color="#0EA5A0" />
        <StatCard icon={FileText} label="Applications" value={t.applications ?? 0} color="#F59E0B" />
        <StatCard icon={IndianRupee} label="Revenue ₹" value={(t.revenue ?? 0).toLocaleString('en-IN')} color="#22C55E" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="User Signups">
          <LineChart data={data.signupsTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E6E6EF" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#4F6EF7" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ChartCard>

        <ChartCard title="Jobs Posted">
          <BarChart data={data.jobsTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E6E6EF" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#0EA5A0" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Revenue (₹)">
          <BarChart data={data.revenueTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E6E6EF" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="User Roles">
          <PieChart>
            <Pie data={data.roleDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
              {(data.roleDistribution || []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Application Status">
          <BarChart data={data.applicationStatus} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#E6E6EF" />
            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
            <Tooltip />
            <Bar dataKey="value" fill="#4F6EF7" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard title="KYC Status">
          <PieChart>
            <Pie data={data.kycStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
              {(data.kycStatus || []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ChartCard>
      </div>
    </div>
  );
}
