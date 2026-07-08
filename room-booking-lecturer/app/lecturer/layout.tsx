import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { PageShell } from "@/components/layout/PageShell";
import { requireAuth } from "@/lib/auth/guard";

export default async function LecturerLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  requireAuth(cookieStore);
  return <PageShell>{children}</PageShell>;
}
