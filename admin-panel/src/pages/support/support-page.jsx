import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send, LifeBuoy } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { supportApi } from "@/api/support.api";
import { formatDateTime } from "@/lib/utils";
import { getErrorMessage } from "@/api/client";

const STATUSES = ["open", "pending", "resolved", "closed"];

export default function SupportPage() {
  const [status, setStatus] = useState("");
  const [activeTicket, setActiveTicket] = useState(null);
  const [reply, setReply] = useState("");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["support-tickets", status],
    queryFn: () => supportApi.listAll({ status }).then((r) => r.data.data),
  });

  const { data: ticketDetail } = useQuery({
    queryKey: ["support-ticket", activeTicket?._id],
    queryFn: () => supportApi.getById(activeTicket._id).then((r) => r.data.data),
    enabled: !!activeTicket,
  });

  const replyMutation = useMutation({
    mutationFn: () => supportApi.adminReply(activeTicket._id, reply),
    onSuccess: () => {
      toast.success("Reply sent");
      setReply("");
      qc.invalidateQueries({ queryKey: ["support-ticket", activeTicket._id] });
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const statusMutation = useMutation({
    mutationFn: (s) => supportApi.updateStatus(activeTicket._id, s),
    onSuccess: () => {
      toast.success("Ticket status updated");
      qc.invalidateQueries({ queryKey: ["support-ticket", activeTicket._id] });
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const tickets = data || [];

  return (
    <div>
      <PageHeader title="Support Tickets" description="Respond to user support requests" />

      <div className="mb-4">
        <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : tickets.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No support tickets" />
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <button
              key={t._id}
              onClick={() => setActiveTicket(t)}
              className="w-full text-left rounded-xl border border-border bg-card p-4 hover:bg-accent/50 transition-colors flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{t.subject}</p>
                  <Badge variant="outline" className="text-[10px]">{t.priority}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.user?.name || "Unknown user"} · {t.ticketId} · {formatDateTime(t.lastReplyAt)}
                </p>
              </div>
              <StatusBadge status={t.status} />
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!activeTicket} onOpenChange={(v) => !v && setActiveTicket(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{ticketDetail?.subject || activeTicket?.subject}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {ticketDetail?.user?.name} · {ticketDetail?.user?.phone}
              </p>
              <Select value={ticketDetail?.status} onValueChange={(v) => statusMutation.mutate(v)}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="max-h-72 overflow-y-auto scrollbar-thin space-y-3 rounded-lg border border-border p-3 bg-muted/30">
              {(ticketDetail?.messages || []).map((m, i) => (
                <div key={i} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.sender === "admin" ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
                    <p>{m.text}</p>
                    <p className={`text-[10px] mt-1 ${m.sender === "admin" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {formatDateTime(m.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply…" />
              <Button
                className="w-full"
                disabled={!reply.trim() || replyMutation.isPending}
                onClick={() => replyMutation.mutate()}
              >
                <Send className="h-4 w-4" /> Send reply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
