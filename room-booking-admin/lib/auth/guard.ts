import { redirect } from "next/navigation";

import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_VALUE,
} from "@/lib/utils/constants";

type CookieStoreLike = {
  get: (name: string) => { value: string } | undefined;
};

export function isAuthenticatedFromCookieStore(cookieStore: CookieStoreLike): boolean {
  return cookieStore.get(AUTH_COOKIE_NAME)?.value === AUTH_COOKIE_VALUE;
}

export function requireAuth(cookieStore: CookieStoreLike): void {
  if (!isAuthenticatedFromCookieStore(cookieStore)) {
    redirect("/login");
  }
}
