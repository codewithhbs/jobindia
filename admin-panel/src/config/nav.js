import {
  LayoutDashboard,
  Users,
  Briefcase,
  ShieldCheck,
  LifeBuoy,
  Bell,
  FolderTree,
  FileText,
  Images,
  HelpCircle,
  GalleryHorizontal,
  CreditCard,
  Settings,
  ListChecks,
  UserCog,
  Building2,
  GraduationCap,
  Car,
} from "lucide-react";

export const NAV_SECTIONS = [
  {
    title: null,
    items: [{ label: "Dashboard", to: "/", icon: LayoutDashboard, end: true }],
  },
  {
    title: "People",
    items: [
      { label: "All Users", to: "/users", icon: Users },
      { label: "Jobseekers", to: "/jobseekers", icon: GraduationCap },
      { label: "Employers", to: "/employers", icon: Building2 },
      { label: "Drivers", to: "/drivers", icon: Car },
      { label: "KYC Verification", to: "/kyc", icon: ShieldCheck },
    ],
  },
  {
    title: "Marketplace",
    items: [
      { label: "Jobs", to: "/jobs", icon: Briefcase },
      { label: "Support Tickets", to: "/support", icon: LifeBuoy },
      { label: "Notifications", to: "/notifications", icon: Bell },
    ],
  },
  {
    title: "Content",
    items: [
      { label: "Categories", to: "/categories", icon: FolderTree },
      { label: "CMS Pages", to: "/cms", icon: FileText },
      { label: "Onboarding Screens", to: "/onboarding", icon: Images },
      { label: "FAQs", to: "/faqs", icon: HelpCircle },
      { label: "Home Sliders", to: "/sliders", icon: GalleryHorizontal },
    ],
  },
  {
    title: "Monetization",
    items: [
      { label: "Subscription Plans", to: "/plans", icon: CreditCard },
      { label: "Payments", to: "/payments", icon: CreditCard },
    ],
  },
  {
    title: "Configuration",
    items: [
      { label: "App Settings", to: "/settings", icon: Settings },
      { label: "Dynamic Form Fields", to: "/form-fields", icon: ListChecks },
      { label: "Role Options", to: "/role-options", icon: UserCog },
    ],
  },
];
