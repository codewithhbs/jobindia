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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { cmsApi } from "@/api/admin.api";
import { formatDate } from "@/lib/utils";
import { getErrorMessage } from "@/api/client";

const EMPTY = { slug: "", title: "", content: "" };

export default function CmsPagesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [isNew, setIsNew] = useState(true);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["cms-pages"],
    queryFn: () => cmsApi.list().then((r) => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: () => cmsApi.upsert(form),
    onSuccess: () => {
      toast.success("Page saved");
      qc.invalidateQueries({ queryKey: ["cms-pages"] });
      setDialogOpen(false);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const openCreate = () => { setForm(EMPTY); setIsNew(true); setDialogOpen(true); };
  const openEdit = async (page) => {
    setIsNew(false);
    setDialogOpen(true);
    setForm({ slug: page.slug, title: page.title, content: "" });
    try {
      const full = await cmsApi.getBySlug(page.slug);
      setForm({ slug: page.slug, title: full.data.data.title, content: full.data.data.content });
    } catch {
      /* keep partial */
    }
  };

  const pages = data || [];

  return (
    <div>
      <PageHeader
        title="CMS Pages"
        description="Static content pages (terms, privacy policy, about, etc.)"
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" /> New page</Button>}
      />

      <div className="rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : pages.length === 0 ? (
          <EmptyState title="No CMS pages yet" action={<Button size="sm" onClick={openCreate}>Create one</Button>} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Slug</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((p) => (
                <TableRow key={p._id}>
                  <TableCell className="font-mono text-sm">{p.slug}</TableCell>
                  <TableCell>{p.title}</TableCell>
                  <TableCell className="text-sm">v{p.version}</TableCell>
                  <TableCell><Badge variant={p.isActive ? "success" : "muted"}>{p.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(p.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isNew ? "New CMS page" : "Edit CMS page"}</DialogTitle>
            <DialogDescription>Content supports plain text or HTML markup</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  disabled={!isNew}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                  placeholder="privacy-policy"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Content</Label>
              <Textarea rows={12} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="font-mono text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>Save page</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
