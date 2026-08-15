"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "sonner";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

type BaseLayoutProps = {
  children: React.ReactNode;
};

export function BaseLayout({ children }: BaseLayoutProps) {
  const pathname = usePathname();
  const isPrivateRoute = [
    "/dashboard",
    "/matches",
    "/profile",
    "/predictions",
    "/statistics",
  ].some((route) => pathname.startsWith(route));

  if (isPrivateRoute) {
    return (
      <>
        {children}
        <Toaster richColors position="top-right" closeButton />
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <Toaster richColors position="top-right" closeButton />
    </div>
  );
}
