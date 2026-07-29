import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { jobseekersApi } from "@/api/jobseekers.api";
import { initials } from "@/lib/utils";

export default function JobseekersPage() {
  const [skill, setSkill] = useState("");
  const [openToWork, setOpenToWork] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["jobseekers", { skill, openToWork, page }],
    queryFn: () => jobseekersApi.search({ skill, openToWork, page, limit }).then((r) => r.data),
  });

  const candidates = data?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit };

  return (
    <div>
      <PageHeader title="Jobseekers" description="Search and manage candidate profiles" />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput value={skill} onChange={(v) => { setSkill(v); setPage(1); }} placeholder="Search by skill…" />
        <Select value={openToWork || "all"} onValueChange={(v) => { setOpenToWork(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Open to work" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All candidates</SelectItem>
            <SelectItem value="true">Open to work</SelectItem>
            <SelectItem value="false">Not looking</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : candidates.length === 0 ? (
          <EmptyState title="No candidates found" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Profile</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((c) => (
                <TableRow key={c._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{initials(c.userId?.name || "?")}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{c.userId?.name || "Unnamed"}</p>
                        <p className="text-xs text-muted-foreground">{c.userId?.phone}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {(c.skills || []).slice(0, 3).map((s, i) => (
                        <Badge key={i} variant="secondary">{s}</Badge>
                      ))}
                      {(c.skills?.length || 0) > 3 && (
                        <Badge variant="muted">+{c.skills.length - 3}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {c.totalExperienceMonths ? `${Math.round(c.totalExperienceMonths / 12)} yrs` : "Fresher"}
                  </TableCell>
                  <TableCell className="w-32">
                    <div className="flex items-center gap-2">
                      <Progress value={c.profileCompleteness || 0} className="h-1.5" />
                      <span className="text-xs text-muted-foreground shrink-0">{c.profileCompleteness || 0}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.isOpenToWork ? "success" : "muted"}>
                      {c.isOpenToWork ? "Open to work" : "Not looking"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon">
                      <Link to={`/jobseekers/${c.userId?._id || c.userId}`}><Eye className="h-4 w-4" /></Link>
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
