import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send, Radio, Users, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { notificationsApi } from "@/api/notifications.api";
import { usersApi } from "@/api/users.api";
import { getErrorMessage } from "@/api/client";
import { initials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function SendToUserTab() {
  const [form, setForm] = useState({ userId: "", title: "", body: "", category: "general" });
  const mutation = useMutation({
    mutationFn: () => notificationsApi.send(form),
    onSuccess: () => { toast.success("Notification sent"); setForm({ userId: "", title: "", body: "", category: "general" }); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Send to a specific user</CardTitle><CardDescription>Enter the exact user ID</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5"><Label>User ID</Label><Input value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} placeholder="Mongo ObjectId" /></div>
        <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Body</Label><Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
        </Button>
      </CardContent>
    </Card>
  );
}

function BroadcastTab() {
  const [form, setForm] = useState({ title: "", body: "", targetRole: "all" });
  const mutation = useMutation({
    mutationFn: () => notificationsApi.broadcast(form.targetRole === "all" ? { title: form.title, body: form.body } : form),
    onSuccess: () => { toast.success("Broadcast queued"); setForm({ title: "", body: "", targetRole: "all" }); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Broadcast to a role</CardTitle><CardDescription>Sent to every active user in the selected audience</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Audience</Label>
          <Select value={form.targetRole} onValueChange={(v) => setForm({ ...form, targetRole: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Everyone</SelectItem>
              <SelectItem value="jobseeker">Jobseekers</SelectItem>
              <SelectItem value="employer">Employers</SelectItem>
              <SelectItem value="driver">Drivers</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Body</Label><Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />} Broadcast
        </Button>
      </CardContent>
    </Card>
  );
}

function SendToSelectedTab() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState({ title: "", body: "" });

  const { data } = useQuery({
    queryKey: ["users-fcm", { search, role }],
    queryFn: () => usersApi.withFcmToken({ search, role }).then((r) => r.data.data),
  });

  const mutation = useMutation({
    mutationFn: () => notificationsApi.sendBulk({ userIds: selected, title: form.title, body: form.body }),
    onSuccess: () => { toast.success("Notification queued"); setSelected([]); setForm({ title: "", body: "" }); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const users = data || [];
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select recipients ({selected.length})</CardTitle>
          <div className="flex gap-2 pt-2">
            <SearchInput value={search} onChange={setSearch} placeholder="Search users…" />
            <Select value={role || "all"} onValueChange={(v) => setRole(v === "all" ? "" : v)}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="jobseeker">Jobseeker</SelectItem>
                <SelectItem value="employer">Employer</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="max-h-96 overflow-y-auto scrollbar-thin space-y-1">
          {users.length === 0 ? (
            <EmptyState icon={Users} title="No users with push tokens found" />
          ) : (
            users.map((u) => (
              <label key={u._id} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent cursor-pointer">
                <Checkbox checked={selected.includes(u._id)} onCheckedChange={() => toggle(u._id)} />
                <Avatar className="h-7 w-7"><AvatarFallback>{initials(u.name || "?")}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{u.name || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground">{u.phone}</p>
                </div>
                <Badge variant="outline" className="capitalize text-[10px]">{u.role}</Badge>
              </label>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Compose message</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Body</Label><Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || selected.length === 0}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send to {selected.length} user{selected.length !== 1 && "s"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <div>
      <PageHeader title="Notifications" description="Send push notifications to users" />
      <Tabs defaultValue="selected">
        <TabsList>
          <TabsTrigger value="selected">Send to selected</TabsTrigger>
          <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
          <TabsTrigger value="single">Single user</TabsTrigger>
        </TabsList>
        <TabsContent value="selected"><SendToSelectedTab /></TabsContent>
        <TabsContent value="broadcast"><BroadcastTab /></TabsContent>
        <TabsContent value="single"><SendToUserTab /></TabsContent>
      </Tabs>
    </div>
  );
}
