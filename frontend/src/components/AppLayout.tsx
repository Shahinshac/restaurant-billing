"use client";

import { useEffect } from "react";
import { socket } from "@/lib/socket";
import { Navigation } from "@/components/Navigation";
import { usePathname, useRouter } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = pathname?.startsWith('/menu/');
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    // Socket connection
    socket.connect();

    // Auth check
    if (!isPublic && !isLoginPage) {
      const isLoggedIn = localStorage.getItem("isLoggedIn");
      if (!isLoggedIn) {
        router.push("/login");
      }
    }

    return () => {
      socket.disconnect();
    };
  }, [pathname, isPublic, isLoginPage, router]);

  if (isPublic || isLoginPage) {
    return <main className="min-h-screen relative scroll-smooth">{children}</main>;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-deep)' }}>
      <Navigation />
      <main className="flex-1 h-screen overflow-y-auto pb-20 md:pb-0 relative scroll-smooth custom-scroll">
        {children}
      </main>
    </div>
  );
}
