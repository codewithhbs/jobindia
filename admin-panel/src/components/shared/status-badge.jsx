import { Badge } from "@/components/ui/badge";
import { titleCase } from "@/lib/utils";

const STATUS_MAP = {
  active: "success",
  approved: "success",
  paid: "success",
  verified: "success",
  resolved: "success",
  hired: "success",
  open: "success",

  pending: "warning",
  under_review: "warning",
  applied: "warning",
  viewed: "warning",
  created: "warning",
  partial: "warning",
  shortlisted: "warning",
  interview_scheduled: "warning",
  offered: "warning",

  rejected: "destructive",
  failed: "destructive",
  closed: "destructive",
  expired: "destructive",
  withdrawn: "destructive",

  draft: "muted",
  paused: "muted",
  not_submitted: "muted",
  refunded: "muted",
};

export function StatusBadge({ status }) {
  if (!status) return <Badge variant="muted">—</Badge>;
  const variant = STATUS_MAP[status] || "outline";
  return <Badge variant={variant}>{titleCase(status)}</Badge>;
}
