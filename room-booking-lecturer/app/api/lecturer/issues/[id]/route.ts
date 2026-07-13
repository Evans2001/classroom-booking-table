import { proxyToBackend } from "@/lib/services/api-client";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyToBackend(`/api/lecturer/issues/${id}`);
}
