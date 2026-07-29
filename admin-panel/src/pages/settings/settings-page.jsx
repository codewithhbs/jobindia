import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { settingsApi } from "@/api/admin.api";
import { getErrorMessage } from "@/api/client";

const EMPTY = { key: "", value: "", type: "string", category: "general", description: "", isPublic: false };

export default function SettingsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.list({}).then((r) => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => settingsApi.upsert(payload),
    onSuccess: () => {
      toast.success("Setting saved");
      qc.invalidateQueries({ queryKey: ["settings"] });
      setDialogOpen(false);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const openCreate = () => { setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (s) => {
    setForm({
      key: s.key,
      value: typeof s.value === "object" ? JSON.stringify(s.value) : String(s.value),
      type: s.type, category: s.category || "general", description: s.description || "", isPublic: s.isPublic,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    let value = form.value;
    if (form.type === "number") value = Number(value);
    else if (form.type === "boolean") value = value === "true" || value === true;
    else if (form.type === "json" || form.type === "array") {
      try { value = JSON.parse(value); } catch { return toast.error("Invalid JSON value"); }
    }
    saveMutation.mutate({ ...form, value });
  };

  const settings = data || [];

  return (
    <div>
      <PageHeader
        title="App Settings"
        description="Key-value configuration used across the platform"
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" /> New setting</Button>}
      />

      <div className="rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : settings.length === 0 ? (
          <EmptyState title="No settings configured yet" action={<Button size="sm" onClick={openCreate}>Add one</Button>} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Public</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.map((s) => (
                <TableRow key={s._id}>
                  <TableCell className="font-mono text-sm">{s.key}</TableCell>
                  <TableCell className="text-sm max-w-xs truncate">
                    {typeof s.value === "object" ? JSON.stringify(s.value) : String(s.value)}
                  </TableCell>
                  <TableCell><Badge variant="outline">{s.type}</Badge></TableCell>
                  <TableCell className="text-sm">{s.category}</TableCell>
                  <TableCell>{s.isPublic ? <Badge variant="success">Public</Badge> : <Badge variant="muted">Private</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setting</DialogTitle>
            <DialogDescription>Settings marked "public" are visible to the mobile app without auth</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Key</Label>
              <Input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} placeholder="app_min_version" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="array">Array</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Value</Label>
              <Input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder={form.type === "boolean" ? "true / false" : ""} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Public (visible without auth)</span>
              <Switch checked={form.isPublic} onCheckedChange={(v) => setForm({ ...form, isPublic: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button disabled={saveMutation.isPending} onClick={handleSave}>Save setting</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
