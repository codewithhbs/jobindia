import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Eye, Check, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { employersApi } from "@/api/employers.api";
import { initials } from "@/lib/utils";
import { getErrorMessage } from "@/api/client";

export default function EmployersPage() {
  const [verificationStatus, setVerificationStatus] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["employers", { verificationStatus, page }],
    queryFn: () => employersApi.list({ verificationStatus, page, limit }).then((r) => r.data),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, status }) => employersApi.verify(id, status),
    onSuccess: () => {
      toast.success("Employer verification updated");
      qc.invalidateQueries({ queryKey: ["employers"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const employers = data?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit };

  return (
    <div>
      <PageHeader title="Employers" description="Manage company profiles and verification" />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Select value={verificationStatus || "all"} onValueChange={(v) => { setVerificationStatus(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Verification status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="not_submitted">Not submitted</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : employers.length === 0 ? (
          <EmptyState title="No employers found" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Jobs</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employers.map((e) => (
                <TableRow key={e._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{initials(e.companyName || e.userId?.name || "?")}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{e.companyName || "Unnamed company"}</p>
                        <p className="text-xs text-muted-foreground">{e.industry || "—"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <p>{e.userId?.name}</p>
                    <p className="text-xs text-muted-foreground">{e.userId?.phone}</p>
                  </TableCell>
                  <TableCell><span className="capitalize">{e.subscriptionPlan}</span></TableCell>
                  <TableCell className="text-sm">{e.activeJobs || 0} / {e.totalJobsPosted || 0}</TableCell>
                  <TableCell><StatusBadge status={e.verificationStatus} /></TableCell>
                  <TableCell className="text-right space-x-1">
                    {e.verificationStatus === "pending" && (
                      <>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => verifyMutation.mutate({ id: e.userId?._id || e.userId, status: "approved" })}
                        >
                          <Check className="h-4 w-4 text-success" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => verifyMutation.mutate({ id: e.userId?._id || e.userId, status: "rejected" })}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                    <Button asChild variant="ghost" size="icon">
                      <Link to={`/employers/${e.userId?._id || e.userId}`}><Eye className="h-4 w-4" /></Link>
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
    </div>
  );
}
