export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Accounts, profile and favorites use mockServer.ts unless VITE_USE_MOCK_AUTH=false (VITE_USE_MOCK only covers movies).
export const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH !== "false";

export class ApiError extends Error {
  status: number;
  // Keyed by the form's field name, e.g. "firstName".
  fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export const messageOf = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong. Please try again.";

let token: string | null = null;
let onUnauthorized = () => {};

export const setAuthToken = (t: string | null) => { token = t; };
export const getAuthToken = () => token;
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn; };

const toCamel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

const toLabel = (s: string) => (s.charAt(0).toUpperCase() + s.slice(1)).replace(/_/g, " ");

// FastAPI sends { detail: "message" }, or for failed field checks (422) { detail: [{ loc, msg }, ...] }.
function toApiError(status: number, data: any): ApiError {
  const detail = data?.detail;
  if (typeof detail === "string") return new ApiError(status, detail);
  if (Array.isArray(detail)) {
    const fieldErrors: Record<string, string> = {};
    const lines: string[] = [];
    for (const d of detail) {
      const field = d?.loc?.[d.loc.length - 1];
      const msg = String(d?.msg ?? "This value isn't valid.");
      if (typeof field === "string") {
        fieldErrors[toCamel(field)] = msg;
        lines.push(`${toLabel(field)}: ${msg}`);
      } else lines.push(msg);
    }
    // The fields are also listed in the message, because the form may not have an input with the backend's name.
    return new ApiError(status, `Some details weren't accepted. ${lines.join(". ")}.`, fieldErrors);
  }
  return new ApiError(status, `Something went wrong (error ${status}). Please try again.`);
}

export async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    // Also what a backend crash looks like: FastAPI's 500 page has no CORS headers, so the browser hides it.
    throw new ApiError(0, "We couldn't complete that request. The server may be down or ran into a problem. Please try again in a moment.");
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    // 401 while logged in: the session expired or was ended (e.g. by a password change).
    if (res.status === 401 && token) onUnauthorized();
    throw toApiError(res.status, data);
  }
  return data as T;
}
