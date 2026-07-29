import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, icon: Icon, trend, trendLabel, accent = "default" }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5 flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold mt-1 tracking-tight">{value}</p>
          {trendLabel && (
            <p
              className={cn(
                "text-xs mt-1.5 font-medium",
                trend === "up" && "text-success",
                trend === "down" && "text-destructive",
                !trend && "text-muted-foreground"
              )}
            >
              {trendLabel}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              accent === "default" && "bg-primary text-primary-foreground",
              accent === "muted" && "bg-muted text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
