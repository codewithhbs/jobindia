import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Briefcase,
  Building2,
  ShieldCheck,
  Car,
  GraduationCap,
  Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usersApi } from "@/api/users.api";
import { kycApi } from "@/api/kyc.api";
import { jobsApi } from "@/api/jobs.api";
import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

const PIE_COLORS = ["#171717", "#525252", "#a3a3a3", "#d4d4d4"];

export default function DashboardPage() {
  const { data: userStats, isLoading: loadingUsers } = useQuery({
    queryKey: ["dashboard", "user-stats"],
    queryFn: () => usersApi.stats().then((r) => r.data.data),
  });

  const { data: kycStats, isLoading: loadingKyc } = useQuery({
    queryKey: ["dashboard", "kyc-stats"],
    queryFn: () => kycApi.stats().then((r) => r.data.data),
  });

  const { data: pendingJobs, isLoading: loadingJobs } = useQuery({
    queryKey: ["dashboard", "pending-jobs"],
    queryFn: () => jobsApi.pendingVerification().then((r) => r.data.data),
  });

  const roleData = userStats
    ? [
        { name: "Jobseekers", value: userStats.jobseekers },
        { name: "Employers", value: userStats.employers },
        { name: "Drivers", value: userStats.drivers },
        { name: "Admins", value: userStats.admins },
      ]
    : [];

  const kycData = kycStats
    ? Object.entries(kycStats).map(([status, count]) => ({ status, count }))
    : [];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your job marketplace platform"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loadingUsers ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <StatCard label="Total Users" value={userStats?.total ?? 0} icon={Users} />
            <StatCard
              label="Active Today"
              value={userStats?.activeToday ?? 0}
              icon={Clock}
              trendLabel="last 24 hours"
            />
            <StatCard label="Jobseekers" value={userStats?.jobseekers ?? 0} icon={GraduationCap} accent="muted" />
            <StatCard label="Employers" value={userStats?.employers ?? 0} icon={Building2} accent="muted" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Drivers" value={userStats?.drivers ?? 0} icon={Car} accent="muted" />
        <StatCard
          label="Pending KYC"
          value={kycStats?.pending ?? 0}
          icon={ShieldCheck}
          accent="muted"
        />
        <StatCard
          label="Jobs Awaiting Verification"
          value={pendingJobs?.length ?? 0}
          icon={Briefcase}
          accent="muted"
        />
        <StatCard label="Admins" value={userStats?.admins ?? 0} icon={ShieldCheck} accent="muted" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Users by role</CardTitle>
            <CardDescription>Distribution across account types</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={roleData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" fill="var(--foreground)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>KYC submissions</CardTitle>
            <CardDescription>By review status</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingKyc ? (
              <Skeleton className="h-64 w-full" />
            ) : kycData.length === 0 ? (
              <EmptyState title="No KYC data yet" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={kycData}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {kycData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Jobs awaiting verification</CardTitle>
            <CardDescription>Newly posted jobs pending admin review</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/jobs?status=paused">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loadingJobs ? (
            <Skeleton className="h-40 w-full" />
          ) : !pendingJobs?.length ? (
            <EmptyState title="No jobs pending verification" />
          ) : (
            <div className="divide-y divide-border">
              {pendingJobs.slice(0, 6).map((job) => (
                <div key={job._id} className="flex items-center justify-between py-3">
                  <div>
                    <Link to={`/jobs/${job._id}`} className="font-medium hover:underline">
                      {job.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {job.employerId?.name || "Unknown employer"}
                    </p>
                  </div>
                  <StatusBadge status="pending" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
