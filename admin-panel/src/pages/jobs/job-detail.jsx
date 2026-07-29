import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2, Download, Users, Bookmark, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { jobsApi } from "@/api/jobs.api";
import { getErrorMessage } from "@/api/client";
import { formatDate, formatCurrency, initials } from "@/lib/utils";
import { tokenStore } from "@/api/client";

const STATUSES = ["draft", "active", "paused", "closed", "expired", "verified", "rejected"];
const APP_STATUSES = ["applied", "viewed", "shortlisted", "interview_scheduled", "offered", "hired", "rejected", "withdrawn"];

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["job-full", id],
    queryFn: () => jobsApi.getFullById(id).then((r) => r.data.data),
  });

  useEffect(() => {
    if (data?.job) {
      setForm({
        title: data.job.title,
        description: data.job.description,
        status: data.job.status,
        vacancies: data.job.vacancies,
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (payload) => jobsApi.update(id, payload),
    onSuccess: () => {
      toast.success("Job updated");
      qc.invalidateQueries({ queryKey: ["job-full", id] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const appStatusMutation = useMutation({
    mutationFn: ({ appId, status }) => jobsApi.updateApplicationStatus(appId, { status }),
    onSuccess: () => {
      toast.success("Application status updated");
      qc.invalidateQueries({ queryKey: ["job-full", id] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading || !form) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const { job, employerProfile, applications, savedBy } = data;

  const handleExport = () => {
    const token = tokenStore.getAccess();
    const url = jobsApi.exportApplicationsUrl(id);
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `applications_${job.title}.xlsx`;
        link.click();
      })
      .catch(() => toast.error("Failed to export applications"));
  };

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <PageHeader
        title={job.title}
        description={`${job.companyName || employerProfile?.companyName || "—"} · ${job.category}`}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to={`/jobs/${id}/edit`}><Pencil className="h-4 w-4" /> Edit all fields</Link>
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4" /> Export applications
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">
            Applications ({applications?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="saved">
            Saved by ({savedBy?.total || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Job details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Vacancies</Label>
                    <Input type="number" value={form.vacancies} onChange={(e) => setForm({ ...form, vacancies: e.target.value })} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="h-fit">
              <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={job.status} /></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Job type</span><span className="capitalize">{job.jobType?.replace(/_/g, " ")}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Salary</span><span>{formatCurrency(job.salary?.min)} - {formatCurrency(job.salary?.max)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Views</span><span>{job.views || 0}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Applications</span><span>{job.applications || 0}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Shortlisted</span><span>{job.shortlisted || 0}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Posted</span><span>{formatDate(job.createdAt)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">City</span><span>{job.location?.city || "Remote"}</span></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardContent className="p-0">
              {!applications?.data?.length ? (
                <EmptyState icon={Users} title="No applications yet" />
              ) : (
                <div className="divide-y divide-border">
                  {applications.data.map((app) => (
                    <div key={app._id} className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>{initials(app.applicant?.name || "?")}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{app.applicant?.name || "Unnamed"}</p>
                          <p className="text-xs text-muted-foreground">{app.applicant?.phone} · Applied {formatDate(app.appliedAt)}</p>
                        </div>
                      </div>
                      <Select
                        value={app.status}
                        onValueChange={(v) => appStatusMutation.mutate({ appId: app._id, status: v })}
                      >
                        <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {APP_STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved">
          <Card>
            <CardContent className="p-0">
              {!savedBy?.data?.length ? (
                <EmptyState icon={Bookmark} title="No one has saved this job yet" />
              ) : (
                <div className="divide-y divide-border">
                  {savedBy.data.map((s) => (
                    <div key={s._id} className="flex items-center gap-3 p-4">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{initials(s.user?.name || "?")}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{s.user?.name || "Unnamed"}</p>
                        <p className="text-xs text-muted-foreground">{s.user?.phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
