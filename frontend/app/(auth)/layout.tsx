import type { PropsWithChildren } from "react";

import { PublicShell } from "@/components/legacy/public-shell";

export default function AuthLayout({ children }: PropsWithChildren) {
  return <PublicShell>{children}</PublicShell>;
}
