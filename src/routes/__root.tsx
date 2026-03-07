import {
  HeadContent,
  Outlet,
  Scripts,
  ScrollRestoration,
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
      { title: "Skim Pintar - Masjid Ar-Raudhah" },
    ],
    links: [{ rel: "stylesheet", href: appCss as string }],
  }),
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
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
