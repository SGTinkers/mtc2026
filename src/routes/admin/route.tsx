import { createFileRoute, Outlet, Link, redirect, useRouter, useMatch } from "@tanstack/react-router";
import { LayoutDashboard, Users, CreditCard, LogOut } from "lucide-react";
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
  { to: "/admin/members" as const, label: "Members", icon: Users },
  { to: "/admin/payments" as const, label: "Payments", icon: CreditCard },
];

function AdminLayout() {
  const router = useRouter();
  const { session } = Route.useRouteContext();

  // Login page renders without the sidebar layout
  if (!session) {
    return <Outlet />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-64 flex-col border-r border-border bg-card">
        <div className="border-b border-border p-6">
          <div className="flex items-center gap-3">
            <img src="/logo.webp" alt="Masjid Ar-Raudhah" className="h-10 w-auto" />
            <div>
              <h1 className="text-lg font-bold text-primary">Skim Pintar</h1>
              <p className="text-xs text-muted-foreground">Admin Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground [&.active]:bg-secondary [&.active]:text-primary"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-4">
          <button
            onClick={async () => {
              await authClient.signOut();
              router.navigate({ to: "/admin/login" });
            }}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-background p-8">
        <Outlet />
      </main>
    </div>
  );
}
