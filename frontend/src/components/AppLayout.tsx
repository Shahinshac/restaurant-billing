"use client";

import { useEffect } from "react";
import { socket } from "@/lib/socket";
import { Navigation } from "@/components/Navigation";
import { usePathname } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = pathname?.startsWith('/menu/');

  useEffect(() => {
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, []);

  if (isPublic) {
    return <main className="bg-white min-h-screen relative scroll-smooth">{children}</main>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--surface)]">
      <Navigation />
      <main className="flex-1 h-screen overflow-y-auto pb-16 md:pb-0 relative scroll-smooth">
        {children}
      </main>
    </div>
  );
}
