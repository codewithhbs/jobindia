import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usersApi } from "@/api/users.api";
import { initials, formatDate, titleCase } from "@/lib/utils";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/api/client";

const ROLES = ["jobseeker", "employer", "driver", "admin", "superadmin"];

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [kycStatus, setKycStatus] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["users", { search, role, kycStatus, page }],
    queryFn: () =>
      usersApi
        .list({ search, role, kycStatus, page, limit })
        .then((r) => r.data),
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, isActive }) => usersApi.updateStatus(id, isActive),
    onSuccess: () => {
      toast.success("User status updated");
      qc.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const users = data?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit };

  return (
    <div>
      <PageHeader title="Users" description="Manage all platform accounts" />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name, phone, email…" />
        <Select value={role || "all"} onValueChange={(v) => { setRole(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>{titleCase(r)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={kycStatus || "all"} onValueChange={(v) => { setKycStatus(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All KYC status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All KYC status</SelectItem>
            <SelectItem value="not_submitted">Not submitted</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="under_review">Under review</SelectItem>
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
        ) : users.length === 0 ? (
          <EmptyState title="No users found" description="Try adjusting your filters" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>KYC</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{initials(u.name || u.phone)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{u.name || "Unnamed"}</p>
                        <p className="text-xs text-muted-foreground">{u.phone}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{u.role}</Badge></TableCell>
                  <TableCell><StatusBadge status={u.kycStatus} /></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(u.createdAt)}</TableCell>
                  <TableCell>
                    <Switch
                      checked={u.isActive}
                      onCheckedChange={(checked) => toggleStatus.mutate({ id: u._id, isActive: checked })}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon">
                      <Link to={`/users/${u._id}`}><Eye className="h-4 w-4" /></Link>
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
