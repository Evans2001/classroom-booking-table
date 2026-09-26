import { apiGet, apiSend } from "@/lib/services/api-client";
import type { AdminUser } from "@/lib/types/user";

export function listUsers() { return apiGet<AdminUser[]>("/api/admin/users"); }
export function deleteUser(id: string) {
  return apiSend<{ success: boolean }>(`/api/admin/users/${encodeURIComponent(id)}`, "DELETE");
}
