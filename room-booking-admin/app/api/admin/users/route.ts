import { errorResponse, json, requireAdminApiAuth } from "@/lib/server/api";
import { listAdminUsers } from "@/lib/server/database";

export function GET(request: Request) {
  const authError = requireAdminApiAuth(request);
  if (authError) return authError;
  try { return json(listAdminUsers()); }
  catch (error) { return errorResponse(error); }
}
