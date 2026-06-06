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
        <div className="mb-8 flex flex-col items-center justify-center space-y-5 rounded-xl bg-white/5 p-4 py-6">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-2 rounded-full h-16 w-16 flex items-center justify-center shadow-md overflow-hidden">
              <img src="/globe.svg" alt="University Logo Placeholder" className="h-full w-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerText = 'UoR'; }} />
            </div>
            <div className="bg-white p-2 rounded-full h-12 w-12 flex items-center justify-center shadow-md overflow-hidden">
              <img src="/faculty-logo.svg" alt="Faculty Logo Placeholder" className="h-full w-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerText = 'FoE'; }} />
            </div>
          </div>
          <h2 className="text-center text-sm font-bold uppercase tracking-wide text-white">
            Faculty of Engineering
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
