import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2, FileText, Check, X, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChipMultiSelect } from "@/components/shared/chip-multi-select";
import { StatusBadge } from "@/components/shared/status-badge";
import { driversApi } from "@/api/drivers.api";
import { getErrorMessage } from "@/api/client";
import { initials, resolveFileUrl, formatDate } from "@/lib/utils";
import { VEHICLE_TYPE_OPTIONS } from "@/config/options";

export default function DriverDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(null);
  const [docReviews, setDocReviews] = useState({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ["driver", id],
    queryFn: () => driversApi.getById(id).then((r) => r.data.data),
  });

  useEffect(() => {
    if (data) {
      setForm({
        aadharNumber: data.aadharNumber || "",
        panNumber: data.panNumber || "",
        licenseNumber: data.licenseNumber || "",
        licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry).toISOString().slice(0, 10) : "",
        yearsOfExperience: data.yearsOfExperience || 0,
        currentSalary: data.currentSalary || "",
        expectedSalary: data.expectedSalary || "",
        isBikeAvailable: !!data.isBikeAvailable,
        dutyType: data.dutyType || "",
        vehicleCategories: data.vehicleCategories || [],
        preferredCategories: data.preferredCategories || [],
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (Array.isArray(v)) fd.append(k, JSON.stringify(v));
        else if (v !== undefined && v !== null) fd.append(k, v);
      });
      const reviews = Object.entries(docReviews).map(([documentId, status]) => ({ documentId, status }));
      if (reviews.length) fd.append("documentReviews", JSON.stringify(reviews));
      return driversApi.update(id, fd);
    },
    onSuccess: () => {
      toast.success("Driver profile updated");
      setDocReviews({});
      qc.invalidateQueries({ queryKey: ["driver", id] });
      qc.invalidateQueries({ queryKey: ["drivers"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isError) {
    return (
      <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm">
        Couldn't load this driver. This page needs the backend patch (admin driver routes) described in the README —
        apply it and restart the API, then retry.
      </div>
    );
  }

  if (isLoading || !form) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const user = data.userId;

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <PageHeader title={user?.name || "Driver profile"} description={user?.phone} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="pt-5 flex flex-col items-center text-center gap-3">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-lg">{initials(user?.name || user?.phone)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{user?.name || "Unnamed"}</p>
              <p className="text-sm text-muted-foreground">{user?.phone}</p>
            </div>
            <StatusBadge status={user?.kycStatus} />
            <div className="w-full pt-3 border-t border-border mt-2 text-left text-sm space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Joined</span><span>{formatDate(data.createdAt)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">City</span><span>{user?.location?.city || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Account</span><span>{user?.isActive ? "Active" : "Inactive"}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Driver profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Aadhaar number</Label><Input value={form.aadharNumber} onChange={(e) => setForm({ ...form, aadharNumber: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>PAN number</Label><Input value={form.panNumber} onChange={(e) => setForm({ ...form, panNumber: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Driving license number</Label><Input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>License expiry</Label><Input type="date" value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Years of experience</Label><Input type="number" value={form.yearsOfExperience} onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Duty type</Label><Input value={form.dutyType} onChange={(e) => setForm({ ...form, dutyType: e.target.value })} placeholder="e.g. full-time, part-time" /></div>
              <div className="space-y-1.5"><Label>Current salary</Label><Input value={form.currentSalary} onChange={(e) => setForm({ ...form, currentSalary: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Expected salary</Label><Input value={form.expectedSalary} onChange={(e) => setForm({ ...form, expectedSalary: e.target.value })} /></div>
            </div>

            <div className="space-y-1.5">
              <Label>Vehicle categories</Label>
              <ChipMultiSelect options={VEHICLE_TYPE_OPTIONS} value={form.vehicleCategories} onChange={(v) => setForm({ ...form, vehicleCategories: v })} />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <p className="text-sm font-medium">Bike available</p>
              <Switch checked={form.isBikeAvailable} onCheckedChange={(v) => setForm({ ...form, isBikeAvailable: v })} />
            </div>

            <div className="flex justify-end">
              <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save changes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
          <CardContent>
            {(data.documents || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
            ) : (
              <div className="space-y-2">
                {data.documents.map((doc) => {
                  const pendingReview = docReviews[doc._id];
                  const effectiveStatus = pendingReview || doc.verificationStatus;
                  return (
                    <div key={doc._id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
                      <a
                        href={resolveFileUrl(doc.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4" /> {doc.fieldName || doc.fieldId} <ExternalLink className="h-3 w-3" />
                      </a>
                      <StatusBadge status={effectiveStatus} />
                      <div className="ml-auto flex gap-1">
                        <Button
                          size="sm"
                          variant={effectiveStatus === "approved" ? "success" : "outline"}
                          onClick={() => setDocReviews({ ...docReviews, [doc._id]: "approved" })}
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant={effectiveStatus === "rejected" ? "destructive" : "outline"}
                          onClick={() => setDocReviews({ ...docReviews, [doc._id]: "rejected" })}
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {Object.keys(docReviews).length > 0 && (
                  <div className="flex justify-end pt-2">
                    <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                      {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save document review
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
