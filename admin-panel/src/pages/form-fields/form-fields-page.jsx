import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
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
import { formFieldsApi } from "@/api/admin.api";
import { getErrorMessage } from "@/api/client";

const FIELD_TYPES = ["text", "number", "email", "phone", "date", "file", "image", "select", "multiselect", "radio", "checkbox", "textarea"];
const FORM_TYPES = ["registration", "profile", "kyc", "job_posting"];
const AUDIENCES = ["jobseeker", "driver", "employer", "all"];

const EMPTY = {
  fieldId: "", label: "", type: "text", placeholder: "", helpText: "",
  formType: "profile", assignedTo: ["all"], section: "basic", order: 0, isActive: true,
};

export default function FormFieldsPage() {
  const [formType, setFormType] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["form-fields", formType],
    queryFn: () => formFieldsApi.list({ formType, isActive: undefined }).then((r) => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: () => (editing ? formFieldsApi.update(editing._id, form) : formFieldsApi.create(form)),
    onSuccess: () => {
      toast.success(editing ? "Field updated" : "Field created");
      qc.invalidateQueries({ queryKey: ["form-fields"] });
      closeDialog();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => formFieldsApi.remove(id),
    onSuccess: () => {
      toast.success("Field deactivated");
      qc.invalidateQueries({ queryKey: ["form-fields"] });
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (f) => {
    setEditing(f);
    setForm({
      fieldId: f.fieldId, label: f.label, type: f.type, placeholder: f.placeholder || "",
      helpText: f.helpText || "", formType: f.formType, assignedTo: f.assignedTo?.length ? f.assignedTo : ["all"],
      section: f.section || "basic", order: f.order || 0, isActive: f.isActive,
    });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm(EMPTY); };

  const fields = data || [];

  return (
    <div>
      <PageHeader
        title="Dynamic Form Fields"
        description="Custom fields shown on registration, profile, KYC and job-posting forms"
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" /> New field</Button>}
      />

      <div className="mb-4">
        <Select value={formType || "all"} onValueChange={(v) => setFormType(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="All form types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All form types</SelectItem>
            {FORM_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : fields.length === 0 ? (
          <EmptyState title="No fields configured yet" action={<Button size="sm" onClick={openCreate}>Add one</Button>} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Field</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Form</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((f) => (
                <TableRow key={f._id}>
                  <TableCell>
                    <p className="font-medium">{f.label}</p>
                    <p className="text-xs text-muted-foreground font-mono">{f.fieldId}</p>
                  </TableCell>
                  <TableCell><Badge variant="outline">{f.type}</Badge></TableCell>
                  <TableCell className="text-sm capitalize">{f.formType?.replace("_", " ")}</TableCell>
                  <TableCell className="text-sm capitalize">{(f.assignedTo || []).join(", ")}</TableCell>
                  <TableCell><Badge variant={f.isActive ? "success" : "muted"}>{f.isActive ? "Active" : "Off"}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(f)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(f)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(v) => !v && closeDialog()}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit field" : "New form field"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Field ID</Label>
                <Input value={form.fieldId} disabled={!!editing} onChange={(e) => setForm({ ...form, fieldId: e.target.value })} placeholder="alt_phone" />
              </div>
              <div className="space-y-1.5">
                <Label>Label</Label>
                <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Field type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Form type</Label>
                <Select value={form.formType} onValueChange={(v) => setForm({ ...form, formType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FORM_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Audience</Label>
                <Select value={form.assignedTo[0]} onValueChange={(v) => setForm({ ...form, assignedTo: [v] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AUDIENCES.map((a) => <SelectItem key={a} value={a} className="capitalize">{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Order</Label>
                <Input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Placeholder</Label>
              <Input value={form.placeholder} onChange={(e) => setForm({ ...form, placeholder: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Help text</Label>
              <Input value={form.helpText} onChange={(e) => setForm({ ...form, helpText: e.target.value })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Active</span>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              {editing ? "Save changes" : "Create field"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Deactivate this field?"
        description="The field will be hidden from all forms but not permanently deleted."
        confirmText="Deactivate"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  );
}
