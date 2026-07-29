import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usersApi } from "@/api/users.api";
import { getErrorMessage } from "@/api/client";
import { initials, formatDateTime, resolveFileUrl } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/status-badge";

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => usersApi.getById(id).then((r) => r.data.data),
  });

  useEffect(() => {
    if (data?.user) {
      setForm({
        name: data.user.name || "",
        email: data.user.email || "",
        gender: data.user.gender || "",
        isActive: data.user.isActive,
        kycStatus: data.user.kycStatus || "not_submitted",
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (payload) => {
      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => v !== undefined && v !== null && fd.append(k, v));
      return usersApi.updateProfile(id, fd);
    },
    onSuccess: () => {
      toast.success("User updated");
      qc.invalidateQueries({ queryKey: ["user", id] });
      qc.invalidateQueries({ queryKey: ["users"] });
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

  const { user, profile } = data;

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <PageHeader
        title={user.name || "Unnamed user"}
        description={user.phone}
        actions={<Badge variant="outline" className="capitalize">{user.role}</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="pt-5 flex flex-col items-center text-center gap-3">
            <Avatar className="h-20 w-20">
              <AvatarImage src={resolveFileUrl(user.avatar)} />
              <AvatarFallback className="text-lg">{initials(user.name || user.phone)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{user.name || "Unnamed"}</p>
              <p className="text-sm text-muted-foreground">{user.phone}</p>
            </div>
            <div className="flex gap-2">
              <StatusBadge status={user.kycStatus} />
              <Badge variant={user.isActive ? "success" : "destructive"}>
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="w-full pt-3 border-t border-border mt-2 text-left text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Joined</span>
                <span>{formatDateTime(user.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last seen</span>
                <span>{formatDateTime(user.lastSeen)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">City</span>
                <span>{user.location?.city || "—"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Edit profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Full name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select value={form.gender || "unset"} onValueChange={(v) => setForm({ ...form, gender: v === "unset" ? "" : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">Not set</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>KYC status</Label>
                <Select value={form.kycStatus} onValueChange={(v) => setForm({ ...form, kycStatus: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_submitted">Not submitted</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="under_review">Under review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Account active</p>
                <p className="text-xs text-muted-foreground">Inactive users cannot log in</p>
              </div>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => mutation.mutate(form)}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {profile && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>
                {user.role === "driver" && "Driver profile"}
                {user.role === "employer" && "Employer profile"}
                {user.role === "jobseeker" && "Jobseeker profile"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted rounded-lg p-4 overflow-x-auto scrollbar-thin max-h-96">
                {JSON.stringify(profile, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
