import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2, GraduationCap, BriefcaseBusiness, Plus, Trash2, Pencil } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TagInput } from "@/components/shared/tag-input";
import { ChipMultiSelect } from "@/components/shared/chip-multi-select";
import { jobseekersApi } from "@/api/jobseekers.api";
import { getErrorMessage } from "@/api/client";
import { formatDate } from "@/lib/utils";
import { JOB_TYPES, GENDER_OPTIONS, MARITAL_OPTIONS } from "@/config/options";

const AVAILABILITY_OPTIONS = ["immediate", "15_days", "30_days", "60_days", "flexible"];

const EMPTY_EDU = { degree: "", institution: "", fieldOfStudy: "", startYear: "", endYear: "", grade: "", isPursuing: false };
const EMPTY_EXP = { jobTitle: "", company: "", location: "", startDate: "", endDate: "", isCurrent: false, description: "" };

export default function JobseekerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(null);

  const [eduDialog, setEduDialog] = useState(false);
  const [eduForm, setEduForm] = useState(EMPTY_EDU);
  const [eduEditingId, setEduEditingId] = useState(null);
  const [eduDeleteId, setEduDeleteId] = useState(null);

  const [expDialog, setExpDialog] = useState(false);
  const [expForm, setExpForm] = useState(EMPTY_EXP);
  const [expEditingId, setExpEditingId] = useState(null);
  const [expDeleteId, setExpDeleteId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["jobseeker", id],
    queryFn: () => jobseekersApi.getById(id).then((r) => r.data.data),
  });

  useEffect(() => {
    if (data) {
      setForm({
        headline: data.headline || "",
        about: data.about || "",
        dob: data.dob ? new Date(data.dob).toISOString().slice(0, 10) : "",
        gender: data.gender || "",
        maritalStatus: data.maritalStatus || "",
        availability: data.availability || "immediate",
        isFresher: !!data.isFresher,
        isOpenToWork: data.isOpenToWork ?? true,
        willingToRelocate: data.willingToRelocate ?? false,
        skills: data.skills || [],
        preferredJobTypes: data.preferredJobTypes || [],
        totalExperienceMonths: data.totalExperienceMonths || 0,
        noticePeriodDays: data.noticePeriodDays || 0,
        currentSalary: data.currentSalary || "",
        expectedSalaryMin: data.expectedSalary?.min || "",
        expectedSalaryMax: data.expectedSalary?.max || "",
        linkedin: data.links?.linkedin || "",
        github: data.links?.github || "",
        portfolio: data.links?.portfolio || "",
        otherLink: data.links?.other || "",
        languages: (data.languages || []).map((l) => l.name),
      });
    }
  }, [data]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["jobseeker", id] });
    qc.invalidateQueries({ queryKey: ["jobseekers"] });
  };

  const saveProfileMutation = useMutation({
    mutationFn: () =>
      jobseekersApi.fullUpdate(id, {
        profile: {
          headline: form.headline,
          about: form.about,
          skills: form.skills,
          preferredJobTypes: form.preferredJobTypes,
          totalExperienceMonths: Number(form.totalExperienceMonths) || 0,
          noticePeriodDays: Number(form.noticePeriodDays) || 0,
          currentSalary: form.currentSalary ? Number(form.currentSalary) : undefined,
          expectedSalary: {
            min: form.expectedSalaryMin ? Number(form.expectedSalaryMin) : undefined,
            max: form.expectedSalaryMax ? Number(form.expectedSalaryMax) : undefined,
            currency: "INR", period: "monthly",
          },
          availability: form.availability,
          isOpenToWork: form.isOpenToWork,
          willingToRelocate: form.willingToRelocate,
          links: { linkedin: form.linkedin, github: form.github, portfolio: form.portfolio, other: form.otherLink },
          languages: form.languages.map((name) => ({ name, proficiency: "conversational", canRead: true, canWrite: true, canSpeak: true })),
        },
        dob: form.dob || undefined,
        gender: form.gender || undefined,
        maritalStatus: form.maritalStatus || undefined,
        isFresher: form.isFresher,
      }),
    onSuccess: () => { toast.success("Profile updated"); invalidate(); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const eduMutation = useMutation({
    mutationFn: (body) => jobseekersApi.fullUpdate(id, { education: body }),
    onSuccess: () => {
      toast.success("Education saved");
      invalidate();
      setEduDialog(false);
      setEduEditingId(null);
      setEduForm(EMPTY_EDU);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const expMutation = useMutation({
    mutationFn: (body) => jobseekersApi.fullUpdate(id, { experience: body }),
    onSuccess: () => {
      toast.success("Experience saved");
      invalidate();
      setExpDialog(false);
      setExpEditingId(null);
      setExpForm(EMPTY_EXP);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const openAddEdu = () => { setEduEditingId(null); setEduForm(EMPTY_EDU); setEduDialog(true); };
  const openEditEdu = (e) => {
    setEduEditingId(e._id);
    setEduForm({
      degree: e.degree || "", institution: e.institution || "", fieldOfStudy: e.fieldOfStudy || "",
      startYear: e.startYear || "", endYear: e.endYear || "", grade: e.grade || "", isPursuing: !!e.isPursuing,
    });
    setEduDialog(true);
  };
  const saveEdu = () => {
    const payload = { ...eduForm, startYear: Number(eduForm.startYear) || undefined, endYear: Number(eduForm.endYear) || undefined };
    if (eduEditingId) eduMutation.mutate({ update: [{ itemId: eduEditingId, ...payload }] });
    else eduMutation.mutate({ add: [payload] });
  };

  const openAddExp = () => { setExpEditingId(null); setExpForm(EMPTY_EXP); setExpDialog(true); };
  const openEditExp = (e) => {
    setExpEditingId(e._id);
    setExpForm({
      jobTitle: e.jobTitle || "", company: e.company || "", location: e.location || "",
      startDate: e.startDate || "", endDate: e.endDate || "", isCurrent: !!e.isCurrent, description: e.description || "",
    });
    setExpDialog(true);
  };
  const saveExp = () => {
    if (expEditingId) expMutation.mutate({ update: [{ itemId: expEditingId, ...expForm }] });
    else expMutation.mutate({ add: [expForm] });
  };

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

      <PageHeader title={data.userId?.name || "Jobseeker profile"} description={data.userId?.phone} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Profile details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Headline</Label>
              <Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="Delivery Executive | 3 yrs experience" />
            </div>
            <div className="space-y-1.5">
              <Label>About</Label>
              <Textarea rows={3} value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Date of birth</Label>
                <Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select value={form.gender || "unset"} onValueChange={(v) => setForm({ ...form, gender: v === "unset" ? "" : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">Not set</SelectItem>
                    {GENDER_OPTIONS.filter((g) => g.value !== "any").map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Marital status</Label>
                <Select value={form.maritalStatus || "unset"} onValueChange={(v) => setForm({ ...form, maritalStatus: v === "unset" ? "" : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">Not set</SelectItem>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Skills</Label>
              <TagInput value={form.skills} onChange={(v) => setForm({ ...form, skills: v })} placeholder="Add a skill…" />
            </div>

            <div className="space-y-1.5">
              <Label>Preferred job types</Label>
              <ChipMultiSelect options={JOB_TYPES} value={form.preferredJobTypes} onChange={(v) => setForm({ ...form, preferredJobTypes: v })} />
            </div>

            <div className="space-y-1.5">
              <Label>Languages known</Label>
              <TagInput value={form.languages} onChange={(v) => setForm({ ...form, languages: v })} placeholder="Add a language…" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Experience (months)</Label><Input type="number" value={form.totalExperienceMonths} onChange={(e) => setForm({ ...form, totalExperienceMonths: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Notice period (days)</Label><Input type="number" value={form.noticePeriodDays} onChange={(e) => setForm({ ...form, noticePeriodDays: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Current salary (monthly INR)</Label><Input type="number" value={form.currentSalary} onChange={(e) => setForm({ ...form, currentSalary: e.target.value })} /></div>
              <div className="space-y-1.5">
                <Label>Availability</Label>
                <Select value={form.availability} onValueChange={(v) => setForm({ ...form, availability: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AVAILABILITY_OPTIONS.map((a) => <SelectItem key={a} value={a} className="capitalize">{a.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Expected salary min</Label><Input type="number" value={form.expectedSalaryMin} onChange={(e) => setForm({ ...form, expectedSalaryMin: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Expected salary max</Label><Input type="number" value={form.expectedSalaryMax} onChange={(e) => setForm({ ...form, expectedSalaryMax: e.target.value })} /></div>
            </div>

            <div className="pt-2 border-t border-border">
              <p className="text-sm font-medium mb-3">Links</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>LinkedIn</Label><Input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>GitHub</Label><Input value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Portfolio</Label><Input value={form.portfolio} onChange={(e) => setForm({ ...form, portfolio: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Other</Label><Input value={form.otherLink} onChange={(e) => setForm({ ...form, otherLink: e.target.value })} /></div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm">Fresher</span>
                <Switch checked={form.isFresher} onCheckedChange={(v) => setForm({ ...form, isFresher: v })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm">Open to work</span>
                <Switch checked={form.isOpenToWork} onCheckedChange={(v) => setForm({ ...form, isOpenToWork: v })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm">Willing to relocate</span>
                <Switch checked={form.willingToRelocate} onCheckedChange={(v) => setForm({ ...form, willingToRelocate: v })} />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => saveProfileMutation.mutate()} disabled={saveProfileMutation.isPending}>
                {saveProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save changes
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Education</CardTitle>
              <Button size="sm" variant="ghost" onClick={openAddEdu}><Plus className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data.education || []).length === 0 && <p className="text-sm text-muted-foreground">No education added</p>}
              {(data.education || []).map((e) => (
                <div key={e._id} className="text-sm border-b border-border last:border-0 pb-2 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{e.degree}</p>
                      <p className="text-muted-foreground">{e.institution} {e.startYear && `· ${e.startYear}-${e.isPursuing ? "present" : e.endYear || ""}`}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditEdu(e)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEduDeleteId(e._id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4" /> Experience</CardTitle>
              <Button size="sm" variant="ghost" onClick={openAddExp}><Plus className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data.experience || []).length === 0 && <p className="text-sm text-muted-foreground">No experience added</p>}
              {(data.experience || []).map((e) => (
                <div key={e._id} className="text-sm border-b border-border last:border-0 pb-2 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{e.jobTitle} {e.isCurrent && <Badge variant="success" className="ml-1">Current</Badge>}</p>
                      <p className="text-muted-foreground">{e.company}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(e.startDate)} — {e.isCurrent ? "Present" : formatDate(e.endDate)}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditExp(e)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpDeleteId(e._id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Education dialog */}
      <Dialog open={eduDialog} onOpenChange={(v) => !v && setEduDialog(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{eduEditingId ? "Edit education" : "Add education"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Degree</Label><Input value={eduForm.degree} onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Institution</Label><Input value={eduForm.institution} onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Field of study</Label><Input value={eduForm.fieldOfStudy} onChange={(e) => setEduForm({ ...eduForm, fieldOfStudy: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Start year</Label><Input type="number" value={eduForm.startYear} onChange={(e) => setEduForm({ ...eduForm, startYear: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>End year</Label><Input type="number" disabled={eduForm.isPursuing} value={eduForm.endYear} onChange={(e) => setEduForm({ ...eduForm, endYear: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Grade</Label><Input value={eduForm.grade} onChange={(e) => setEduForm({ ...eduForm, grade: e.target.value })} placeholder="8.5 CGPA / 78%" /></div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Currently pursuing</span>
              <Switch checked={eduForm.isPursuing} onCheckedChange={(v) => setEduForm({ ...eduForm, isPursuing: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEduDialog(false)}>Cancel</Button>
            <Button disabled={eduMutation.isPending} onClick={saveEdu}>{eduEditingId ? "Save changes" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!eduDeleteId}
        onOpenChange={(v) => !v && setEduDeleteId(null)}
        title="Remove this education entry?"
        confirmText="Remove"
        loading={eduMutation.isPending}
        onConfirm={() => eduMutation.mutate({ remove: [eduDeleteId] })}
      />

      {/* Experience dialog */}
      <Dialog open={expDialog} onOpenChange={(v) => !v && setExpDialog(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{expEditingId ? "Edit experience" : "Add experience"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Job title</Label><Input value={expForm.jobTitle} onChange={(e) => setExpForm({ ...expForm, jobTitle: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Company</Label><Input value={expForm.company} onChange={(e) => setExpForm({ ...expForm, company: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Location</Label><Input value={expForm.location} onChange={(e) => setExpForm({ ...expForm, location: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Start date</Label><Input type="date" value={expForm.startDate} onChange={(e) => setExpForm({ ...expForm, startDate: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>End date</Label><Input type="date" disabled={expForm.isCurrent} value={expForm.endDate} onChange={(e) => setExpForm({ ...expForm, endDate: e.target.value })} /></div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">Currently working here</span>
              <Switch checked={expForm.isCurrent} onCheckedChange={(v) => setExpForm({ ...expForm, isCurrent: v })} />
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpDialog(false)}>Cancel</Button>
            <Button disabled={expMutation.isPending} onClick={saveExp}>{expEditingId ? "Save changes" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!expDeleteId}
        onOpenChange={(v) => !v && setExpDeleteId(null)}
        title="Remove this experience entry?"
        confirmText="Remove"
        loading={expMutation.isPending}
        onConfirm={() => expMutation.mutate({ remove: [expDeleteId] })}
      />
    </div>
  );
}
