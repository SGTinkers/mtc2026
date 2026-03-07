import { Badge } from "~/components/ui/badge.js";

const statusVariant = {
  active: "success",
  pending_payment: "warning",
  grace: "warning",
  lapsed: "destructive",
  cancelled: "destructive",
} as const;

type Status = keyof typeof statusVariant;

export function SubscriptionStatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant={statusVariant[status] ?? "secondary"}>
      {status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
    </Badge>
  );
}
