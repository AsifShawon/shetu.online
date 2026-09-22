import type { Metadata } from "next";
import { Anek_Bangla, Poppins } from "next/font/google";

import "@/app/globals.css";
import "@/app/sd-dashboard.css";
import { MobileBottomNavShell } from "@/components/layout/mobile-bottom-nav-shell";
import { SessionProvider } from "@/components/layout/session-provider";

const anekBangla = Anek_Bangla({
  subsets: ["bengali", "latin"],
  variable: "--font-anek-bangla"
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins"
});

export const metadata: Metadata = {
  title: "সেতু | Shetu",
  description: "Study abroad platform for consultants, courses, and student guidance."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/shetu_logo.jpeg" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
        />
      </head>
      <body suppressHydrationWarning className={`${anekBangla.variable} ${poppins.variable}`}>
        <SessionProvider>
          <MobileBottomNavShell>{children}</MobileBottomNavShell>
        </SessionProvider>
      </body>
    </html>
  );
}
