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
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="md:hidden" onClick={onMenuClick}>
            Menu
          </Button>
          <h1 className="text-lg font-semibold text-slate-900">{pageTitle}</h1>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
