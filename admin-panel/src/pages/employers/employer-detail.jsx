import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2, Check, X, FileText, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { ImageUploadField } from "@/components/shared/image-upload-field";
import { employersApi } from "@/api/employers.api";
import { getErrorMessage } from "@/api/client";
import { resolveFileUrl } from "@/lib/utils";

const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"];
const SUBSCRIPTION_PLANS = ["free", "premium", "enterprise"];

export default function EmployerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(null);
  const [logo, setLogo] = useState(null);
  const [docReviews, setDocReviews] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ["employer", id],
    queryFn: () => employersApi.getById(id).then((r) => r.data.data),
  });

  useEffect(() => {
    if (data) {
      setForm({
        companyName: data.companyName || "",
        industry: data.industry || "",
        companySize: data.companySize || "",
        website: data.website || "",
        description: data.description || "",
        foundedYear: data.foundedYear || "",
        gstNumber: data.gstNumber || "",
        panNumber: data.panNumber || "",
        contactName: data.contactPerson?.name || "",
        contactDesignation: data.contactPerson?.designation || "",
        contactEmail: data.contactPerson?.email || "",
        contactPhone: data.contactPerson?.phone || "",
        street: data.address?.street || "",
        city: data.address?.city || "",
        state: data.address?.state || "",
        country: data.address?.country || "India",
        pincode: data.address?.pincode || "",
        subscriptionPlan: data.subscriptionPlan || "free",
        subscriptionExpiry: data.subscriptionExpiry ? new Date(data.subscriptionExpiry).toISOString().slice(0, 10) : "",
        jobPostLimit: data.jobPostLimit ?? 3,
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append("companyName", form.companyName);
      fd.append("industry", form.industry);
      if (form.companySize) fd.append("companySize", form.companySize);
      fd.append("website", form.website);
      fd.append("description", form.description);
      if (form.foundedYear) fd.append("foundedYear", form.foundedYear);
      fd.append("gstNumber", form.gstNumber);
      fd.append("panNumber", form.panNumber);
      fd.append("contactPerson", JSON.stringify({
        name: form.contactName, designation: form.contactDesignation,
        email: form.contactEmail, phone: form.contactPhone,
      }));
      fd.append("address", JSON.stringify({
        street: form.street, city: form.city, state: form.state, country: form.country, pincode: form.pincode,
      }));
      fd.append("subscriptionPlan", form.subscriptionPlan);
      if (form.subscriptionExpiry) fd.append("subscriptionExpiry", form.subscriptionExpiry);
      fd.append("jobPostLimit", form.jobPostLimit);
      if (logo) fd.append("companyLogo", logo);
      const reviews = Object.entries(docReviews).map(([documentId, status]) => ({ documentId, status }));
      if (reviews.length) fd.append("documentReviews", JSON.stringify(reviews));
      return employersApi.update(id, fd);
    },
    onSuccess: () => {
      toast.success("Employer profile updated");
      setDocReviews({});
      qc.invalidateQueries({ queryKey: ["employer", id] });
      qc.invalidateQueries({ queryKey: ["employers"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const verifyMutation = useMutation({
    mutationFn: (status) => employersApi.verify(id, status),
    onSuccess: () => {
      toast.success("Verification updated");
      qc.invalidateQueries({ queryKey: ["employer", id] });
      qc.invalidateQueries({ queryKey: ["employers"] });
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

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <PageHeader
        title={data.companyName || "Employer profile"}
        description={`Job post limit: ${data.jobPostLimit} · ${data.activeJobs || 0} active jobs · ${data.totalJobsPosted || 0} total posted`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={data.verificationStatus} />
            {data.verificationStatus !== "approved" && (
              <Button size="sm" variant="outline" onClick={() => verifyMutation.mutate("approved")}>
                <Check className="h-4 w-4" /> Approve
              </Button>
            )}
            {data.verificationStatus !== "rejected" && (
              <Button size="sm" variant="outline" onClick={() => verifyMutation.mutate("rejected")}>
                <X className="h-4 w-4" /> Reject
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="pt-5 space-y-4">
            <ImageUploadField value={logo} onChange={setLogo} existingUrl={data.companyLogo} label="Company logo" />
            <div className="space-y-1.5">
              <Label>Subscription plan</Label>
              <Select value={form.subscriptionPlan} onValueChange={(v) => setForm({ ...form, subscriptionPlan: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUBSCRIPTION_PLANS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Subscription expiry</Label>
              <Input type="date" value={form.subscriptionExpiry} onChange={(e) => setForm({ ...form, subscriptionExpiry: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Job post limit</Label>
              <Input type="number" value={form.jobPostLimit} onChange={(e) => setForm({ ...form, jobPostLimit: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Company details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Company name</Label><Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Industry</Label><Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} /></div>
              <div className="space-y-1.5">
                <Label>Company size</Label>
                <Select value={form.companySize || undefined} onValueChange={(v) => setForm({ ...form, companySize: v })}>
                  <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                  <SelectContent>{COMPANY_SIZES.map((s) => <SelectItem key={s} value={s}>{s} employees</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Founded year</Label><Input type="number" value={form.foundedYear} onChange={(e) => setForm({ ...form, foundedYear: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>GST number</Label><Input value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>PAN number</Label><Input value={form.panNumber} onChange={(e) => setForm({ ...form, panNumber: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="pt-2 border-t border-border">
              <p className="text-sm font-medium mb-3">Contact person</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Name</Label><Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Designation</Label><Input value={form.contactDesignation} onChange={(e) => setForm({ ...form, contactDesignation: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Email</Label><Input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Phone</Label><Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} /></div>
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <p className="text-sm font-medium mb-3">Registered address</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2"><Label>Street</Label><Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>State</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Country</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Pincode</Label><Input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} /></div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save changes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Verification documents</CardTitle></CardHeader>
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
