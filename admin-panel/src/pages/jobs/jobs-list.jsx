import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Eye, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { jobsApi } from "@/api/jobs.api";
import { formatDate, formatCurrency } from "@/lib/utils";
import { getErrorMessage } from "@/api/client";

const STATUSES = ["draft", "active", "paused", "closed", "expired", "verified", "rejected"];

export default function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const limit = 20;
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", { search, status, page }],
    queryFn: () => jobsApi.list({ search, status, page, limit }).then((r) => r.data),
  });

  const closeMutation = useMutation({
    mutationFn: (id) => jobsApi.remove(id),
    onSuccess: () => {
      toast.success("Job closed");
      qc.invalidateQueries({ queryKey: ["jobs"] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const jobs = data?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit };

  return (
    <div>
      <PageHeader
        title="Jobs"
        description="Manage job listings across the platform"
        actions={<Button asChild><Link to="/jobs/new"><Plus className="h-4 w-4" /> Post a job</Link></Button>}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search job title…" />
        <Select
          value={status || "all"}
          onValueChange={(v) => {
            const val = v === "all" ? "" : v;
            setStatus(val);
            setPage(1);
            setSearchParams(val ? { status: val } : {});
          }}
        >
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState title="No jobs found" description="Try adjusting your filters" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Employer</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Applications</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((j) => (
                <TableRow key={j._id}>
                  <TableCell>
                    <Link to={`/jobs/${j._id}`} className="font-medium hover:underline">{j.title}</Link>
                    {j.isFeatured && <Badge variant="warning" className="ml-2">Featured</Badge>}
                  </TableCell>
                  <TableCell className="text-sm">{j.employer?.name || j.companyName || "—"}</TableCell>
                  <TableCell className="text-sm">{j.category}</TableCell>
                  <TableCell className="text-sm">
                    {j.salary?.min || j.salary?.max
                      ? `${formatCurrency(j.salary?.min)} - ${formatCurrency(j.salary?.max)}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm">{j.applications || 0}</TableCell>
                  <TableCell><StatusBadge status={j.status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(j.createdAt)}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button asChild variant="ghost" size="icon">
                      <Link to={`/jobs/${j._id}`}><Eye className="h-4 w-4" /></Link>
                    </Button>
                    {j.status !== "closed" && (
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(j)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="px-4">
          <PaginationBar page={pagination.page} limit={pagination.limit} total={pagination.total} onPageChange={setPage} />
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Close this job?"
        description={`"${deleteTarget?.title}" will be closed and removed from active listings.`}
        confirmText="Close job"
        loading={closeMutation.isPending}
        onConfirm={() => closeMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}
