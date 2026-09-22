"use client";

import type { PropsWithChildren } from "react";

import { AuthProvider } from "./auth-provider";
import { LangProvider } from "./lang-provider";
import { ToastProvider } from "./toast-provider";

export function SessionProvider({ children }: PropsWithChildren) {
  return (
    <LangProvider>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </LangProvider>
  );
}
