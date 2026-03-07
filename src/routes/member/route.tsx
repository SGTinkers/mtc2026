import {
  createFileRoute,
  Outlet,
  Link,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { Home, CreditCard, Users, Receipt, UserCircle, LogOut } from "lucide-react";
import { getServerSession } from "~/lib/server-auth.js";
import { authClient } from "~/lib/auth-client.js";

export const Route = createFileRoute("/member")({
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/member/login") {
      return { session: null };
    }
    const session = await getServerSession();
    if (!session) {
      throw redirect({ to: "/member/login" });
    }
    return { session };
  },
  component: MemberLayout,
});

const navItems = [
  { to: "/member" as const, label: "Dashboard", icon: Home, exact: true },
  { to: "/member/subscription" as const, label: "Subscription", icon: CreditCard },
  { to: "/member/dependants" as const, label: "Dependants", icon: Users },
  { to: "/member/payments" as const, label: "Payments", icon: Receipt },
  { to: "/member/profile" as const, label: "Profile", icon: UserCircle },
];

function MemberLayout() {
  const router = useRouter();
  const { session } = Route.useRouteContext();

  if (!session) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-r border-border bg-card">
        <div className="border-b border-border p-6">
          <div className="flex items-center gap-3">
            <img src="/logo.webp" alt="Masjid Ar-Raudhah" className="h-10 w-auto" />
            <div>
              <h1 className="text-lg font-bold text-primary">Skim Pintar</h1>
              <p className="text-xs text-muted-foreground">Member Portal</p>
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
              router.navigate({ to: "/member/login" });
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
