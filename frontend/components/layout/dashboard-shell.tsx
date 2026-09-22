import Link from "next/link";
import type { Route } from "next";
import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

interface DashboardShellProps extends PropsWithChildren {
  title: string;
  subtitle: string;
  navigation: ReadonlyArray<{ label: string; href: Route }>;
}

export function DashboardShell({
  title,
  subtitle,
  navigation,
  children
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-mesh">
      <div className="container grid gap-6 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-3xl border border-border/70 bg-card/95 p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            Shetu
          </p>
          <h1 className="mt-3 text-2xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <nav className="mt-6 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                className={cn(
                  "block rounded-2xl px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                )}
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
}
