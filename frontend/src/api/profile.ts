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

// The form uses "MM/YY", the backend a full date. A card is good through the last day of its month.
function expiryToDate(expiry: string) {
  const [mm, yy] = expiry.split("/").map(Number);
  const lastDay = new Date(2000 + yy, mm, 0).getDate(); // day 0 of the next month = last day of this one
  return `${2000 + yy}-${String(mm).padStart(2, "0")}-${lastDay}`;
}

// "2028-12-31" -> "12/28"
const dateToExpiry = (date: string) => (/^\d{4}-\d{2}/.test(date) ? `${date.slice(5, 7)}/${date.slice(2, 4)}` : date);

// Matches RegistrationCardRequest in backend/src/schemas/Registration_schema.py.
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

// Convert what GET /user/me sends (ProfileSchema in the backend) into the shape the UI expects.
function toProfile(raw: any): Profile {
  return {
    firstName: raw.first_name ?? "",
    lastName: raw.last_name ?? "",
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    receivePromotions: Boolean(raw.receive_promotion),
    address: parseAddress(raw.mailing_address),
    // BACKEND-TODO: ProfileSchema doesn't include saved cards yet.
    cards: Array.isArray(raw.cards) ? raw.cards.map(toSavedCard) : [],
  };
}

export async function getProfile(): Promise<Profile> {
  if (USE_MOCK_AUTH) return mock.getProfile();
  return toProfile(await request("/user/me"));
}

// Matches ProfileUpdateRequest in backend/src/schemas/Profile_schema.py. The backend emails the user about the change.
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
  // BACKEND-TODO: no route yet for adding a card from the profile. Assumes POST /user/cards, which should refuse a 4th card.
  return toSavedCard(await request("/user/cards", { method: "POST", body: toCardBody(card) }));
}

export async function removeCard(id: number): Promise<void> {
  if (USE_MOCK_AUTH) return mock.removeCard(id);
  // BACKEND-TODO: no route yet for removing a card. Assumes DELETE /user/cards/{id}.
  await request(`/user/cards/${id}`, { method: "DELETE" });
}

// Matches ChangePasswordRequest in Profile_schema.py. A wrong current password comes back as a 400.
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  if (USE_MOCK_AUTH) return mock.changePassword(currentPassword, newPassword);
  await request("/user/change-password", {
    method: "PUT",
    body: { current_password: currentPassword, new_password: newPassword },
  });
}

// Favorites are passed around as movie ids. Pages load the movie details themselves with getMovie().
// The backend has no separate list route: the list comes with the profile (favorite_movies).
export async function getFavoriteIds(): Promise<number[]> {
  if (USE_MOCK_AUTH) return mock.getFavoriteIds();
  const raw = await request<any>("/user/me");
  return (raw.favorite_movies ?? []).map((m: any) => m.movie_id);
}

// Matches FavoriteMovieRequest in Profile_schema.py: the movie id goes in the body, for both add and remove.
export async function addFavorite(movieId: number): Promise<void> {
  if (USE_MOCK_AUTH) return mock.addFavorite(movieId);
  await request("/user/favorite-movie", { method: "POST", body: { movie_id: movieId } });
}

export async function removeFavorite(movieId: number): Promise<void> {
  if (USE_MOCK_AUTH) return mock.removeFavorite(movieId);
  await request("/user/favorite-movie", { method: "DELETE", body: { movie_id: movieId } });
}
