import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { paymentsApi } from "@/api/payments.api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { CreditCard } from "lucide-react";

export default function PaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["payments-me"],
    queryFn: () => paymentsApi.myPayments().then((r) => r.data.data),
  });

  const payments = data || [];

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Payment history for this admin account (the backend does not expose a platform-wide payments endpoint)"
      />

      <div className="rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : payments.length === 0 ? (
          <EmptyState icon={CreditCard} title="No payment records" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Razorpay order</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p._id}>
                  <TableCell className="capitalize">{p.planSlug}</TableCell>
                  <TableCell>{formatCurrency(p.amount, p.currency)}</TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                  <TableCell className="font-mono text-xs">{p.razorpayOrderId}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDateTime(p.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
