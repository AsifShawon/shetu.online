"use client";

import type { PropsWithChildren } from "react";
import { usePathname } from "next/navigation";

import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

export function MobileBottomNavShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const hideOnAdmin = pathname.startsWith("/admin");

  return (
    <div className={`${hideOnAdmin ? "pb-0" : "pb-24 lg:pb-0"} min-h-screen overflow-x-clip`}>
      {children}
      <MobileBottomNav />
    </div>
  );
}

