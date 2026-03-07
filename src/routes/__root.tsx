import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

// @ts-expect-error -- Vite ?url import not typed
import appCss from "../styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Masjid Ar-Raudhah" },
    ],
    links: [
      { rel: "icon", href: "/logo.webp", type: "image/webp" },
      { rel: "stylesheet", href: appCss as string },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,800;1,9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  notFoundComponent: () => (
    <RootDocument>
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">404</h1>
          <p className="text-muted-foreground">The page you are looking for could not be found.</p>
          <a href="/" className="inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground">
            Return Home
          </a>
        </div>
      </div>
    </RootDocument>
  ),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
