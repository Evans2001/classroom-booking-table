"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { AUTH_COOKIE_NAME } from "@/lib/utils/constants";

const titleMap: Record<string, string> = {
  "/customer/dashboard": "Customer Dashboard",
  "/customer/rooms": "Rooms",
  "/customer/bookings": "My Bookings",
  "/customer/bookings/new": "New Booking",
  "/customer/issues": "My Issues",
  "/customer/issues/new": "Report Issue",
  "/customer/notifications": "Notifications",
  "/customer/profile": "Profile",
};

export function CustomerTopbar() {
  const pathname = usePathname();
  const router = useRouter();

  const title = useMemo(() => {
    const direct = titleMap[pathname];
    if (direct) return direct;
    if (pathname.startsWith("/customer/rooms/")) return "Room Details";
    if (pathname.startsWith("/customer/issues/")) return "Issue Details";
    return "Room Booking";
  }, [pathname]);

  const logout = () => {
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`;
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-md items-center justify-between px-4">
        <h1 className="text-sm font-semibold text-slate-900">{title}</h1>
        <Button size="sm" variant="ghost" onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
