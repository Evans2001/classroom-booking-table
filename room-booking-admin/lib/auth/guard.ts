import { redirect } from "next/navigation";

import { isValidAdminSession } from "@/lib/server/admin-auth";
import { AUTH_COOKIE_NAME } from "@/lib/utils/constants";

type CookieStoreLike = {
  get: (name: string) => { value: string } | undefined;
};

export function isAuthenticatedFromCookieStore(cookieStore: CookieStoreLike): boolean {
  return isValidAdminSession(cookieStore.get(AUTH_COOKIE_NAME)?.value);
}

export function requireAuth(cookieStore: CookieStoreLike): void {
  if (!isAuthenticatedFromCookieStore(cookieStore)) {
    redirect("/login");
  }
}
