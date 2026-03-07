import { createFileRoute } from "@tanstack/react-router";
import { getAdminStats } from "~/lib/server-fns.js";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "~/components/ui/card.js";
import { Users, CreditCard, DollarSign, Clock, ArrowUpCircle, Heart } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer, Pie, PieChart, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "~/components/ui/chart.js";

export const Route = createFileRoute("/admin/")({
  loader: () => getAdminStats(),
  component: AdminDashboard,
});

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

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
      title: "Monthly Recurring Revenue",
      value: `$${Number(stats.mrr).toFixed(2)}`,
      icon: ArrowUpCircle,
      color: "text-indigo-600",
    },
    {
      title: "Donations (This Month)",
      value: `$${Number(stats.donationsThisMonth).toFixed(2)}`,
      icon: Heart,
      color: "text-rose-500",
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

  // Configure charts
  const revenueChartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--primary))",
    },
  };

  const planChartConfig = stats.planBreakdown.reduce((acc, plan, i) => {
    acc[plan.planName] = {
      label: plan.planName,
      color: COLORS[i % COLORS.length],
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  const paymentChartConfig = stats.paymentMethods.reduce((acc, p, i) => {
    acc[p.method] = {
      label: p.method.replace('_', ' '),
      color: COLORS[(i + 2) % COLORS.length],
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  // Transform data for charts
  const planData = stats.planBreakdown.map((item, i) => ({
    name: item.planName,
    value: item.count,
    fill: COLORS[i % COLORS.length]
  }));

  const paymentData = stats.paymentMethods.map((item, i) => ({
    name: item.method.replace('_', ' '),
    value: item.count,
    fill: COLORS[(i + 2) % COLORS.length]
  }));

  return (
    <div className="flex flex-col gap-8 pb-8">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Charts Area */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Revenue Trend - Spans 4 columns on large screens */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue for the past 12 months</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={revenueChartConfig} className="min-h-[300px] w-full">
              <BarChart data={stats.monthlyRevenue} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                  content={<ChartTooltipContent 
                    formatter={(value) => `$${Number(value).toFixed(2)}`}
                  />}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="var(--color-revenue)" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Plan Breakdown - Spans 3 columns on large screens */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Membership Plans</CardTitle>
            <CardDescription>Breakdown of active subscriptions</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[300px]">
            {stats.planBreakdown.length > 0 ? (
              <ChartContainer config={planChartConfig} className="w-full h-full">
                <PieChart>
                  <Pie
                    data={planData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {planData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend 
                    content={<ChartLegendContent />} 
                    className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center" 
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="text-muted-foreground flex items-center justify-center h-full">No active subscriptions</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Distribution of payment methods used</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[250px]">
             {stats.paymentMethods.length > 0 ? (
              <ChartContainer config={paymentChartConfig} className="w-full h-full">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} className="-translate-y-2" />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="text-muted-foreground flex items-center justify-center h-full">No payment data yet</div>
            )}
          </CardContent>
        </Card>
        
        <Card>
           <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
             <a href="/admin/members" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
               <Users className="h-5 w-5 text-blue-500" />
               <div>
                 <div className="font-medium">Manage Members</div>
                 <div className="text-sm text-muted-foreground">Add or update member records</div>
               </div>
             </a>
             <a href="/admin/payments" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
               <DollarSign className="h-5 w-5 text-emerald-500" />
               <div>
                 <div className="font-medium">Record Payments</div>
                 <div className="text-sm text-muted-foreground">Log incoming manual payments</div>
               </div>
             </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

