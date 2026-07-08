import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isAuthenticatedFromCookieStore } from "@/lib/auth/guard";

export default async function Home() {
  const cookieStore = await cookies();
  if (isAuthenticatedFromCookieStore(cookieStore)) {
    redirect("/lecturer/dashboard");
  }
  redirect("/login");
}
