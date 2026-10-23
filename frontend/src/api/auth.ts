// Account routes: sign up, email verification, login, logout and password reset.
// In mock mode these call mockServer.ts instead (see USE_MOCK_AUTH in client.ts).
// Lines marked BACKEND-TODO are guesses about routes that don't exist yet. Confirm them with the backend team.
import { request, USE_MOCK_AUTH } from "./client";
import * as mock from "./mockServer";
import { formatAddress, toCardBody } from "./profile";
import type { Address, CardInput, SessionUser } from "../types";

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  receivePromotions: boolean;
  address: Address | null; // optional at sign up
  cards: CardInput[]; // optional, up to MAX_CARDS
}

// Routes that email a code. devCode is only filled in by the mock, since it can't send real email.
export interface CodeResponse {
  message: string;
  devCode?: string;
}

export interface LoginResult {
  token: string;
  user: SessionUser;
}

// Field names match RegistrationRequest in backend/src/schemas/Registration_schema.py.
export async function register(input: RegisterInput): Promise<CodeResponse> {
  if (USE_MOCK_AUTH) return mock.register(input);
  const body: Record<string, unknown> = {
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email,
    phone: input.phone,
    password: input.password,
    promotion_opt_in: input.receivePromotions,
  };
  // Both optional (spec requirement 8). The backend encrypts the card numbers before saving them.
  if (input.address) body.mailing_address = formatAddress(input.address);
  if (input.cards.length) body.cards = input.cards.map(toCardBody);
  const res = await request<{ message?: string } | null>("/reg/register", { method: "POST", body });
  return { message: res?.message ?? `We sent a 4-digit code to ${input.email}.` };
}

// Matches VerificationRequest in Registration_schema.py.
export async function verifyEmail(email: string, code: string): Promise<void> {
  if (USE_MOCK_AUTH) return mock.verifyEmail(email, code);
  await request("/reg/verify-email", { method: "POST", body: { email, code } });
}

// Matches ResendVerificationRequest in Registration_schema.py.
export async function resendVerification(email: string): Promise<CodeResponse> {
  if (USE_MOCK_AUTH) return mock.resendVerification(email);
  const res = await request<{ message?: string } | null>("/reg/resend-verification", { method: "POST", body: { email } });
  return { message: res?.message ?? `We sent a new code to ${email}.` };
}

export async function login(email: string, password: string): Promise<LoginResult> {
  if (USE_MOCK_AUTH) return mock.login(email, password);
  // POST /auth/login (LoginRequest in Auth_schemas.py) returns { access_token, token_type }.
  const res = await request<any>("/auth/login", { method: "POST", body: { email, password } });
  const token: string = res.access_token ?? res.token;
  // BACKEND-TODO: the login response has no name or role yet, so the name is loaded from the profile
  // and everyone is treated as a customer. Admins can't log in until the backend sends a role.
  const u = res.user ?? res;
  const user: SessionUser = {
    id: u.user_id ?? u.id ?? userIdFromToken(token),
    firstName: u.first_name ?? "",
    lastName: u.last_name ?? "",
    email: u.email ?? email,
    role: String(u.role).toLowerCase() === "admin" ? "admin" : "customer",
  };
  if (!user.firstName) {
    try {
      const profile = await request<any>("/user/me", { token });
      user.firstName = profile.first_name ?? "";
      user.lastName = profile.last_name ?? "";
    } catch {
      // Still logged in, just without a name to show.
    }
  }
  return { token, user };
}

// The token's middle part holds the user id as "sub", e.g. { "sub": "12", "exp": ... }.
function userIdFromToken(token: string): number | undefined {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return Number(JSON.parse(atob(part)).sub) || undefined;
  } catch {
    return undefined;
  }
}

export async function logout(): Promise<void> {
  if (USE_MOCK_AUTH) return mock.logout();
  // POST /auth/logout. The token just stops being used; the backend has no list of sessions to clear.
  await request("/auth/logout", { method: "POST" });
}

export async function forgotPassword(email: string): Promise<CodeResponse> {
  if (USE_MOCK_AUTH) return mock.forgotPassword(email);
  // BACKEND-TODO: assumes POST /auth/forgot-password { email } emails a reset code.
  const res = await request<{ message?: string } | null>("/auth/forgot-password", { method: "POST", body: { email } });
  return { message: res?.message ?? `If an account exists for ${email}, we've emailed it a reset code.` };
}

export async function resetPassword(email: string, code: string, newPassword: string): Promise<void> {
  if (USE_MOCK_AUTH) return mock.resetPassword(email, code, newPassword);
  // BACKEND-TODO: assumes POST /auth/reset-password { email, code, new_password }.
  await request("/auth/reset-password", { method: "POST", body: { email, code, new_password: newPassword } });
}
