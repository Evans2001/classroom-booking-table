"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";
import { SIDEBAR_ITEMS } from "@/lib/utils/constants";

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ mobileOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close sidebar backdrop"
          className="fixed inset-0 z-40 bg-slate-950/40 md:hidden"
          onClick={onClose}
        />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-brand-maroon-hover bg-[#5E2726] p-4 transition-transform md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-8 flex flex-col items-center justify-center space-y-4 rounded-xl bg-white/5 p-4 py-6">
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-md">
              <Image
                src="/mylogo.png"
                alt="University of Ruhuna"
                width={160}
                height={190}
                className="h-full w-auto scale-[2.35] object-contain"
              />
            </div>
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-md">
              <Image
                src="/faculty-logo.svg"
                alt="Faculty of Engineering"
                width={155}
                height={200}
                className="h-full w-auto object-contain"
              />
            </div>
          </div>
          <h2 className="text-center text-xs font-bold uppercase leading-5 tracking-wide text-white">
            Faculty of Engineering Lecture Room Booking System
          </h2>
        </div>
        <nav className="space-y-2">
          {SIDEBAR_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "block px-4 py-2.5 text-sm transition-all",
                  active 
                    ? "bg-[#F3C033] text-slate-900 font-medium rounded-xl shadow-sm" 
                    : "rounded-lg font-medium text-white/80 hover:bg-white/10 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
