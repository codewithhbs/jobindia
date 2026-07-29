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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { driversApi } from "@/api/drivers.api";
import { initials, formatDate } from "@/lib/utils";

export default function DriversPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["drivers", { search, page }],
    queryFn: () => driversApi.list({ search, page, limit }).then((r) => r.data),
  });

  const drivers = data?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit };

  return (
    <div>
      <PageHeader title="Drivers" description="Manage driver accounts, vehicles and documents" />

      {isError && (
        <div className="mb-4 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning-foreground">
          Couldn't load drivers from <code className="font-mono">GET /drivers</code>. This endpoint needs the
          backend patch described in the README (admin driver routes) — apply it and restart the API.
        </div>
      )}

      <div className="mb-4">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name, phone…" />
      </div>

      <div className="rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : drivers.length === 0 ? (
          <EmptyState title="No drivers found" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>KYC</TableHead>
                <TableHead>Vehicle categories</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((d) => (
                <TableRow key={d._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{initials(d.userId?.name || d.userId?.phone || "?")}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{d.userId?.name || "Unnamed"}</p>
                        <p className="text-xs text-muted-foreground">{d.userId?.phone}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={d.userId?.kycStatus} /></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {(d.vehicleCategories || []).slice(0, 2).map((v, i) => <Badge key={i} variant="secondary">{v}</Badge>)}
                      {(d.vehicleCategories?.length || 0) === 0 && "—"}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{d.yearsOfExperience || 0} yrs</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(d.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon">
                      <Link to={`/drivers/${d.userId?._id || d.userId}`}><Eye className="h-4 w-4" /></Link>
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
