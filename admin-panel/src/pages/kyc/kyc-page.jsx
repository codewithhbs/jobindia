import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Check, X, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { kycApi } from "@/api/kyc.api";
import { resolveFileUrl, formatDate } from "@/lib/utils";
import { getErrorMessage } from "@/api/client";

export default function KycPage() {
  const [userRole, setUserRole] = useState("");
  const [page, setPage] = useState(1);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewStatus, setReviewStatus] = useState("approved");
  const [adminNotes, setAdminNotes] = useState("");
  const limit = 20;
  const qc = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["kyc-stats"],
    queryFn: () => kycApi.stats().then((r) => r.data.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["kyc-pending", { userRole, page }],
    queryFn: () => kycApi.pending({ userRole, page, limit, status: "pending" }).then((r) => r.data),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ userId, status, adminNotes }) => kycApi.review(userId, { status, adminNotes }),
    onSuccess: () => {
      toast.success("KYC review submitted");
      qc.invalidateQueries({ queryKey: ["kyc-pending"] });
      qc.invalidateQueries({ queryKey: ["kyc-stats"] });
      setReviewTarget(null);
      setAdminNotes("");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const submissions = data?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit };

  return (
    <div>
      <PageHeader title="KYC Verification" description="Review submitted identity documents" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Pending" value={stats?.pending || 0} icon={FileText} />
        <StatCard label="Under review" value={stats?.under_review || 0} icon={FileText} accent="muted" />
        <StatCard label="Approved" value={stats?.approved || 0} icon={Check} accent="muted" />
        <StatCard label="Rejected" value={stats?.rejected || 0} icon={X} accent="muted" />
      </div>

      <div className="mb-4">
        <Select value={userRole || "all"} onValueChange={(v) => { setUserRole(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="All roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="jobseeker">Jobseeker</SelectItem>
            <SelectItem value="employer">Employer</SelectItem>
            <SelectItem value="driver">Driver</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : submissions.length === 0 ? (
          <EmptyState title="No pending KYC submissions" description="All caught up!" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User role</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((s) => (
                <TableRow key={s._id}>
                  <TableCell><Badge variant="outline" className="capitalize">{s.userRole}</Badge></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {(s.documents || []).map((doc) => (
                        <a
                          key={doc._id}
                          href={resolveFileUrl(doc.fileUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <FileText className="h-3 w-3" /> {doc.fieldName || doc.fieldId}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(s.submittedAt)}</TableCell>
                  <TableCell><StatusBadge status={s.overallStatus} /></TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => {
                        setReviewTarget(s);
                        setReviewStatus("approved");
                        setAdminNotes("");
                      }}
                    >
                      Review
                    </Button>
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

      <Dialog open={!!reviewTarget} onOpenChange={(v) => !v && setReviewTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review KYC submission</DialogTitle>
            <DialogDescription>Approve or reject this user's submitted documents</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(reviewTarget?.documents || []).map((doc) => (
                <a
                  key={doc._id}
                  href={resolveFileUrl(doc.fileUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
                >
                  <FileText className="h-3 w-3" /> {doc.fieldName || doc.fieldId}
                </a>
              ))}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Decision</label>
              <Select value={reviewStatus} onValueChange={setReviewStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approve</SelectItem>
                  <SelectItem value="rejected">Reject</SelectItem>
                  <SelectItem value="under_review">Mark under review</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Admin notes (optional)</label>
              <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Reason for rejection, notes for the user…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewTarget(null)}>Cancel</Button>
            <Button
              disabled={reviewMutation.isPending}
              onClick={() =>
                reviewMutation.mutate({ userId: reviewTarget.userId, status: reviewStatus, adminNotes })
              }
            >
              Submit review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
