/**
 * Frontend (web) · api.ts - the ONE place where the website talks to the backend.
 * (Like a waiter: pages give it an order, it brings back the answer.)
 *
 * Usage:
 *   const me = await api<User>("/me");
 *   await api("/auth/login", { method: "POST", body: { phone, password } });
 *
 * It always:
 *   - adds /api/v1 in front of the path,
 *   - sends and reads JSON,
 *   - adds the X-SafeZone: 1 safety header when data is being changed,
 *   - turns every problem into an ApiError with a code and a readable message,
 *   - (Task 10) if the 15-minute log-in ticket has run out, it quietly asks the
 *     backend for new tickets (/auth/refresh) and tries the request once more,
 *     so people stay logged in for up to 7 days without noticing.
 */

/** An error from the backend, in our standard shape. */
export class ApiError extends Error {
  code: string; // e.g. "not_found", "invalid_input", "backend_unreachable"
  status: number; // HTTP status number, 0 if the network failed
  fields: Record<string, string>; // which form fields were wrong

  constructor(code: string, message: string, status: number, fields: Record<string, string> = {}) {
    super(message);
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

type Options = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown; // anything that can be turned into JSON
  signal?: AbortSignal; // lets a page cancel the request
};

// If several requests find an expired ticket at the same moment, they share ONE renewal.
let renewing: Promise<boolean> | null = null;

function renewTickets(): Promise<boolean> {
  renewing ??= fetch("/api/v1/auth/refresh", {
    method: "POST",
    headers: { "X-SafeZone": "1" },
    credentials: "same-origin",
  })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      renewing = null;
    });
  return renewing;
}

export async function api<T = unknown>(path: string, options: Options = {}): Promise<T> {
  const first = await send(path, options);

  // Ticket expired? Renew it once and try again (never for the log-in addresses themselves).
  if (first.status === 401 && !path.startsWith("/auth/") && (await renewTickets())) {
    return read<T>(await send(path, options));
  }
  return read<T>(first);
}

async function send(path: string, options: Options): Promise<Response> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET") headers["X-SafeZone"] = "1"; // CSRF safety header

  try {
    return await fetch(`/api/v1${path}`, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      credentials: "same-origin", // send the log-in cookies
      signal: options.signal,
    });
  } catch {
    // No answer at all: the internet is down or the website itself stopped.
    throw new ApiError("network", "Can't reach SafeZone. Check your internet connection.", 0);
  }
}

async function read<T>(response: Response): Promise<T> {
  // Read the answer as JSON (if it isn't JSON, data stays null).
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (data?.error) {
      throw new ApiError(data.error.code, data.error.message, response.status, data.error.fields ?? {});
    }
    // Not our error shape: the website could not reach the backend.
    throw new ApiError("backend_unreachable", "The SafeZone server is not responding.", response.status);
  }

  return data as T;
}
