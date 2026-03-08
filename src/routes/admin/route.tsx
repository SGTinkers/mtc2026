import { createFileRoute, Outlet, Link, redirect, useRouter } from "@tanstack/react-router";
import { LayoutDashboard, Users, CreditCard, ScrollText, Shield, LogOut, ChevronRight } from "lucide-react";
import { getServerSession } from "~/lib/server-auth.js";
import { authClient } from "~/lib/auth-client.js";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/admin/login") {
      return { session: null };
    }
    const session = await getServerSession();
    if (!session || session.user.role !== "admin") {
      throw redirect({ to: "/admin/login" });
    }
    return { session };
  },
  component: AdminLayout,
});

const navItems = [
  { to: "/admin" as const, label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/members" as const, label: "Members", icon: Users, search: { page: 1 } },
  { to: "/admin/payments" as const, label: "Payments", icon: CreditCard, search: { page: 1 } },
  { to: "/admin/audit" as const, label: "Audit Trail", icon: ScrollText },
  { to: "/admin/admins" as const, label: "Admins", icon: Shield },
];

function AdminLayout() {
  const router = useRouter();
  const { session } = Route.useRouteContext();

  // Login page renders without the sidebar layout
  if (!session) {
    return <Outlet />;
  }

  const initials = session.user.name
    ? session.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AD";

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-60 lg:flex-col bg-[#0c1222] text-white/70">
        {/* Brand */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <img src="/logo.webp" alt="Masjid Ar-Raudhah" className="h-9 w-auto rounded-lg" />
            <div>
              <h1 className="text-[15px] font-semibold text-white tracking-tight">Skim Pintar</h1>
              <p className="text-[11px] text-white/40 font-medium">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          <p className="px-3 pt-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">Menu</p>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              search={"search" in item ? item.search : undefined}
              activeOptions={{ exact: item.exact }}
              className="group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors hover:bg-white/[0.06] hover:text-white [&.active]:bg-white/[0.08] [&.active]:text-white"
            >
              <item.icon className="h-[18px] w-[18px] shrink-0 opacity-60 group-[&.active]:opacity-100" />
              <span className="flex-1">{item.label}</span>
              <ChevronRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 transition-all group-hover:opacity-40 group-hover:translate-x-0 group-[&.active]:opacity-40 group-[&.active]:translate-x-0" />
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-white/[0.06] p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/80 text-[11px] font-bold text-white">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-white/90 truncate">{session.user.name}</p>
              <p className="text-[11px] text-white/35 truncate">{session.user.email}</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await authClient.signOut();
              router.navigate({ to: "/admin/login" });
            }}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-white/40 hover:bg-white/[0.06] hover:text-white/70 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200/60 bg-white/80 px-5 py-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-2.5">
          <img src="/logo.webp" alt="Masjid Ar-Raudhah" className="h-7 w-auto rounded-lg" />
          <span className="text-sm font-semibold text-[#0c1222] tracking-tight">Skim Pintar</span>
        </div>
        <button
          onClick={async () => {
            await authClient.signOut();
            router.navigate({ to: "/admin/login" });
          }}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      {/* Main content */}
      <main className="pb-24 lg:pb-8 lg:pl-60">
        <div className="px-4 py-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200/60 bg-white/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              search={"search" in item ? item.search : undefined}
              activeOptions={{ exact: item.exact }}
              className="flex flex-col items-center gap-0.5 px-3 py-2 text-gray-400 transition-colors [&.active]:text-[#0c1222]"
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
