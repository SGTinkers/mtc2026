import { createFileRoute, Link } from "@tanstack/react-router";
import { getAdminStats } from "~/lib/server-fns.js";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "~/components/ui/card.js";
import { Users, CreditCard, DollarSign, Clock, TrendingUp, UserPlus, ArrowRight, AlertTriangle } from "lucide-react";
import { SubscriptionStatusBadge } from "~/components/subscription-status-badge.js";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "~/components/ui/table.js";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "~/components/ui/chart.js";


export const Route = createFileRoute("/admin/")({
  loader: () => getAdminStats(),
  component: AdminDashboard,
});

const CHART_COLORS = [
  "#0f766e",
  "#2DD4A8",
  "#F5C842",
  "#14b8a6",
  "#0D7C5F",
  "#64748b",
];

function AdminDashboard() {
  const stats = Route.useLoaderData();
  const { session } = Route.useRouteContext();

  const firstName = session?.user?.name?.split(" ")[0] ?? "Admin";

  const cards = [
    {
      title: "Total Members",
      value: stats.totalMembers,
      icon: Users,
      iconBg: "bg-teal-50",
      iconColor: "text-teal-600",
    },
    {
      title: "Active Subscriptions",
      value: stats.activeSubscriptions,
      icon: CreditCard,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      title: "Monthly Recurring Donation",
      value: `$${Number(stats.mrr).toFixed(2)}`,
      icon: TrendingUp,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "New Donors this Month",
      value: stats.newMembersThisMonth,
      icon: UserPlus,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      title: "Total Revenue",
      value: `$${Number(stats.totalRevenue).toFixed(2)}`,
      icon: DollarSign,
      iconBg: "bg-green-50",
      iconColor: "text-green-700",
    },
  ];

  const revenueChartConfig = {
    revenue: {
      label: "Revenue",
      color: "#0f766e",
    },
  };

  const paymentChartConfig = stats.paymentMethods.reduce((acc, p, i) => {
    const method = p.method || "Other";
    acc[method] = {
      label: method.replace("_", " "),
      color: CHART_COLORS[(i + 2) % CHART_COLORS.length]!,
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  const paymentData = stats.paymentMethods.map((item, i) => ({
    name: (item.method || "Other").replace("_", " "),
    value: item.count,
    fill: CHART_COLORS[(i + 2) % CHART_COLORS.length]!,
  }));

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-6 pb-10 max-w-[1400px]">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          Welcome back, {firstName}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <Card
            key={card.title}
            className="border border-border/60 shadow-sm hover:shadow-md transition-shadow bg-white"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.iconBg}`}>
                  <card.icon className={`h-[18px] w-[18px] ${card.iconColor}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground tabular-nums tracking-tight">
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{card.title}</p>
            </CardContent>
          </Card>
        ))}
        <Link to="/admin/members" search={{ page: 1, status: "pending_payment" }}>
          <Card className="border border-amber-200 shadow-sm hover:shadow-md hover:ring-1 ring-amber-200 transition-all bg-white cursor-pointer h-full">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                  <Clock className="h-[18px] w-[18px] text-amber-600" />
                </div>
                <ArrowRight className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-foreground tabular-nums tracking-tight">
                {stats.pendingPayments}
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Pending Payments</p>
              <p className="text-xs text-amber-600 mt-1.5 font-medium">View members &rarr;</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="lg:col-span-4 border border-border/60 shadow-sm bg-white">
          <CardHeader className="pb-0 px-6 pt-5">
            <CardTitle className="text-base font-semibold text-foreground">Revenue Overview</CardTitle>
            <CardDescription className="text-xs">Monthly revenue for the past 12 months</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 px-2 pb-4">
            <ChartContainer config={revenueChartConfig} className="h-[340px] w-full">
              <AreaChart
                data={stats.monthlyRevenue}
                margin={{ top: 16, right: 24, left: 0, bottom: 8 }}
              >
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f766e" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#0f766e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="month"
                  fontSize={11}
                  fontWeight={500}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                  tickMargin={10}
                  stroke="#94a3b8"
                />
                <YAxis
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                  width={50}
                  stroke="#94a3b8"
                />
                <ChartTooltip
                  cursor={{ stroke: "#cbd5e1", strokeWidth: 1 }}
                  content={
                    <ChartTooltipContent
                      className="text-sm"
                      formatter={(value) =>
                        `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                      }
                    />
                  }
                />
                <Area
                  dataKey="revenue"
                  type="monotone"
                  fill="url(#fillRevenue)"
                  fillOpacity={1}
                  stroke="#0f766e"
                  strokeWidth={2}
                  animationDuration={1200}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="lg:col-span-3 border border-border/60 shadow-sm bg-white">
          <CardHeader className="px-6 pt-5 pb-0">
            <CardTitle className="text-base font-semibold text-foreground">Payment Methods</CardTitle>
            <CardDescription className="text-xs">Distribution of payment methods</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center items-center pt-2 pb-6">
            {stats.paymentMethods.length > 0 ? (
              <>
                <ChartContainer
                  config={paymentChartConfig}
                  className="mx-auto aspect-square max-h-[260px] w-full"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel className="text-sm" />} />
                    <Pie
                      data={paymentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="#fff"
                    >
                      {paymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2">
                  {paymentData.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-xs text-muted-foreground">{item.name}</span>
                      <span className="text-xs font-semibold text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-muted-foreground flex items-center justify-center h-full text-sm">
                No payment data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Payments List */}
      {stats.pendingMembers.length > 0 && (
        <Card className="border border-amber-200/60 shadow-sm bg-white">
          <CardHeader className="px-6 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-base font-semibold text-foreground">
                Pending Payments ({stats.pendingMembers.length})
              </CardTitle>
            </div>
            <CardDescription className="text-xs">Members requiring payment attention</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Coverage Until</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.pendingMembers.map((m) => (
                  <TableRow key={m.memberId}>
                    <TableCell>
                      <Link
                        to="/admin/members/$id"
                        params={{ id: m.memberId }}
                        className="hover:underline"
                      >
                        <div className="font-medium">{m.memberName}</div>
                        <div className="text-xs text-muted-foreground">{m.memberEmail}</div>
                      </Link>
                    </TableCell>
                    <TableCell>{m.planName}</TableCell>
                    <TableCell>${Number(m.monthlyAmount).toFixed(2)}/mo</TableCell>
                    <TableCell>{m.coverageUntil}</TableCell>
                    <TableCell>
                      <SubscriptionStatusBadge status={m.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Bottom Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Membership Plans */}
        <Card className="border border-border/60 shadow-sm bg-white">
          <CardHeader className="px-6 pt-5 pb-3">
            <CardTitle className="text-base font-semibold text-foreground">Membership Plans</CardTitle>
            <CardDescription className="text-xs">Active subscription breakdown</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 px-6 pb-5">
            {stats.planBreakdown.length > 0 ? (
              stats.planBreakdown.map((plan, i) => (
                <div key={plan.planName} className="flex items-center gap-3">
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  />
                  <span className="text-sm text-foreground flex-1">{plan.planName || "Unknown"}</span>
                  <span className="text-sm font-bold text-foreground tabular-nums">{plan.count}</span>
                </div>
              ))
            ) : (
              <div className="text-muted-foreground text-sm py-4 text-center">
                No active subscriptions
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border border-border/60 shadow-sm bg-white">
          <CardHeader className="px-6 pt-5 pb-3">
            <CardTitle className="text-base font-semibold text-foreground">Quick Actions</CardTitle>
            <CardDescription className="text-xs">Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 px-4 pb-5">
            <Link
              to="/admin/members/new"
              className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-amber-200/60 bg-amber-50/40 hover:bg-amber-50 transition-colors group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 group-hover:bg-amber-200/70 transition-colors">
                <UserPlus className="h-[18px] w-[18px] text-amber-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">Walk-In Registration</div>
                <div className="text-xs text-muted-foreground">Register a new member</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" />
            </Link>
            <Link
              to="/admin/members"
              search={{ page: 1 }}
              className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-border/40 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-slate-200/70 transition-colors">
                <Users className="h-[18px] w-[18px] text-slate-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">Manage Members</div>
                <div className="text-xs text-muted-foreground">View and update records</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" />
            </Link>
            <Link
              to="/admin/payments"
              search={{ page: 1 }}
              className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-border/40 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 group-hover:bg-teal-100/70 transition-colors">
                <DollarSign className="h-[18px] w-[18px] text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">Record Payments</div>
                <div className="text-xs text-muted-foreground">Log manual payments</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
