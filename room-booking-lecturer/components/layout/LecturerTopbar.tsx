"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

import { AUTH_COOKIE_NAME } from "@/lib/utils/constants";

const titleMap: Record<string, string> = {
  "/lecturer/dashboard": "Lecturer Dashboard",
  "/lecturer/rooms": "Rooms",
  "/lecturer/bookings": "My Bookings",
  "/lecturer/bookings/new": "New Booking",
  "/lecturer/issues": "My Issues",
  "/lecturer/issues/new": "Report Issue",
  "/lecturer/notifications": "Notifications",
  "/lecturer/profile": "Profile",
};

export function LecturerTopbar() {
  const pathname = usePathname();
  const router = useRouter();

  const title = useMemo(() => {
    const direct = titleMap[pathname];
    if (direct) return direct;
    if (pathname.startsWith("/lecturer/rooms/")) return "Room Details";
    if (pathname.startsWith("/lecturer/issues/")) return "Issue Details";
    return "Room Booking";
  }, [pathname]);

  const logout = () => {
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`;
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-brand-primary to-[#7a393e] shadow-lg shadow-brand-primary/10">
      <div className="mx-auto flex h-16 w-full max-w-md items-center justify-between px-4">
        <h1 className="text-lg font-bold tracking-tight text-white drop-shadow-sm">{title}</h1>
        <button 
          onClick={logout}
          className="rounded-xl px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
