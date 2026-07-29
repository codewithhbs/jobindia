import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ImageUploadField } from "@/components/shared/image-upload-field";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { slidersApi } from "@/api/admin.api";
import { resolveFileUrl } from "@/lib/utils";
import { getErrorMessage } from "@/api/client";

const EMPTY = { title: "", subtitle: "", type: "jobseeker", redirectType: "none", redirectValue: "", order: 0, isActive: true };

export default function SlidersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [image, setImage] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["sliders"],
    queryFn: () => slidersApi.list().then((r) => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (image) fd.append("image", image);
      return editing ? slidersApi.update(editing._id, fd) : slidersApi.create(fd);
    },
    onSuccess: () => {
      toast.success(editing ? "Slider updated" : "Slider created");
      qc.invalidateQueries({ queryKey: ["sliders"] });
      closeDialog();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => slidersApi.remove(id),
    onSuccess: () => {
      toast.success("Slider deleted");
      qc.invalidateQueries({ queryKey: ["sliders"] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY); setImage(null); setDialogOpen(true); };
  const openEdit = (s) => {
    setEditing(s);
    setForm({
      title: s.title || "", subtitle: s.subtitle || "", type: s.type || "jobseeker",
      redirectType: s.redirectType || "none", redirectValue: s.redirectValue || "",
      order: s.order || 0, isActive: s.isActive,
    });
    setImage(null);
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(EMPTY); setImage(null); };

  const sliders = data || [];

  return (
    <div>
      <PageHeader
        title="Home Sliders"
        description="Promotional banners shown on the app home screen"
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" /> New slider</Button>}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
      ) : sliders.length === 0 ? (
        <EmptyState title="No sliders yet" action={<Button size="sm" onClick={openCreate}>Create one</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sliders.map((s) => (
            <Card key={s._id} className="overflow-hidden">
              <div className="h-32 bg-muted">
                <img src={resolveFileUrl(s.image)} alt={s.title} className="h-full w-full object-cover" />
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{s.title || "Untitled"}</p>
                    <p className="text-xs text-muted-foreground capitalize">{s.type} · order {s.order}</p>
                  </div>
                  <Badge variant={s.isActive ? "success" : "muted"}>{s.isActive ? "Active" : "Off"}</Badge>
                </div>
                <div className="flex justify-end gap-1 mt-3">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(s)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(v) => !v && closeDialog()}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit slider" : "New slider"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <ImageUploadField value={image} onChange={setImage} existingUrl={editing?.image} label="Banner image" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Subtitle</Label>
                <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Audience</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jobseeker">Jobseeker</SelectItem>
                    <SelectItem value="driver">Driver</SelectItem>
                    <SelectItem value="employer">Employer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Redirect type</Label>
                <Select value={form.redirectType} onValueChange={(v) => setForm({ ...form, redirectType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="job">Job</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="external">External URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.redirectType !== "none" && (
              <div className="space-y-1.5">
                <Label>Redirect value (job/category ID or URL)</Label>
                <Input value={form.redirectValue} onChange={(e) => setForm({ ...form, redirectValue: e.target.value })} />
              </div>
            )}
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
              {editing ? "Save changes" : "Create slider"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete this slider?"
        confirmText="Delete"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}
