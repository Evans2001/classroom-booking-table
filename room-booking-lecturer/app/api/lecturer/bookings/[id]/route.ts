import { proxyToBackend } from "@/lib/services/api-client";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyToBackend(`/api/lecturer/bookings/${id}`);
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.text();
  return proxyToBackend(`/api/lecturer/bookings/${id}`, {
    method: "PUT",
    body,
  });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyToBackend(`/api/lecturer/bookings/${id}`, {
    method: "DELETE",
  });
}
