// Pretend backend for accounts, profiles, cards and favorites, used until the real routes exist.
// Data is saved in this browser's localStorage, so it survives a refresh but isn't shared with anyone.
// Each function behaves like the backend route it stands in for, error messages included.
//
// Ready-made accounts (password in brackets):
//   admin@cinema.com     [Admin1234]      admin, lands on the admin portal
//   customer@cinema.com  [Customer1234]   active customer with an address, a card and 2 favorites
//   suspended@cinema.com [Suspended1234]  suspended, can't log in
// To start over, run localStorage.removeItem("ces-mock-db") in the browser console and refresh.
import { ApiError, getAuthToken } from "./client";
import { cardBrand } from "../validation";
import { MAX_CARDS, type Address, type CardInput, type Profile, type Role, type SavedCard, type SessionUser } from "../types";
import type { CodeResponse, LoginResult, RegisterInput } from "./auth";
import type { ProfileUpdate } from "./profile";

interface MockUser {
  id: number;
  role: Role;
  status: "Active" | "Inactive" | "Suspended";
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  passwordHash: string;
  verifyCodeHash: string | null;
  resetCodeHash: string | null;
  receivePromotions: boolean;
  address: Address | null;
  cards: SavedCard[];
  favorites: number[];
}

interface MockDb {
  users: MockUser[];
  nextUserId: number;
  nextCardId: number;
}

const DB_KEY = "ces-mock-db";

// SHA-256 so passwords and codes aren't stored as plain text. The real backend uses a proper password hash.
async function hash(text: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

// A short wait so loading states ("Saving…") show up like they would with a real server.
const pause = () => new Promise((resolve) => setTimeout(resolve, 300));

// Same 4-digit format as the backend's email codes.
const newCode = () => String(Math.floor(1000 + Math.random() * 9000));

const sampleAddress: Address = { street: "100 Main St", city: "Athens", state: "GA", zip: "30601" };

async function seed(): Promise<MockDb> {
  const blank = {
    verifyCodeHash: null,
    resetCodeHash: null,
    receivePromotions: false,
    address: null,
    cards: [],
    favorites: [],
  };
  return {
    nextUserId: 4,
    nextCardId: 2,
    users: [
      { ...blank, id: 1, role: "admin", status: "Active", firstName: "Ada", lastName: "Admin",
        email: "admin@cinema.com", phone: "706-555-0100", passwordHash: await hash("Admin1234") },
      { ...blank, id: 2, role: "customer", status: "Active", firstName: "Casey", lastName: "Customer",
        email: "customer@cinema.com", phone: "706-555-0101", passwordHash: await hash("Customer1234"),
        receivePromotions: true, address: sampleAddress, favorites: [1, 3],
        cards: [{ id: 1, brand: "Visa", last4: "1111", expiry: "12/28", billingAddress: sampleAddress }] },
      { ...blank, id: 3, role: "customer", status: "Suspended", firstName: "Sam", lastName: "Suspended",
        email: "suspended@cinema.com", phone: "706-555-0102", passwordHash: await hash("Suspended1234") },
    ],
  };
}

// Loaded once, then kept in memory. Every change is written back with persist().
let dbPromise: Promise<MockDb> | null = null;

function getDb(): Promise<MockDb> {
  dbPromise ??= (async () => {
    try {
      const saved = localStorage.getItem(DB_KEY);
      if (saved) return JSON.parse(saved) as MockDb;
    } catch {
      // Storage blocked or data unreadable, so start fresh.
    }
    const db = await seed();
    persist(db);
    return db;
  })();
  return dbPromise;
}

function persist(db: MockDb) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    // Storage blocked: changes still work until the page reloads.
  }
}

const findByEmail = (db: MockDb, email: string) => db.users.find((u) => u.email === email.trim().toLowerCase());

const toSessionUser = (u: MockUser): SessionUser => ({
  id: u.id,
  firstName: u.firstName,
  lastName: u.lastName,
  email: u.email,
  role: u.role,
});

// Copies, not the stored objects, so the page can't change the mock's data by accident (a real response is a copy too).
const toProfile = (u: MockUser): Profile => ({
  firstName: u.firstName,
  lastName: u.lastName,
  email: u.email,
  phone: u.phone,
  receivePromotions: u.receivePromotions,
  address: u.address && { ...u.address },
  cards: u.cards.map((c) => ({ ...c, billingAddress: { ...c.billingAddress } })),
});

// Only the brand and last 4 digits are kept, which is all the real backend should ever send back.
function saveCard(db: MockDb, input: CardInput): SavedCard {
  const digits = input.number.replace(/\D/g, "");
  return {
    id: db.nextCardId++,
    brand: cardBrand(digits),
    last4: digits.slice(-4),
    expiry: input.expiry,
    billingAddress: input.billingAddress,
  };
}

// The logged-in customer, looked up from the token like the backend's get_current_user.
async function currentCustomer() {
  await pause();
  const db = await getDb();
  const id = Number(getAuthToken()?.replace("mock-token-", ""));
  const user = db.users.find((u) => u.id === id);
  if (!user) throw new ApiError(401, "Your session has ended. Please log in again.");
  if (user.role !== "customer") throw new ApiError(403, "Only customer accounts have a profile.");
  return { db, user };
}

// Accounts

export async function register(input: RegisterInput): Promise<CodeResponse> {
  await pause();
  const db = await getDb();
  const email = input.email.trim().toLowerCase();
  if (findByEmail(db, email)) {
    const msg = "An account with this email already exists. Try logging in instead.";
    throw new ApiError(409, msg, { email: msg });
  }
  if (input.cards.length > MAX_CARDS) throw new ApiError(400, `You can save up to ${MAX_CARDS} payment cards.`);

  const code = newCode();
  db.users.push({
    id: db.nextUserId++,
    role: "customer",
    status: "Inactive", // becomes Active once the email code is entered
    firstName: input.firstName,
    lastName: input.lastName,
    email,
    phone: input.phone,
    passwordHash: await hash(input.password),
    verifyCodeHash: await hash(code),
    resetCodeHash: null,
    receivePromotions: input.receivePromotions,
    address: input.address,
    cards: input.cards.map((c) => saveCard(db, c)),
    favorites: [],
  });
  persist(db);
  return { message: `Account created! We sent a 4-digit code to ${email}.`, devCode: code };
}

export async function verifyEmail(email: string, code: string): Promise<void> {
  await pause();
  const db = await getDb();
  const user = findByEmail(db, email);
  if (!user) throw new ApiError(404, "We couldn't find an account with that email.");
  if (user.status === "Active") return;
  if (!user.verifyCodeHash || (await hash(code)) !== user.verifyCodeHash) {
    throw new ApiError(400, "That code isn't right. Check your email or send a new code.", { code: "That code isn't right." });
  }
  user.status = "Active";
  user.verifyCodeHash = null;
  persist(db);
}

export async function resendVerification(email: string): Promise<CodeResponse> {
  await pause();
  const db = await getDb();
  const user = findByEmail(db, email);
  if (!user) throw new ApiError(404, "We couldn't find an account with that email.");
  if (user.status !== "Inactive") throw new ApiError(400, "This account is already verified. You can log in.");
  const code = newCode();
  user.verifyCodeHash = await hash(code);
  persist(db);
  return { message: `We sent a new code to ${user.email}.`, devCode: code };
}

export async function login(email: string, password: string): Promise<LoginResult> {
  await pause();
  const db = await getDb();
  const user = findByEmail(db, email);
  // Same message for an unknown email and a wrong password, so nobody can probe which emails have accounts.
  if (!user || (await hash(password)) !== user.passwordHash) {
    throw new ApiError(401, "Incorrect email or password.");
  }
  if (user.status === "Inactive") {
    throw new ApiError(403, "Please verify your email before logging in. Check your inbox for the 4-digit code.");
  }
  if (user.status === "Suspended") {
    throw new ApiError(403, "This account has been suspended. Please contact the theater for help.");
  }
  return { token: `mock-token-${user.id}`, user: toSessionUser(user) };
}

export async function logout(): Promise<void> {
  await pause();
}

export async function forgotPassword(email: string): Promise<CodeResponse> {
  await pause();
  const db = await getDb();
  const user = findByEmail(db, email);
  // The message is the same either way so it doesn't reveal whether the email has an account.
  const message = `If an account exists for ${email.trim()}, we've emailed it a 4-digit reset code.`;
  if (!user) return { message };
  const code = newCode();
  user.resetCodeHash = await hash(code);
  persist(db);
  return { message, devCode: code };
}

export async function resetPassword(email: string, code: string, newPassword: string): Promise<void> {
  await pause();
  const db = await getDb();
  const user = findByEmail(db, email);
  if (!user || !user.resetCodeHash || (await hash(code)) !== user.resetCodeHash) {
    throw new ApiError(400, "That reset code isn't right. Check your email or request a new code.", { code: "That code isn't right." });
  }
  user.passwordHash = await hash(newPassword);
  user.resetCodeHash = null;
  persist(db);
}

// Profile

export async function getProfile(): Promise<Profile> {
  const { user } = await currentCustomer();
  return toProfile(user);
}

export async function updateProfile(data: ProfileUpdate): Promise<Profile> {
  const { db, user } = await currentCustomer();
  Object.assign(user, data, { address: data.address && { ...data.address } });
  persist(db);
  return toProfile(user);
}

export async function addCard(card: CardInput): Promise<SavedCard> {
  const { db, user } = await currentCustomer();
  if (user.cards.length >= MAX_CARDS) {
    throw new ApiError(400, `You can save up to ${MAX_CARDS} payment cards. Remove one to add another.`);
  }
  const saved = saveCard(db, card);
  user.cards.push(saved);
  persist(db);
  return { ...saved };
}

export async function removeCard(id: number): Promise<void> {
  const { db, user } = await currentCustomer();
  user.cards = user.cards.filter((c) => c.id !== id);
  persist(db);
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const { db, user } = await currentCustomer();
  if ((await hash(currentPassword)) !== user.passwordHash) {
    const msg = "Your current password is incorrect.";
    throw new ApiError(400, msg, { currentPassword: msg });
  }
  if (currentPassword === newPassword) {
    const msg = "Choose a password that's different from your current one.";
    throw new ApiError(400, msg, { newPassword: msg });
  }
  user.passwordHash = await hash(newPassword);
  persist(db);
}

// Favorites

export async function getFavoriteIds(): Promise<number[]> {
  const { user } = await currentCustomer();
  return [...user.favorites];
}

export async function addFavorite(movieId: number): Promise<void> {
  const { db, user } = await currentCustomer();
  if (!user.favorites.includes(movieId)) user.favorites.push(movieId);
  persist(db);
}

export async function removeFavorite(movieId: number): Promise<void> {
  const { db, user } = await currentCustomer();
  user.favorites = user.favorites.filter((id) => id !== movieId);
  persist(db);
}
