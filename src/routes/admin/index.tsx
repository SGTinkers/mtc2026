import { createFileRoute } from "@tanstack/react-router";
import { getAdminStats } from "~/lib/server-fns.js";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "~/components/ui/card.js";
import { Users, CreditCard, DollarSign, Clock, ArrowUpCircle, Heart } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, Pie, PieChart, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "~/components/ui/chart.js";

export const Route = createFileRoute("/admin/")({
  loader: () => getAdminStats(),
  component: AdminDashboard,
});

// We use the CSS variables defined in app.css to perfectly match the theme
const THEME_COLORS = [
  'var(--color-primary)', // Teal #0f766e
  'var(--color-mint)',    // Bright Green #2DD4A8
  'var(--color-gold)',    // Yellow #F5C842
  'var(--color-accent)',  // Light Teal #14b8a6
  'var(--color-g1)',      // Deep Green #0D7C5F
  'var(--color-txt2)'     // Slate #4A5568
];

function AdminDashboard() {
  const stats = Route.useLoaderData();

  const cards = [
    {
      title: "Total Members",
      value: stats.totalMembers,
      icon: Users,
      color: "var(--color-primary)",
    },
    {
      title: "Active Subscriptions",
      value: stats.activeSubscriptions,
      icon: CreditCard,
      color: "var(--color-mint)",
    },
    {
      title: "Monthly Recurring Revenue",
      value: `$${Number(stats.mrr).toFixed(2)}`,
      icon: ArrowUpCircle,
      color: "var(--color-accent)",
    },
    {
      title: "Donations (This Month)",
      value: `$${Number(stats.donationsThisMonth).toFixed(2)}`,
      icon: Heart,
      color: "var(--color-gold)",
    },
    {
      title: "Total Revenue",
      value: `$${Number(stats.totalRevenue).toFixed(2)}`,
      icon: DollarSign,
      color: "var(--color-g1)",
    },
    {
      title: "Pending Payments",
      value: stats.pendingPayments,
      icon: Clock,
      color: "var(--color-txt2)",
    },
  ];

  // Configure charts
  const revenueChartConfig = {
    revenue: {
      label: "Revenue",
      color: "var(--color-primary)",
    },
  };

  const planChartConfig = stats.planBreakdown.reduce((acc, plan, i) => {
    const name = plan.planName || "Unknown";
    acc[name] = {
      label: name,
      color: THEME_COLORS[i % THEME_COLORS.length]!,
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  const paymentChartConfig = stats.paymentMethods.reduce((acc, p, i) => {
    const method = p.method || "Other";
    acc[method] = {
      label: method.replace('_', ' '),
      color: THEME_COLORS[(i + 2) % THEME_COLORS.length]!,
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  // Transform data for charts
  const planData = stats.planBreakdown.map((item, i) => ({
    name: item.planName || "Unknown",
    value: item.count,
    fill: THEME_COLORS[i % THEME_COLORS.length]!
  }));

  const paymentData = stats.paymentMethods.map((item, i) => ({
    name: (item.method || "Other").replace('_', ' '),
    value: item.count,
    fill: THEME_COLORS[(i + 2) % THEME_COLORS.length]!
  }));

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title} className="border-2 shadow-md transition-all hover:shadow-lg border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-primary/70 uppercase tracking-wider">
                {card.title}
              </CardTitle>
              <card.icon className="h-6 w-6" style={{ color: card.color }} />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary tabular-nums tracking-tight">
                {card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Charts Area */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Revenue Trend - Spans 4 columns on large screens */}
        <Card className="col-span-4 flex flex-col border-2 shadow-md border-primary/10">
          <CardHeader className="pb-0">
            <CardTitle className="text-xl font-bold text-primary">Revenue Overview</CardTitle>
            <CardDescription className="text-sm text-primary/60">Monthly revenue for the past 12 months</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pt-6">
            <ChartContainer config={revenueChartConfig} className="h-full min-h-[400px] w-full">
              <AreaChart 
                data={stats.monthlyRevenue} 
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  stroke="var(--color-primary)" 
                  fontSize={12} 
                  fontWeight={500}
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => value.slice(0, 3)}
                  tickMargin={12}
                  style={{ opacity: 0.7 }}
                />
                <ChartTooltip
                  cursor={{ stroke: 'var(--color-primary)', strokeWidth: 1.5 }}
                  content={<ChartTooltipContent 
                    className="text-sm"
                    formatter={(value) => `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                  />}
                />
                <Area 
                  dataKey="revenue" 
                  type="natural"
                  fill="url(#fillRevenue)" 
                  fillOpacity={1}
                  stroke="var(--color-primary)"
                  strokeWidth={3}
                  animationDuration={1500}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Plan Breakdown - Spans 3 columns on large screens */}
        <Card className="col-span-3 flex flex-col border-2 shadow-md border-primary/10">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-primary">Membership Plans</CardTitle>
            <CardDescription className="text-sm text-primary/60">Breakdown of active subscriptions</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center items-center pb-8">
            {stats.planBreakdown.length > 0 ? (
              <>
                <ChartContainer config={planChartConfig} className="mx-auto aspect-square max-h-[350px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel className="text-sm" />} />
                    <Pie
                      data={planData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={3}
                      stroke="var(--color-background)"
                    >
                      {planData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                  {planData.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-xs font-semibold uppercase tracking-wide text-primary/70">{item.name}</span>
                      <span className="text-md font-bold text-primary">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-primary/40 flex items-center justify-center h-full text-lg font-medium">No active subscriptions</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Row */}
      <div className="grid gap-8 md:grid-cols-2">
        <Card className="flex flex-col border-2 shadow-md border-primary/10">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-primary">Payment Methods</CardTitle>
            <CardDescription className="text-sm text-primary/60">Distribution of payment methods used</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center items-center pb-8">
             {stats.paymentMethods.length > 0 ? (
              <>
                <ChartContainer config={paymentChartConfig} className="mx-auto aspect-square max-h-[300px] w-full">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel className="text-sm" />} />
                    <Pie
                      data={paymentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={3}
                      stroke="var(--color-background)"
                    >
                      {paymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                  {paymentData.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-xs font-semibold uppercase tracking-wide text-primary/70">{item.name}</span>
                      <span className="text-md font-bold text-primary">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-primary/40 flex items-center justify-center h-full text-lg font-medium">No payment data yet</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-2 shadow-md border-primary/10">
           <CardHeader>
            <CardTitle className="text-xl font-bold text-primary">Quick Actions</CardTitle>
            <CardDescription className="text-sm text-primary/60">Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 pt-4">
             <a href="/admin/members" className="flex items-center gap-6 p-6 rounded-2xl border-2 border-primary/10 hover:bg-primary/5 transition-all hover:scale-[1.01] hover:border-primary/30 group">
               <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                 <Users className="h-7 w-7 text-primary" />
               </div>
               <div>
                 <div className="text-lg font-bold text-primary">Manage Members</div>
                 <div className="text-sm text-primary/60 font-medium">Add or update member records</div>
               </div>
             </a>
             <a href="/admin/payments" className="flex items-center gap-6 p-6 rounded-2xl border-2 border-primary/10 hover:bg-primary/5 transition-all hover:scale-[1.01] hover:border-mint/30 group">
               <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mint/10 group-hover:bg-mint/20 transition-colors">
                 <DollarSign className="h-7 w-7 text-mint" />
               </div>
               <div>
                 <div className="text-lg font-bold text-primary">Record Payments</div>
                 <div className="text-sm text-primary/60 font-medium">Log incoming manual payments</div>
               </div>
             </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
