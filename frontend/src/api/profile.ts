// Logged-in customer routes: profile, payment cards, password change and favorite movies.
// In mock mode these call mockServer.ts instead (see USE_MOCK_AUTH in client.ts).
// Lines marked BACKEND-TODO are guesses about routes that don't exist yet. Confirm them with the backend team.
import { request, USE_MOCK_AUTH } from "./client";
import * as mock from "./mockServer";
import { EMPTY_ADDRESS, type Address, type CardInput, type Profile, type SavedCard } from "../types";

// The fields the edit profile form can change. Email is left out on purpose.
export interface ProfileUpdate {
  firstName: string;
  lastName: string;
  phone: string;
  receivePromotions: boolean;
  address: Address | null;
}

// The database keeps an address in one text column, so it's joined as "street, city, ST 12345".
export const formatAddress = (a: Address) =>
  `${a.street.trim()}, ${a.city.trim()}, ${a.state.trim().toUpperCase()} ${a.zip.trim()}`;

// Splits that text back into fields. Anything in another format goes into the street field.
export function parseAddress(text?: string | null): Address | null {
  if (!text?.trim()) return null;
  const m = text.match(/^(.*),\s*(.*),\s*([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/);
  return m ? { street: m[1], city: m[2], state: m[3], zip: m[4] } : { ...EMPTY_ADDRESS, street: text };
}

// BACKEND-TODO: card fields are guessed from the CreditCard table (card_number, billing_address, expiration_date).
export const toCardBody = (c: CardInput) => ({
  cardholder_name: c.cardholderName.trim(),
  card_number: c.number.replace(/\D/g, ""),
  expiration_date: c.expiry,
  billing_address: formatAddress(c.billingAddress),
});

function toSavedCard(raw: any): SavedCard {
  return {
    id: raw.card_id ?? raw.id,
    brand: raw.brand ?? "Card",
    last4: raw.last4 ?? String(raw.card_number ?? "").slice(-4),
    expiry: raw.expiration_date ?? raw.expiry ?? "",
    billingAddress: parseAddress(raw.billing_address) ?? EMPTY_ADDRESS,
  };
}

// Convert what GET /users/me sends (CustomerSchema in the backend) into the shape the UI expects.
function toProfile(raw: any): Profile {
  return {
    firstName: raw.first_name ?? "",
    lastName: raw.last_name ?? "",
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    receivePromotions: Boolean(raw.receive_promotion),
    address: parseAddress(raw.mailing_address),
    // BACKEND-TODO: CustomerSchema doesn't include cards yet.
    cards: Array.isArray(raw.cards) ? raw.cards.map(toSavedCard) : [],
  };
}

export async function getProfile(): Promise<Profile> {
  if (USE_MOCK_AUTH) return mock.getProfile();
  return toProfile(await request("/users/me"));
}

export async function updateProfile(data: ProfileUpdate): Promise<Profile> {
  if (USE_MOCK_AUTH) return mock.updateProfile(data);
  // Matches CustomerUpdateRequest in the backend. BACKEND-TODO: it currently rejects a blank mailing_address.
  await request("/users/me", {
    method: "PUT",
    body: {
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      mailing_address: data.address ? formatAddress(data.address) : "",
      receive_promotion: data.receivePromotions,
    },
  });
  return getProfile();
}

export async function addCard(card: CardInput): Promise<SavedCard> {
  if (USE_MOCK_AUTH) return mock.addCard(card);
  // BACKEND-TODO: assumes POST /users/me/cards, which should refuse a 4th card.
  return toSavedCard(await request("/users/me/cards", { method: "POST", body: toCardBody(card) }));
}

export async function removeCard(id: number): Promise<void> {
  if (USE_MOCK_AUTH) return mock.removeCard(id);
  // BACKEND-TODO: assumes DELETE /users/me/cards/{id}.
  await request(`/users/me/cards/${id}`, { method: "DELETE" });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  if (USE_MOCK_AUTH) return mock.changePassword(currentPassword, newPassword);
  // BACKEND-TODO: assumes PUT /users/me/password. A wrong current password should be a 400, not a 401,
  // because the frontend treats 401 as "logged out".
  await request("/users/me/password", {
    method: "PUT",
    body: { current_password: currentPassword, new_password: newPassword },
  });
}

// Favorites are passed around as movie ids. Pages load the movie details themselves with getMovie().
export async function getFavoriteIds(): Promise<number[]> {
  if (USE_MOCK_AUTH) return mock.getFavoriteIds();
  // BACKEND-TODO: assumes GET /users/me/favorites returns movie ids or movie objects.
  const list = await request<any[]>("/users/me/favorites");
  return list.map((f) => (typeof f === "number" ? f : f.movie_id ?? f.id));
}

export async function addFavorite(movieId: number): Promise<void> {
  if (USE_MOCK_AUTH) return mock.addFavorite(movieId);
  // BACKEND-TODO: assumes POST /users/me/favorites/{movie_id}.
  await request(`/users/me/favorites/${movieId}`, { method: "POST" });
}

export async function removeFavorite(movieId: number): Promise<void> {
  if (USE_MOCK_AUTH) return mock.removeFavorite(movieId);
  // BACKEND-TODO: assumes DELETE /users/me/favorites/{movie_id}.
  await request(`/users/me/favorites/${movieId}`, { method: "DELETE" });
}
