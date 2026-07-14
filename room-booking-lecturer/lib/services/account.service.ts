import { apiSend } from "@/lib/services/api-client";
import type { LecturerAccount, LecturerAccountRequest, LecturerAccountRequestInput } from "@/lib/types/account";

export async function submitAccountRequest(input: LecturerAccountRequestInput): Promise<LecturerAccountRequest> {
  return apiSend<LecturerAccountRequest>("/api/lecturer/account-requests", "POST", input);
}

export async function loginLecturer(identifier: string, password: string): Promise<LecturerAccount> {
  return apiSend<LecturerAccount>("/api/lecturer/auth/login", "POST", { identifier, password });
}

export async function changeLecturerPassword(
  identifier: string,
  currentPassword: string,
  nextPassword: string,
): Promise<LecturerAccount> {
  return apiSend<LecturerAccount>("/api/lecturer/auth/change-password", "POST", {
    identifier,
    currentPassword,
    nextPassword,
  });
}
