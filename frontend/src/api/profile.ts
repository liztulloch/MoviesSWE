// Request fields match the backend schemas (Profile_schema.py, Card_schema.py).
import { request, USE_MOCK_AUTH } from "./client";
import * as mock from "./mockServer";
import { EMPTY_ADDRESS, type Address, type CardInput, type Profile, type SavedCard } from "../types";

// Email is left out on purpose: it can't be changed.
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

// Anything not in that format goes into the street field.
export function parseAddress(text?: string | null): Address | null {
  if (!text?.trim()) return null;
  const m = text.match(/^(.*),\s*(.*),\s*([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/);
  return m ? { street: m[1], city: m[2], state: m[3], zip: m[4] } : { ...EMPTY_ADDRESS, street: text };
}

// The form uses "MM/YY", the backend a full date. A card is good through the last day of its month.
function expiryToDate(expiry: string) {
  const [mm, yy] = expiry.split("/").map(Number);
  const lastDay = new Date(2000 + yy, mm, 0).getDate(); // day 0 of the next month = last day of this one
  return `${2000 + yy}-${String(mm).padStart(2, "0")}-${lastDay}`;
}

const dateToExpiry = (date: string) => (/^\d{4}-\d{2}/.test(date) ? `${date.slice(5, 7)}/${date.slice(2, 4)}` : date);

export const toCardBody = (c: CardInput) => ({
  cardholder_name: c.cardholderName.trim(),
  card_number: c.number.replace(/\D/g, ""),
  expiration_date: expiryToDate(c.expiry),
  billing_address: formatAddress(c.billingAddress),
});

function toSavedCard(raw: any): SavedCard {
  return {
    id: raw.card_id ?? raw.id,
    brand: raw.brand ?? "Card",
    last4: raw.last4 ?? String(raw.card_number ?? "").slice(-4),
    expiry: dateToExpiry(raw.expiration_date ?? raw.expiry ?? ""),
    billingAddress: parseAddress(raw.billing_address) ?? EMPTY_ADDRESS,
  };
}

function toProfile(raw: any): Profile {
  return {
    firstName: raw.first_name ?? "",
    lastName: raw.last_name ?? "",
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    receivePromotions: Boolean(raw.receive_promotion),
    address: parseAddress(raw.mailing_address),
    cards: Array.isArray(raw.cards) ? raw.cards.map(toSavedCard) : [],
  };
}

export async function getProfile(): Promise<Profile> {
  if (USE_MOCK_AUTH) return mock.getProfile();
  return toProfile(await request("/user/me"));
}

export async function updateProfile(data: ProfileUpdate): Promise<Profile> {
  if (USE_MOCK_AUTH) return mock.updateProfile(data);
  await request("/user/me", {
    method: "PUT",
    body: {
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      mailing_address: data.address ? formatAddress(data.address) : null,
      receive_promotion: data.receivePromotions,
    },
  });
  return getProfile();
}

export async function addCard(card: CardInput): Promise<SavedCard> {
  if (USE_MOCK_AUTH) return mock.addCard(card);
  return toSavedCard(await request("/user/cards", { method: "POST", body: toCardBody(card) }));
}

export async function removeCard(id: number): Promise<void> {
  if (USE_MOCK_AUTH) return mock.removeCard(id);
  await request(`/user/cards/${id}`, { method: "DELETE" });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  if (USE_MOCK_AUTH) return mock.changePassword(currentPassword, newPassword);
  await request("/user/change-password", {
    method: "PUT",
    body: { current_password: currentPassword, new_password: newPassword },
  });
}

// There's no list route: favorites come with the profile. Only the ids are kept; pages load details with getMovie().
export async function getFavoriteIds(): Promise<number[]> {
  if (USE_MOCK_AUTH) return mock.getFavoriteIds();
  const raw = await request<any>("/user/me");
  return (raw.favorite_movies ?? []).map((m: any) => m.movie_id);
}

// The movie id goes in the body, for DELETE too.
export async function addFavorite(movieId: number): Promise<void> {
  if (USE_MOCK_AUTH) return mock.addFavorite(movieId);
  await request("/user/favorite-movie", { method: "POST", body: { movie_id: movieId } });
}

export async function removeFavorite(movieId: number): Promise<void> {
  if (USE_MOCK_AUTH) return mock.removeFavorite(movieId);
  await request("/user/favorite-movie", { method: "DELETE", body: { movie_id: movieId } });
}
