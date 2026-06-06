"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { AUTH_COOKIE_NAME, PAGE_TITLES } from "@/lib/utils/constants";

interface AdminTopbarProps {
  onMenuClick?: () => void;
}

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const pageTitle = useMemo(() => {
    const exactMatch = PAGE_TITLES[pathname];
    if (exactMatch) return exactMatch;

    if (pathname.startsWith("/admin/rooms/new")) return "Create Room";
    if (pathname.startsWith("/admin/rooms/")) return "Room Details";
    return "Room Booking Admin";
  }, [pathname]);

  const handleLogout = () => {
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`;
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 shadow-sm backdrop-blur">
      <div className="flex h-20 items-center justify-between gap-4 px-6 md:px-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="md:hidden" onClick={onMenuClick}>
            Menu
          </Button>
          <h1 className="text-2xl font-bold text-brand-maroon tracking-tight">{pageTitle}</h1>
        </div>
        <button className="bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-red-600 hover:border-red-200 rounded-xl px-4 py-2 text-sm font-semibold transition-all shadow-sm" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
