const API_BASE = process.env.NEXT_PUBLIC_ROOM_BOOKING_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Request failed";
    try {
      const body = (await response.json()) as { error?: string };
      message = body.error ?? message;
    } catch {
      // Ignore non-JSON bodies.
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

function lecturerIdentityHeaders(): HeadersInit {
  if (typeof window === "undefined") {
    return {};
  }

  const identifier = sessionStorage.getItem("lecturer_account_identifier");
  const name = sessionStorage.getItem("lecturer_account_name");
  const department = sessionStorage.getItem("lecturer_account_department");
  const sessionToken = sessionStorage.getItem("lecturer_session_token");
  const headers: Record<string, string> = {};

  if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`;
  if (identifier) headers["X-Lecturer-Email"] = identifier;
  if (name) headers["X-Lecturer-Name"] = name;
  if (department) headers["X-Lecturer-Department"] = department;

  return headers;
}

function mergeHeaders(...sources: (HeadersInit | undefined)[]): Headers {
  const headers = new Headers();
  for (const source of sources) {
    if (!source) continue;
    new Headers(source).forEach((value, key) => {
      headers.set(key, value);
    });
  }
  return headers;
}

function lecturerProxyHeaders(source?: HeadersInit): HeadersInit {
  if (!source) {
    return {};
  }

  const incoming = new Headers(source);
  const headers: Record<string, string> = {};
  for (const name of ["authorization", "x-lecturer-email", "x-lecturer-name", "x-lecturer-department"]) {
    const value = incoming.get(name);
    if (value) headers[name] = value;
  }
  return headers;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    cache: "no-store",
    headers: lecturerIdentityHeaders(),
  });
  return parseResponse<T>(response);
}

export async function apiSend<T>(
  path: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown,
): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: {
      ...lecturerIdentityHeaders(),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return parseResponse<T>(response);
}

export async function proxyToBackend(path: string, init?: RequestInit): Promise<Response> {
  const upstream = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: mergeHeaders(lecturerProxyHeaders(init?.headers), { "Content-Type": "application/json" }),
    cache: "no-store",
  });
  const bodyText = await upstream.text();
  return new Response(bodyText, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
    },
  });
}
