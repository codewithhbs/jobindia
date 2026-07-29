import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { roleOptionsApi } from "@/api/admin.api";
import { getErrorMessage } from "@/api/client";

const EMPTY = { role: "", label: "", desc: "", icon: "briefcase-outline", order: 0, isActive: true };

export default function RoleOptionsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["role-options"],
    queryFn: () => roleOptionsApi.listAll().then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: () => (editing ? roleOptionsApi.update(editing._id, form) : roleOptionsApi.create(form)),
    onSuccess: () => {
      toast.success(editing ? "Role option updated" : "Role option created");
      qc.invalidateQueries({ queryKey: ["role-options"] });
      closeDialog();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => roleOptionsApi.remove(id),
    onSuccess: () => {
      toast.success("Role option deleted");
      qc.invalidateQueries({ queryKey: ["role-options"] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (o) => {
    setEditing(o);
    setForm({ role: o.role, label: o.label, desc: o.desc, icon: o.icon, order: o.order || 0, isActive: o.isActive });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(EMPTY); };

  const options = data || [];

  return (
    <div>
      <PageHeader
        title="Role Options"
        description="Roles shown on the app's sign-up / role-selection screen"
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" /> New role option</Button>}
      />

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : options.length === 0 ? (
        <EmptyState title="No role options configured" action={<Button size="sm" onClick={openCreate}>Add one</Button>} />
      ) : (
        <div className="space-y-3">
          {options.map((o) => (
            <Card key={o._id}>
              <CardContent className="p-4 flex items-center gap-4">
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium capitalize">{o.label}</p>
                    <Badge variant="outline" className="font-mono text-[10px]">{o.role}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{o.desc}</p>
                </div>
                <Badge variant={o.isActive ? "success" : "muted"}>{o.isActive ? "Active" : "Off"}</Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(o)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(o)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(v) => !v && closeDialog()}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit role option" : "New role option"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Role key</Label>
                <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="jobseeker" />
              </div>
              <div className="space-y-1.5">
                <Label>Display label</Label>
                <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Looking for a job" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Icon name</Label>
                <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Order</Label>
                <Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Active</span>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              {editing ? "Save changes" : "Create option"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete this role option?"
        confirmText="Delete"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}
