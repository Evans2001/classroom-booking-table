import type { ReactNode } from "react";

import { LecturerBottomNav } from "@/components/layout/LecturerBottomNav";
import { LecturerTopbar } from "@/components/layout/LecturerTopbar";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 selection:bg-brand-primary/20">
      <LecturerTopbar />
      <main className="mx-auto w-full max-w-md px-4 pb-24 pt-6">{children}</main>
      <LecturerBottomNav />
    </div>
  );
}
