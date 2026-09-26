"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { PAGE_TITLES } from "@/lib/utils/constants";

interface AdminTopbarProps {
  onMenuClick?: () => void;
}

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const pageTitle = useMemo(() => {
    const exactMatch = PAGE_TITLES[pathname];
    if (exactMatch) return exactMatch;

    if (pathname.startsWith("/admin/rooms/new")) return "Create Room";
    if (pathname.startsWith("/admin/rooms/")) return "Room Details";
    return "Room Booking Admin";
  }, [pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 shadow-sm backdrop-blur">
      <div className="flex h-20 items-center justify-between gap-4 px-6 md:px-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="md:hidden" onClick={onMenuClick} aria-label="Open navigation menu">
            Menu
          </Button>
          <h1 className="text-2xl font-bold text-brand-maroon tracking-tight">{pageTitle}</h1>
        </div>
        <button
          type="button"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-red-200 hover:bg-slate-50 hover:text-red-600 disabled:cursor-wait disabled:opacity-60"
          onClick={() => void handleLogout()}
          disabled={loggingOut}
        >
          {loggingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </header>
  );
}
