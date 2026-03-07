import { createFileRoute } from "@tanstack/react-router";
import { getAdminStats } from "~/lib/server-fns.js";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card.js";
import { Users, CreditCard, DollarSign, Clock } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  loader: () => getAdminStats(),
  component: AdminDashboard,
});

function AdminDashboard() {
  const stats = Route.useLoaderData();

  const cards = [
    {
      title: "Total Members",
      value: stats.totalMembers,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Active Subscriptions",
      value: stats.activeSubscriptions,
      icon: CreditCard,
      color: "text-emerald-600",
    },
    {
      title: "Total Revenue",
      value: `$${Number(stats.totalRevenue).toFixed(2)}`,
      icon: DollarSign,
      color: "text-primary",
    },
    {
      title: "Pending Payments",
      value: stats.pendingPayments,
      icon: Clock,
      color: "text-amber-600",
    },
  ];

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Dashboard</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
