import {
  createFileRoute,
  Outlet,
  Link,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { Home, Users, Receipt, UserCircle, LogOut } from "lucide-react";
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
  { to: "/member" as const, label: "Home", icon: Home, exact: true },
  { to: "/member/dependants" as const, label: "Family", icon: Users },
  { to: "/member/payments" as const, label: "Payments", icon: Receipt },
  { to: "/member/profile" as const, label: "Me", icon: UserCircle },
];

function MemberLayout() {
  const router = useRouter();
  const { session } = Route.useRouteContext();

  if (!session) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-cream font-[family-name:var(--font-family-body)]">
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col"
        style={{
          background: "linear-gradient(180deg, #032A21 0%, #064234 100%)",
        }}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
          <img src="/logo.webp" alt="" className="h-9 w-auto" />
          <div>
            <h1 className="font-[family-name:var(--font-family-heading)] text-base font-bold text-white">
              Skim Pintar
            </h1>
            <p className="text-[11px] text-white/40">Member Portal</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/80 [&.active]:bg-white/[0.1] [&.active]:text-white"
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/10 px-3 py-4">
          <button
            onClick={async () => {
              await authClient.signOut();
              router.navigate({ to: "/member/login" });
            }}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/70"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200/60 bg-white/80 px-5 py-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-2.5">
          <img src="/logo.webp" alt="" className="h-7 w-auto" />
          <span className="font-[family-name:var(--font-family-heading)] text-sm font-bold text-gd">
            Skim Pintar
          </span>
        </div>
        <button
          onClick={async () => {
            await authClient.signOut();
            router.navigate({ to: "/member/login" });
          }}
          className="rounded-lg p-2 text-txt3 transition-colors hover:bg-gray-100 hover:text-gd"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      {/* Main content */}
      <main className="pb-24 lg:pb-8 lg:pl-64">
        <div className="mx-auto max-w-2xl px-5 py-6 lg:px-8 lg:py-8">
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
              activeOptions={{ exact: item.exact }}
              className="flex flex-col items-center gap-0.5 px-3 py-2 text-txt3 transition-colors [&.active]:text-g1"
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
