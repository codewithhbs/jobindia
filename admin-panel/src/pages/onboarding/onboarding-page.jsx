import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ImageUploadField } from "@/components/shared/image-upload-field";
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
import { onboardingApi } from "@/api/admin.api";
import { resolveFileUrl } from "@/lib/utils";
import { getErrorMessage } from "@/api/client";

const EMPTY = { title: "", description: "", order: 0, isActive: true };

export default function OnboardingPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [image, setImage] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["onboarding"],
    queryFn: () => onboardingApi.list().then((r) => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (image) fd.append("onboardImage", image);
      return editing ? onboardingApi.update(editing._id, fd) : onboardingApi.create(fd);
    },
    onSuccess: () => {
      toast.success(editing ? "Screen updated" : "Screen created");
      qc.invalidateQueries({ queryKey: ["onboarding"] });
      closeDialog();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => onboardingApi.remove(id),
    onSuccess: () => {
      toast.success("Screen deleted");
      qc.invalidateQueries({ queryKey: ["onboarding"] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY); setImage(null); setDialogOpen(true); };
  const openEdit = (s) => {
    setEditing(s);
    setForm({ title: s.title, description: s.description || "", order: s.order || 0, isActive: s.isActive });
    setImage(null);
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(EMPTY); setImage(null); };

  const screens = data || [];

  return (
    <div>
      <PageHeader
        title="Onboarding Screens"
        description="Screens shown to new users on first app launch"
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" /> New screen</Button>}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      ) : screens.length === 0 ? (
        <EmptyState title="No onboarding screens yet" action={<Button size="sm" onClick={openCreate}>Create one</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {screens.map((s) => (
            <Card key={s._id} className="overflow-hidden">
              <div className="h-36 bg-muted">
                {s.image && <img src={resolveFileUrl(s.image)} alt={s.title} className="h-full w-full object-cover" />}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{s.description}</p>
                  </div>
                  <Badge variant={s.isActive ? "success" : "muted"} className="shrink-0">{s.isActive ? "Active" : "Off"}</Badge>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <GripVertical className="h-3 w-3" /> Order {s.order}
                  </span>
                  <div className="space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(s)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(v) => !v && closeDialog()}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit screen" : "New onboarding screen"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <ImageUploadField value={image} onChange={setImage} existingUrl={editing?.image} label="Screen image" />
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Order</Label>
                <Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 mt-6">
                <span className="text-sm">Active</span>
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              {editing ? "Save changes" : "Create screen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete this screen?"
        confirmText="Delete"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}
