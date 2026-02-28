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
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 bg-white p-4 transition-transform md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-6">
          <Image
            src="/faculty-logo.svg"
            alt="Faculty of Engineering logo"
            width={39}
            height={50}
            className="mb-3 h-auto w-[39px] max-w-full"
            priority
          />
          <h2 className="text-base font-bold leading-snug text-slate-900">
            Faculty of Enigineering , Lectuer room Managment System
          </h2>
        </div>
        <nav className="space-y-1">
          {SIDEBAR_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
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
