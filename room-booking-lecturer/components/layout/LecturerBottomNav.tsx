"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertCircle, Building2, CalendarCheck2, CalendarDays, House, UserRound, type LucideIcon } from "lucide-react";

import { MOBILE_NAV_ITEMS } from "@/lib/utils/constants";

const NAV_ICONS: Record<(typeof MOBILE_NAV_ITEMS)[number]["href"], LucideIcon> = {
  "/lecturer/dashboard": House,
  "/lecturer/rooms": Building2,
  "/lecturer/bookings": CalendarCheck2,
  "/lecturer/calendar": CalendarDays,
  "/lecturer/issues": AlertCircle,
  "/lecturer/profile": UserRound,
};

export function LecturerBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-100 bg-white pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
      <div className="mx-auto grid h-16 w-full max-w-md grid-cols-6 px-1">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = NAV_ICONS[item.href];
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group relative flex flex-col items-center justify-center gap-1 text-[10px] sm:text-xs font-bold transition-all duration-300 ${
                active ? "text-brand-primary scale-[1.02]" : "text-slate-400 hover:text-slate-800"
              }`}
            >
              {active && (
                <div aria-hidden="true" className="absolute top-0 h-1 w-8 rounded-b-full bg-brand-primary shadow-[0_2px_8px_rgba(92,44,48,0.4)]" />
              )}
              <Icon aria-hidden="true" className="relative z-10 h-4.5 w-4.5" />
              <span className="relative z-10">{item.label}</span>
              {active && <div aria-hidden="true" className="absolute inset-1 rounded-xl bg-brand-primary/5 -z-10" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
