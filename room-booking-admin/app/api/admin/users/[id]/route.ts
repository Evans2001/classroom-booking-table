import { errorResponse, json, requireAdminApiAuth } from "@/lib/server/api";
import { deleteAdminUser } from "@/lib/server/database";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireAdminApiAuth(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    if (!deleteAdminUser(id)) return json({ error: "User not found." }, { status: 404 });
    return json({ success: true });
  } catch (error) { return errorResponse(error); }
}
