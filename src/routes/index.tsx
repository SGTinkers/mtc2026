import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary">Skim Pintar</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Masjid Ar-Raudhah Welfare Scheme
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          to="/member/login"
          className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
        >
          Member Login
        </Link>
        <Link
          to="/admin/login"
          className="rounded-lg border border-border px-6 py-3 font-medium text-foreground hover:bg-muted"
        >
          Admin Login
        </Link>
      </div>
    </div>
  );
}
