import { proxyToBackend } from "@/lib/services/api-client";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyToBackend(`/api/lecturer/bookings/${id}`, {
    headers: request.headers,
  });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.text();
  return proxyToBackend(`/api/lecturer/bookings/${id}`, {
    method: "PUT",
    headers: request.headers,
    body,
  });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyToBackend(`/api/lecturer/bookings/${id}`, {
    method: "DELETE",
    headers: request.headers,
  });
}
