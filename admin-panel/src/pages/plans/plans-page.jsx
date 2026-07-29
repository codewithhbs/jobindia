import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Check } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { plansApi } from "@/api/admin.api";
import { formatCurrency } from "@/lib/utils";
import { getErrorMessage } from "@/api/client";

const EMPTY = { name: "", slug: "", price: 0, duration: 30, jobPostLimit: 3, isActive: true, isPopular: false };

export default function PlansPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: () => plansApi.list().then((r) => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: () => plansApi.upsert(form),
    onSuccess: () => {
      toast.success("Plan saved");
      qc.invalidateQueries({ queryKey: ["plans"] });
      setDialogOpen(false);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name, slug: p.slug, price: p.price, duration: p.duration,
      jobPostLimit: p.jobPostLimit, isActive: p.isActive, isPopular: p.isPopular,
    });
    setDialogOpen(true);
  };

  const plans = data || [];

  return (
    <div>
      <PageHeader
        title="Subscription Plans"
        description="Employer subscription tiers and job posting limits"
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" /> New plan</Button>}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}</div>
      ) : plans.length === 0 ? (
        <EmptyState title="No plans yet" action={<Button size="sm" onClick={openCreate}>Create one</Button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((p) => (
            <Card key={p._id} className="relative">
              {p.isPopular && <Badge variant="warning" className="absolute -top-2 right-4">Popular</Badge>}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {p.name}
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{formatCurrency(p.price)}<span className="text-sm text-muted-foreground font-normal">/{p.duration}d</span></p>
                <div className="mt-3 space-y-1.5 text-sm">
                  <p className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> {p.jobPostLimit} active job posts</p>
                  {(p.features || []).map((f, i) => (
                    <p key={i} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> {f.label}</p>
                  ))}
                </div>
                <Badge variant={p.isActive ? "success" : "muted"} className="mt-3">{p.isActive ? "Active" : "Inactive"}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit plan" : "New plan"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input value={form.slug} disabled={!!editing} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Price (INR)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Duration (days)</Label>
                <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Job post limit</Label>
                <Input type="number" value={form.jobPostLimit} onChange={(e) => setForm({ ...form, jobPostLimit: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Popular plan</span>
              <Switch checked={form.isPopular} onCheckedChange={(v) => setForm({ ...form, isPopular: v })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Active</span>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>Save plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
