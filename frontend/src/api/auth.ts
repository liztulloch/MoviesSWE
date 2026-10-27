// Request fields match the backend schemas (Registration_schema.py, Auth_schemas.py, Profile_schema.py).
import { ApiError, request, USE_MOCK_AUTH } from "./client";
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
  address: Address | null;
  cards: CardInput[];
}

// devCode is only set by the mock, which shows the code on screen instead of emailing it.
export interface CodeResponse {
  message: string;
  devCode?: string;
}

export interface LoginResult {
  token: string;
  user: SessionUser;
}

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
  if (input.address) body.mailing_address = formatAddress(input.address);
  if (input.cards.length) body.cards = input.cards.map(toCardBody);
  const res = await request<{ message?: string } | null>("/reg/register", { method: "POST", body });
  return { message: res?.message ?? `We sent a 4-digit code to ${input.email}.` };
}

export async function verifyEmail(email: string, code: string): Promise<void> {
  if (USE_MOCK_AUTH) return mock.verifyEmail(email, code);
  await request("/reg/verify-email", { method: "POST", body: { email, code } });
}

export async function resendVerification(email: string): Promise<CodeResponse> {
  if (USE_MOCK_AUTH) return mock.resendVerification(email);
  const res = await request<{ message?: string } | null>("/reg/resend-verification", { method: "POST", body: { email } });
  return { message: res?.message ?? `We sent a new code to ${email}.` };
}

export async function login(email: string, password: string): Promise<LoginResult> {
  if (USE_MOCK_AUTH) return mock.login(email, password);
  let res: any;
  try {
    res = await request<any>("/auth/login", { method: "POST", body: { email, password } });
  } catch (e) {
    // Unverified accounts get a 403 that mentions verifying; show the wording from the demo instructions.
    if (e instanceof ApiError && e.status === 403 && /verif/i.test(e.message)) {
      throw new ApiError(403, "Account is not verified. Please check your email to verify your account.");
    }
    throw e;
  }
  // role comes back as "Customer" or "Admin".
  const token: string = res.access_token;
  const user: SessionUser = {
    id: userIdFromToken(token),
    firstName: res.first_name ?? "",
    lastName: res.last_name ?? "",
    email,
    role: String(res.role).toLowerCase() === "admin" ? "admin" : "customer",
  };
  return { token, user };
}

// The login response has no user id, but the token's payload does ("sub").
function userIdFromToken(token: string): number {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return Number(JSON.parse(atob(part)).sub) || 0;
  } catch {
    return 0;
  }
}

export async function logout(): Promise<void> {
  if (USE_MOCK_AUTH) return mock.logout();
  await request("/auth/logout", { method: "POST" });
}

export async function forgotPassword(email: string): Promise<CodeResponse> {
  if (USE_MOCK_AUTH) return mock.forgotPassword(email);
  const res = await request<{ message?: string } | null>("/user/forgot-password", { method: "POST", body: { email } });
  return { message: res?.message ?? `If an account exists for ${email}, we've emailed it a reset code.` };
}

export async function resetPassword(email: string, code: string, newPassword: string): Promise<void> {
  if (USE_MOCK_AUTH) return mock.resetPassword(email, code, newPassword);
  await request("/user/reset-password", { method: "POST", body: { email, code, new_password: newPassword } });
}
