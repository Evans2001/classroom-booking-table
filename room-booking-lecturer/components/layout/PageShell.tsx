import type { ReactNode } from "react";

import { CustomerBottomNav } from "@/components/layout/CustomerBottomNav";
import { CustomerTopbar } from "@/components/layout/CustomerTopbar";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-brand-primary/20">
      <CustomerTopbar />
      <main className="mx-auto w-full max-w-md px-4 pb-24 pt-6">{children}</main>
      <CustomerBottomNav />
    </div>
  );
}
