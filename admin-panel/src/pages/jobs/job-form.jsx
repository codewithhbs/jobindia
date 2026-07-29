import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TagInput } from "@/components/shared/tag-input";
import { ChipMultiSelect } from "@/components/shared/chip-multi-select";
import { jobsApi } from "@/api/jobs.api";
import { categoriesApi } from "@/api/admin.api";
import { getErrorMessage } from "@/api/client";
import {
  JOB_TYPES, EXPERIENCE_UNITS, GENDER_OPTIONS, WORK_LOCATION_TYPES,
  SHIFT_TIMES, WORKING_DAYS, INTERVIEW_TYPES, MARITAL_OPTIONS, JOB_STATUSES,
  VEHICLE_TYPE_OPTIONS, LICENSE_TYPE_OPTIONS,
} from "@/config/options";

const toLocalInput = (d) => (d ? new Date(d).toISOString().slice(0, 16) : "");
const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

const EMPTY = {
  title: "", description: "", employerName: "", companyName: "", companyLogo: "",
  category: "", subCategory: "", jobType: "full_time",

  salary: { min: "", max: "", currency: "INR", period: "monthly", isNegotiable: false, isHidden: false, incentiveAvailable: false, incentiveDescription: "" },

  location: { address: "", city: "", state: "", country: "India", pincode: "", isRemote: false, latitude: "", longitude: "" },

  workLocationType: "work_from_office",
  shiftTime: "day",
  workingDays: "6_days",
  interviewType: "in_person",
  joiningFeeRequired: false,
  joiningFeeDescription: "",
  maritalStatus: "both",
  callTimeStart: "",
  callTimeEnd: "",

  requirements: {
    experience: { min: 0, max: "", unit: "years", isFresher: false },
    education: "", skills: [], languages: [], licenseRequired: false, licenseType: [],
    vehicleRequired: false, vehicleType: [], gender: "any", ageMin: "", ageMax: "",
  },

  vacancies: 1,
  applicationDeadline: "",
  expiryDate: "",

  tags: [],
  benefits: [],

  status: "paused",
  isFeatured: false,
  featuredUntil: "",
  featuredOrder: "",
};

export default function JobFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);

  const { data: categories } = useQuery({
    queryKey: ["categories", "for-job-form"],
    queryFn: () => categoriesApi.list({ isActive: true }).then((r) => r.data.data),
  });

  const { data: existing, isLoading } = useQuery({
    queryKey: ["job-full", id],
    queryFn: () => jobsApi.getFullById(id).then((r) => r.data.data.job),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title || "",
        description: existing.description || "",
        employerName: existing.employerName || "",
        companyName: existing.companyName || "",
        companyLogo: existing.companyLogo || "",
        category: existing.category || "",
        subCategory: existing.subCategory || "",
        jobType: existing.jobType || "full_time",
        salary: {
          min: existing.salary?.min ?? "", max: existing.salary?.max ?? "",
          currency: existing.salary?.currency || "INR", period: existing.salary?.period || "monthly",
          isNegotiable: !!existing.salary?.isNegotiable, isHidden: !!existing.salary?.isHidden,
          incentiveAvailable: !!existing.salary?.incentiveAvailable, incentiveDescription: existing.salary?.incentiveDescription || "",
        },
        location: {
          address: existing.location?.address || "", city: existing.location?.city || "",
          state: existing.location?.state || "", country: existing.location?.country || "India",
          pincode: existing.location?.pincode || "", isRemote: !!existing.location?.isRemote,
          latitude: existing.location?.coordinates?.[1] ?? "", longitude: existing.location?.coordinates?.[0] ?? "",
        },
        workLocationType: existing.workLocationType || "work_from_office",
        shiftTime: existing.shiftTime || "day",
        workingDays: existing.workingDays || "6_days",
        interviewType: existing.interviewType || "in_person",
        joiningFeeRequired: !!existing.joiningFeeRequired,
        joiningFeeDescription: existing.joiningFeeDescription || "",
        maritalStatus: existing.maritalStatus || "both",
        callTimeStart: toLocalInput(existing.callTimeStart),
        callTimeEnd: toLocalInput(existing.callTimeEnd),
        requirements: {
          experience: {
            min: existing.requirements?.experience?.min ?? 0,
            max: existing.requirements?.experience?.max ?? "",
            unit: existing.requirements?.experience?.unit || "years",
            isFresher: !!existing.requirements?.experience?.isFresher,
          },
          education: existing.requirements?.education || "",
          skills: existing.requirements?.skills || [],
          languages: existing.requirements?.languages || [],
          licenseRequired: !!existing.requirements?.licenseRequired,
          licenseType: existing.requirements?.licenseType || [],
          vehicleRequired: !!existing.requirements?.vehicleRequired,
          vehicleType: existing.requirements?.vehicleType || [],
          gender: existing.requirements?.gender || "any",
          ageMin: existing.requirements?.ageMin ?? "",
          ageMax: existing.requirements?.ageMax ?? "",
        },
        vacancies: existing.vacancies ?? 1,
        applicationDeadline: toDateInput(existing.applicationDeadline),
        expiryDate: toDateInput(existing.expiryDate),
        tags: existing.tags || [],
        benefits: existing.benefits || [],
        status: existing.status || "paused",
        isFeatured: !!existing.isFeatured,
        featuredUntil: toDateInput(existing.featuredUntil),
        featuredOrder: existing.featuredOrder ?? "",
      });
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        location: {
          ...form.location,
          latitude: form.location.isRemote ? undefined : form.location.latitude,
          longitude: form.location.isRemote ? undefined : form.location.longitude,
        },
        vacancies: Number(form.vacancies) || 1,
        featuredOrder: form.featuredOrder === "" ? undefined : Number(form.featuredOrder),
      };
      return isEdit ? jobsApi.update(id, payload) : jobsApi.create(payload);
    },
    onSuccess: (res) => {
      toast.success(isEdit ? "Job updated" : "Job posted successfully");
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["job-full", id] });
      const newId = res?.data?.data?._id || id;
      navigate(`/jobs/${newId}`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setNested = (key, patch) => setForm((f) => ({ ...f, [key]: { ...f[key], ...patch } }));
  const setReq = (patch) => setForm((f) => ({ ...f, requirements: { ...f.requirements, ...patch } }));
  const setReqExp = (patch) => setForm((f) => ({
    ...f, requirements: { ...f.requirements, experience: { ...f.requirements.experience, ...patch } },
  }));

  if (isEdit && isLoading) {
    return <p className="text-sm text-muted-foreground">Loading job…</p>;
  }

  const categoryNames = (categories || []).map((c) => c.name);

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <PageHeader
        title={isEdit ? "Edit job" : "Post a new job"}
        description="Every field on the job schema can be set here — this job will be posted under your admin account as the employer of record"
        actions={
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? "Save changes" : "Post job"}
          </Button>
        }
      />

      <Tabs defaultValue="basic">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="salary">Salary</TabsTrigger>
          <TabsTrigger value="worksetup">Work Setup</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="publishing">Publishing</TabsTrigger>
        </TabsList>

        {/* BASIC */}
        <TabsContent value="basic">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-1.5">
                <Label>Job title</Label>
                <Input value={form.title} onChange={(e) => set({ title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea rows={6} value={form.description} onChange={(e) => set({ description: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.category || undefined} onValueChange={(v) => set({ category: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categoryNames.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Sub-category</Label>
                  <Input value={form.subCategory} onChange={(e) => set({ subCategory: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Job type</Label>
                  <Select value={form.jobType} onValueChange={(v) => set({ jobType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {JOB_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Vacancies</Label>
                  <Input type="number" min={1} value={form.vacancies} onChange={(e) => set({ vacancies: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Company name</Label>
                  <Input value={form.companyName} onChange={(e) => set({ companyName: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Employer display name</Label>
                  <Input value={form.employerName} onChange={(e) => set({ employerName: e.target.value })} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LOCATION */}
        <TabsContent value="location">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Remote job</p>
                  <p className="text-xs text-muted-foreground">Skip address & coordinates</p>
                </div>
                <Switch checked={form.location.isRemote} onCheckedChange={(v) => setNested("location", { isRemote: v })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Address</Label>
                  <Input value={form.location.address} onChange={(e) => setNested("location", { address: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Input value={form.location.city} onChange={(e) => setNested("location", { city: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>State</Label>
                  <Input value={form.location.state} onChange={(e) => setNested("location", { state: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Country</Label>
                  <Input value={form.location.country} onChange={(e) => setNested("location", { country: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Pincode</Label>
                  <Input value={form.location.pincode} onChange={(e) => setNested("location", { pincode: e.target.value })} />
                </div>
                {!form.location.isRemote && (
                  <>
                    <div className="space-y-1.5">
                      <Label>Latitude</Label>
                      <Input type="number" step="any" value={form.location.latitude} onChange={(e) => setNested("location", { latitude: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Longitude</Label>
                      <Input type="number" step="any" value={form.location.longitude} onChange={(e) => setNested("location", { longitude: e.target.value })} />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SALARY */}
        <TabsContent value="salary">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Min salary</Label><Input type="number" value={form.salary.min} onChange={(e) => setNested("salary", { min: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Max salary</Label><Input type="number" value={form.salary.max} onChange={(e) => setNested("salary", { max: e.target.value })} /></div>
                <div className="space-y-1.5">
                  <Label>Period</Label>
                  <Select value={form.salary.period} onValueChange={(v) => setNested("salary", { period: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Currency</Label><Input value={form.salary.currency} onChange={(e) => setNested("salary", { currency: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5">
                <Label>Incentive description</Label>
                <Input value={form.salary.incentiveDescription} onChange={(e) => setNested("salary", { incentiveDescription: e.target.value })} placeholder="₹2000/month on target" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm">Negotiable</span>
                  <Switch checked={form.salary.isNegotiable} onCheckedChange={(v) => setNested("salary", { isNegotiable: v })} />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm">Hidden salary</span>
                  <Switch checked={form.salary.isHidden} onCheckedChange={(v) => setNested("salary", { isHidden: v })} />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm">Incentives</span>
                  <Switch checked={form.salary.incentiveAvailable} onCheckedChange={(v) => setNested("salary", { incentiveAvailable: v })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Joining fee description (if applicable)</Label>
                <Input value={form.joiningFeeDescription} onChange={(e) => set({ joiningFeeDescription: e.target.value })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm">Joining fee required</span>
                <Switch checked={form.joiningFeeRequired} onCheckedChange={(v) => set({ joiningFeeRequired: v })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WORK SETUP */}
        <TabsContent value="worksetup">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Work location type</Label>
                  <Select value={form.workLocationType} onValueChange={(v) => set({ workLocationType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{WORK_LOCATION_TYPES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Shift time</Label>
                  <Select value={form.shiftTime} onValueChange={(v) => set({ shiftTime: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SHIFT_TIMES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Working days</Label>
                  <Select value={form.workingDays} onValueChange={(v) => set({ workingDays: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{WORKING_DAYS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Interview type</Label>
                  <Select value={form.interviewType} onValueChange={(v) => set({ interviewType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{INTERVIEW_TYPES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Marital status preference</Label>
                  <Select value={form.maritalStatus} onValueChange={(v) => set({ maritalStatus: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{MARITAL_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Call time start</Label>
                  <Input type="datetime-local" value={form.callTimeStart} onChange={(e) => set({ callTimeStart: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Call time end</Label>
                  <Input type="datetime-local" value={form.callTimeEnd} onChange={(e) => set({ callTimeEnd: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Tags</Label>
                <TagInput value={form.tags} onChange={(v) => set({ tags: v })} placeholder="Add a tag…" />
              </div>
              <div className="space-y-1.5">
                <Label>Benefits</Label>
                <TagInput value={form.benefits} onChange={(v) => set({ benefits: v })} placeholder="Add a benefit…" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REQUIREMENTS */}
        <TabsContent value="requirements">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm">Fresher acceptable</span>
                <Switch checked={form.requirements.experience.isFresher} onCheckedChange={(v) => setReqExp({ isFresher: v })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5"><Label>Min experience</Label><Input type="number" value={form.requirements.experience.min} onChange={(e) => setReqExp({ min: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Max experience</Label><Input type="number" value={form.requirements.experience.max} onChange={(e) => setReqExp({ max: e.target.value })} /></div>
                <div className="space-y-1.5">
                  <Label>Unit</Label>
                  <Select value={form.requirements.experience.unit} onValueChange={(v) => setReqExp({ unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{EXPERIENCE_UNITS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Minimum education</Label>
                <Input value={form.requirements.education} onChange={(e) => setReq({ education: e.target.value })} placeholder="e.g. 12th Pass" />
              </div>
              <div className="space-y-1.5">
                <Label>Required skills</Label>
                <TagInput value={form.requirements.skills} onChange={(v) => setReq({ skills: v })} placeholder="Add a skill…" />
              </div>
              <div className="space-y-1.5">
                <Label>Required languages</Label>
                <TagInput value={form.requirements.languages} onChange={(v) => setReq({ languages: v })} placeholder="Add a language…" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Preferred gender</Label>
                  <Select value={form.requirements.gender} onValueChange={(v) => setReq({ gender: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{GENDER_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Min age</Label><Input type="number" value={form.requirements.ageMin} onChange={(e) => setReq({ ageMin: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Max age</Label><Input type="number" value={form.requirements.ageMax} onChange={(e) => setReq({ ageMax: e.target.value })} /></div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm">Driving license required</span>
                <Switch checked={form.requirements.licenseRequired} onCheckedChange={(v) => setReq({ licenseRequired: v })} />
              </div>
              {form.requirements.licenseRequired && (
                <div className="space-y-1.5">
                  <Label>Accepted license types</Label>
                  <ChipMultiSelect options={LICENSE_TYPE_OPTIONS} value={form.requirements.licenseType} onChange={(v) => setReq({ licenseType: v })} />
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm">Own vehicle required</span>
                <Switch checked={form.requirements.vehicleRequired} onCheckedChange={(v) => setReq({ vehicleRequired: v })} />
              </div>
              {form.requirements.vehicleRequired && (
                <div className="space-y-1.5">
                  <Label>Accepted vehicle types</Label>
                  <ChipMultiSelect options={VEHICLE_TYPE_OPTIONS} value={form.requirements.vehicleType} onChange={(v) => setReq({ vehicleType: v })} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PUBLISHING */}
        <TabsContent value="publishing">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => set({ status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {JOB_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Application deadline</Label>
                  <Input type="date" value={form.applicationDeadline} onChange={(e) => set({ applicationDeadline: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Expiry date</Label>
                  <Input type="date" value={form.expiryDate} onChange={(e) => set({ expiryDate: e.target.value })} />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm">Featured listing</span>
                <Switch checked={form.isFeatured} onCheckedChange={(v) => set({ isFeatured: v })} />
              </div>
              {form.isFeatured && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Featured until</Label>
                    <Input type="date" value={form.featuredUntil} onChange={(e) => set({ featuredUntil: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Featured order</Label>
                    <Input type="number" value={form.featuredOrder} onChange={(e) => set({ featuredOrder: e.target.value })} />
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                  {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isEdit ? "Save changes" : "Post job"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
