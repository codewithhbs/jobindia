import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    ArrowLeft, Phone, Mail, MapPin, ExternalLink, Copy, CheckCircle2, XCircle,
    Car, Building2, UserRound, ShieldCheck, Clock, Briefcase, FileText,
    IndianRupee, GraduationCap,
} from 'lucide-react';
import { API } from '../lib/api';
import { Spinner, Badge } from '../components/ui';

const IMG = (path) => (path ? `${import.meta.env.VITE_IMAGE_API_URL}${path}` : null);
const fallbackAvatar = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=random&size=128`;

const fmt = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—');

// Role identity system — each role gets one consistent accent used across the page
// so admins can tell record types apart at a glance in a queue of tabs/records.
const ROLE_THEME = {
    driver: { label: 'Driver', icon: Car, accent: 'amber', ring: 'ring-amber-200', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    employer: { label: 'Employer', icon: Building2, accent: 'violet', ring: 'ring-violet-200', bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
    jobseeker: { label: 'Jobseeker', icon: UserRound, accent: 'emerald', ring: 'ring-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

function copyToClipboard(value, label) {
    if (!value) return;
    navigator.clipboard.writeText(String(value));
    toast.success(`${label} copied`);
}

const Section = ({ title, icon: Icon, children, className = '' }) => (
    <div className={`card p-5 space-y-1 ${className}`}>
        <div className="flex items-center gap-2 mb-2">
            {Icon && <Icon size={15} className="text-muted" />}
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted">{title}</h2>
        </div>
        <div>{children}</div>
    </div>
);

const Field = ({ label, value, mono = false }) => (
    <div className="flex justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
        <span className="text-sm text-muted shrink-0">{label}</span>
        <span className={`text-sm font-medium text-right break-words ${mono ? 'font-mono text-[13px]' : ''}`}>
            {value === undefined || value === null || value === '' ? '—' : value}
        </span>
    </div>
);

// Compact metric tile for the role-specific "at a glance" strip.
const Stat = ({ label, value, icon: Icon }) => (
    <div className="card p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
            <Icon size={16} className="text-muted" />
        </div>
        <div className="min-w-0">
            <p className="text-base font-extrabold leading-tight truncate">{value ?? '—'}</p>
            <p className="text-xs text-muted leading-tight">{label}</p>
        </div>
    </div>
);

// Verified / unverified pill — used for phone, email, KYC so an admin can scan
// trust signals in one row instead of hunting through the Account section.
const VerifyChip = ({ label, verified }) => (
    <span
        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${verified ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
            }`}
    >
        {verified ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
        {label}
    </span>
);

export default function UsersDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUserDetails = async () => {
        setLoading(true);
        try {
            const res = await API.users.getOne(id);
            setData(res.data);
        } catch (error) {
            toast.error(error.message || 'Failed to load user');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUserDetails(); }, [id]);

    if (loading) return <Spinner />;
    if (!data?.user) return <div className="text-center text-muted py-10">User not found</div>;

    const { user, profile } = data;
    const role = user.role;
    const theme = ROLE_THEME[role] || ROLE_THEME.jobseeker;
    const RoleIcon = theme.icon;

    return (
        <div className="space-y-5">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted hover:text-black">
                <ArrowLeft size={16} /> Back
            </button>

            {/* Header */}
            <div className="card overflow-hidden">
                <div className={`h-2 ${theme.dot}`} />
                <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="relative shrink-0">
                        <img
                            src={IMG(user.avatar) || fallbackAvatar(user.name)}
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = fallbackAvatar(user.name); }}
                            alt={user.name}
                            className={`w-20 h-20 rounded-full object-cover bg-gray-100 ring-4 ${theme.ring}`}
                        />
                        <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full ${theme.bg} border-2 border-white flex items-center justify-center`}>
                            <RoleIcon size={13} className={theme.text} />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl font-extrabold truncate">{user.name || '—'}</h1>
                            <Badge color={user.isActive ? 'success' : 'danger'}>{user.isActive ? 'Active' : 'Blocked'}</Badge>
                            {role === 'driver' && user.kycStatus && (
                                <Badge color={user.kycStatus === 'verified' ? 'success' : 'gray'} className="capitalize">
                                    KYC {user.kycStatus}
                                </Badge>
                            )}
                        </div>
                        <p className={`text-xs font-semibold uppercase tracking-wide mt-0.5 ${theme.text}`}>{theme.label}</p>

                        <div className="flex flex-wrap gap-2 mt-3">
                            <VerifyChip label="Phone" verified={user.isPhoneVerified} />
                            <VerifyChip label="Email" verified={user.isEmailVerified} />
                            <VerifyChip label="Profile" verified={user.isProfileComplete} />
                            {role !== 'driver' && <VerifyChip label="KYC" verified={user.isKYCVerified} />}
                        </div>
                    </div>

                    <div className="flex sm:flex-col gap-2 sm:items-end shrink-0">
                        <button
                            onClick={() => copyToClipboard(user.phone, 'Phone number')}
                            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                        >
                            <Phone size={14} /> {user.phone} <Copy size={12} className="text-muted" />
                        </button>
                        {user.email && (
                            <button
                                onClick={() => copyToClipboard(user.email, 'Email')}
                                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                            >
                                <Mail size={14} /> <span className="truncate max-w-[180px]">{user.email}</span> <Copy size={12} className="text-muted" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Role-specific key metrics — the numbers an admin checks first */}
            {role === 'driver' && profile && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Stat label="Vehicle" value={profile.vehicleModel} icon={Car} />
                    <Stat label="Experience" value={profile.yearsOfExperience ? `${profile.yearsOfExperience} yrs` : null} icon={Clock} />
                    <Stat label="Expected Salary" value={profile.expectedSalary} icon={IndianRupee} />
                    <Stat label="Documents" value={profile.documents?.length ?? 0} icon={FileText} />
                </div>
            )}
            {role === 'employer' && profile && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Stat label="Plan" value={<span className="capitalize">{profile.subscriptionPlan}</span>} icon={ShieldCheck} />
                    <Stat label="Active Jobs" value={profile.activeJobs} icon={Briefcase} />
                    <Stat label="Total Posted" value={profile.totalJobsPosted} icon={FileText} />
                    <Stat label="Job Post Limit" value={profile.jobPostLimit} icon={Clock} />
                </div>
            )}
            {role === 'jobseeker' && profile && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Stat label="Profile Complete" value={`${profile.profileCompleteness ?? 0}%`} icon={ShieldCheck} />
                    <Stat label="Profile Views" value={profile.stats?.profileViews} icon={UserRound} />
                    <Stat label="Applications" value={profile.stats?.totalApplications} icon={Briefcase} />
                    <Stat label="Saved Jobs" value={profile.stats?.savedJobs} icon={FileText} />
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-5">
                {/* Account info */}
                <Section title="Account">
                    <Field label="User ID" value={user._id} mono />
                    <Field label="Last Seen" value={fmt(user.lastSeen)} />
                    <Field label="Created" value={fmt(user.createdAt)} />
                    <Field label="Updated" value={fmt(user.updatedAt)} />
                </Section>

                {/* Location */}
                <Section title="Location" icon={MapPin}>
                    <Field label="City" value={user.location?.city} />
                    <Field label="Pincode" value={user.location?.pincode} />
                    <Field label="Country" value={user.location?.country} />
                    <Field label="Address" value={user.location?.address} />
                    <Field label="Full Address" value={user.location?.state} />
                    {user.location?.coordinates?.some(Boolean) && (
                        <a
                            className="flex items-center gap-1 text-sm text-blue-600 hover:underline pt-2"
                            target="_blank" rel="noreferrer"
                            href={`https://maps.google.com/?q=${user.location.coordinates[1]},${user.location.coordinates[0]}`}
                        >
                            <MapPin size={14} /> View on map <ExternalLink size={12} />
                        </a>
                    )}
                </Section>

                {/* Device info */}
                {user.deviceInfo && (
                    <Section title="Device">
                        <Field label="Brand" value={user.deviceInfo.brand} />
                        <Field label="Model" value={user.deviceInfo.model} />
                        <Field label="Platform" value={user.deviceInfo.platform} />
                        <Field label="OS Version" value={user.deviceInfo.osVersion} />
                        <Field label="Is Device" value={user.deviceInfo.isDevice ? 'Yes' : 'No'} />
                    </Section>
                )}

                {/* ---------- DRIVER ---------- */}
                {role === 'driver' && profile && (
                    <>
                        <Section title="Driver Profile" icon={Car}>
                            <Field label="License Number" value={profile.licenseNumber} mono />
                            <Field label="Vehicle Number" value={profile.vehicleNumber} mono />
                            <Field label="Vehicle Types" value={profile.vehicleTypes?.join(', ')} />
                            <Field label="Vehicle Categories" value={profile.vehicleCategories?.join(', ')} />
                            <Field label="Is Bike Available" value={profile.isBikeAvailable ? 'Yes' : 'No'} />
                            <Field label="Preferred Categories" value={profile.preferredCategories?.join(', ')} />
                            <Field label="Aadhar Number" value={profile.aadharNumber} mono />
                            <Field label="Duty Type" value={profile.dutyType} />
                            <Field label="Current Salary" value={profile.currentSalary} />
                            <Field label="Is Available" value={profile.isAvailable ? 'Yes' : 'No'} />
                        </Section>

                        <Section title="Documents" icon={FileText} className="md:col-span-2">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {profile.documents?.map((doc) => (
                                    <a
                                        key={doc._id}
                                        href={IMG(doc.fileUrl)}
                                        target="_blank" rel="noreferrer"
                                        className="group relative border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                                    >
                                        <img src={IMG(doc.fileUrl)} alt={doc.fieldName} className="w-full h-28 object-cover bg-gray-100" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                        <div className="p-2 flex items-center justify-between gap-1">
                                            <span className="text-xs font-medium truncate">{doc.fieldName}</span>
                                            <Badge color={doc.verificationStatus === 'verified' ? 'success' : 'gray'} className="shrink-0">
                                                {doc.verificationStatus}
                                            </Badge>
                                        </div>
                                    </a>
                                ))}
                                {!profile.documents?.length && <span className="text-sm text-muted col-span-full">No documents uploaded</span>}
                            </div>
                        </Section>
                    </>
                )}

                {/* ---------- EMPLOYER ---------- */}
                {role === 'employer' && profile && (
                    <>
                        <Section title="Company" icon={Building2}>
                            <div className="flex items-center gap-3 pb-3 mb-1 border-b border-gray-100">
                                <img
                                    src={IMG(profile.companyLogo) || fallbackAvatar(profile.companyName)}
                                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = fallbackAvatar(profile.companyName); }}
                                    alt={profile.companyName}
                                    className="w-14 h-14 rounded-lg object-cover bg-gray-100"
                                />
                                <div className="min-w-0">
                                    <p className="font-bold truncate">{profile.companyName}</p>
                                    <p className="text-xs text-muted">{profile.industry} · {profile.companySize} employees</p>
                                </div>
                            </div>
                            <Field label="Description" value={profile.description} />
                            <Field label="Founded Year" value={profile.foundedYear} />
                            <Field
                                label="Website"
                                value={profile.website
                                    ? <a href={profile.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{profile.website}</a>
                                    : '—'}
                            />
                            <Field label="GST Number" value={profile.gstNumber} mono />
                            <Field label="PAN Number" value={profile.panNumber} mono />
                            <Field label="Verification Status" value={<span className="capitalize">{profile.verificationStatus}</span>} />
                        </Section>

                        <Section title="Subscription" icon={ShieldCheck}>
                            <Field label="Plan" value={<span className="capitalize">{profile.subscriptionPlan}</span>} />
                            <Field label="Job Post Limit" value={profile.jobPostLimit} />
                            <Field label="Total Jobs Posted" value={profile.totalJobsPosted} />
                            <Field label="Active Jobs" value={profile.activeJobs} />
                            <Field label="Subscription Expiry" value={fmt(profile.subscriptionExpiry)} />
                        </Section>

                        <Section title="Contact Person">
                            <Field label="Name" value={profile.contactPerson?.name} />
                            <Field label="Designation" value={profile.contactPerson?.designation} />
                            <Field label="Email" value={profile.contactPerson?.email} />
                            <Field label="Phone" value={profile.contactPerson?.phone} />
                        </Section>

                        <Section title="Address" icon={MapPin}>
                            <Field label="Street" value={profile.address?.street} />
                            <Field label="City" value={profile.address?.city} />
                            <Field label="State" value={profile.address?.state} />
                            <Field label="Pincode" value={profile.address?.pincode} />
                            <Field label="Country" value={profile.address?.country} />
                        </Section>
                    </>
                )}

                {/* ---------- JOBSEEKER ---------- */}
                {role === 'jobseeker' && profile && (
                    <>
                        <Section title="Jobseeker Profile" icon={UserRound}>
                            <Field label="Is Fresher" value={profile.isFresher ? 'Yes' : 'No'} />
                            <Field label="Is Open To Work" value={profile.isOpenToWork ? 'Yes' : 'No'} />
                            <Field label="Willing To Relocate" value={profile.willingToRelocate ? 'Yes' : 'No'} />
                            <Field label="Availability" value={profile.availability} />
                            <Field label="Notice Period" value={profile.noticePeriodDays != null ? `${profile.noticePeriodDays} days` : null} />
                            <Field label="Total Experience" value={profile.totalExperienceMonths != null ? `${profile.totalExperienceMonths} months` : null} />
                            <Field label="Expected Salary" value={profile.expectedSalary ? `${profile.expectedSalary.currency} / ${profile.expectedSalary.period}` : null} />
                            <Field label="Skills" value={profile.skills?.length ? profile.skills.join(', ') : null} />
                        </Section>

                        {profile.resume?.fileUrl && (
                            <Section title="Resume" icon={FileText}>
                                <a
                                    href={IMG(profile.resume.fileUrl)}
                                    target="_blank" rel="noreferrer"
                                    className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                                >
                                    {profile.resume.fileName} <ExternalLink size={14} />
                                </a>
                                <Field label="Uploaded" value={fmt(profile.resume.uploadedAt)} />
                            </Section>
                        )}

                        {profile.experience?.length > 0 && (
                            <Section title="Experience" icon={Briefcase} className="md:col-span-2">
                                {profile.experience.map((exp) => (
                                    <div key={exp._id} className="flex gap-3 border-b border-gray-100 last:border-0 py-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                                            <Briefcase size={14} className="text-muted" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm">{exp.jobTitle} · {exp.company}</p>
                                            <p className="text-xs text-muted capitalize">
                                                {exp.employmentType?.replace('_', ' ')} · {fmtDate(exp.startDate)} — {exp.isCurrent ? 'Present' : fmtDate(exp.endDate)}
                                            </p>
                                            {exp.description && <p className="text-xs mt-1 text-gray-600">{exp.description}</p>}
                                        </div>
                                    </div>
                                ))}
                            </Section>
                        )}

                        {profile.education?.length > 0 && (
                            <Section title="Education" icon={GraduationCap}>
                                {profile.education.map((edu, i) => (
                                    <Field key={i} label={edu.degree || `Education ${i + 1}`} value={edu.institution} />
                                ))}
                            </Section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}