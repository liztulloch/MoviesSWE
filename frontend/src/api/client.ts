// Shared fetch helper for account, profile and favorites calls.
// It adds the login token, sends JSON, and turns backend errors into an ApiError with a readable message.

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Accounts, profiles and favorites use mockServer.ts unless VITE_USE_MOCK_AUTH=false.
// Kept separate from VITE_USE_MOCK because the movie routes exist on the backend but most account routes don't yet.
export const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH !== "false";

export class ApiError extends Error {
  status: number;
  // Messages for single form fields, keyed by the form's field name (e.g. "email", "firstName").
  fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

// Turns anything thrown into text that's safe to show the user.
export const messageOf = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong. Please try again.";

// The login token. AuthContext sets it on login and clears it on logout.
let token: string | null = null;
let onUnauthorized = () => {};

export const setAuthToken = (t: string | null) => { token = t; };
export const getAuthToken = () => token;
// AuthContext registers this so an expired token logs the user out.
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn; };

// "first_name" -> "firstName", so backend field errors line up with the form's field names.
const toCamel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

// FastAPI sends { detail: "message" }, or for failed field checks (422) { detail: [{ loc, msg }, ...] }.
function toApiError(status: number, data: any): ApiError {
  const detail = data?.detail;
  if (typeof detail === "string") return new ApiError(status, detail);
  if (Array.isArray(detail)) {
    const fieldErrors: Record<string, string> = {};
    for (const d of detail) {
      const field = d?.loc?.[d.loc.length - 1];
      if (typeof field === "string") fieldErrors[toCamel(field)] = String(d.msg ?? "This value isn't valid.");
    }
    return new ApiError(status, "Please fix the highlighted fields.", fieldErrors);
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
    throw new ApiError(0, "Can't reach the server. Check that the backend is running and try again.");
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    // A 401 while logged in means the token expired or was revoked.
    if (res.status === 401 && token) onUnauthorized();
    throw toApiError(res.status, data);
  }
  return data as T;
}
