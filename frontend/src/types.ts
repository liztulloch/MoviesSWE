// Shared types and fixed values used across the frontend.
export type MovieStatus = "CURRENTLY_RUNNING" | "COMING_SOON";

// What a movie looks like in the UI.
export interface Movie {
  id: number;
  title: string;
  genre: string;
  rating: string; // MPAA rating, e.g. "PG-13"
  description: string;
  posterUrl: string;
  trailerUrl: string;
  status: MovieStatus;
  cast?: string[];
  producers?: string[];
  director?: string;
  reviews?: string; // external reviews URL, e.g. Rotten Tomatoes
  trailerImage?: string;
  showtimes?: string[];
}

// Genre dropdown options on the home page.
export const GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Drama",
  "Horror",
  "Romance",
  "Sci-Fi",
  "Thriller",
] as const;

// Hardcoded for Sprint 1. Used when a movie has no showtimes in the database.
export const SHOWTIMES = ["2:00 PM", "5:00 PM", "8:00 PM"] as const;

// Price of one ticket for each age group.
export const TICKET_PRICES = { adult: 12, child: 8, senior: 9 } as const;
export type TicketType = keyof typeof TICKET_PRICES;

// Accounts (Sprint 2)
export type Role = "customer" | "admin";

export interface SessionUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
}

export interface Address {
  street: string;
  city: string;
  state: string; // 2-letter code, e.g. "GA"
  zip: string;
}

export const EMPTY_ADDRESS: Address = { street: "", city: "", state: "", zip: "" };

// The full card number only exists while typing; once saved, only the last 4 come back.
export interface CardInput {
  cardholderName: string;
  number: string;
  expiry: string; // MM/YY
  billingAddress: Address;
}

export const emptyCard = (): CardInput => ({
  cardholderName: "",
  number: "",
  expiry: "",
  billingAddress: { ...EMPTY_ADDRESS },
});

export interface SavedCard {
  id: number;
  cardholderName: string;
  brand: string;
  last4: string;
  expiry: string;
  billingAddress: Address;
}

export const MAX_CARDS = 3;

export interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  receivePromotions: boolean;
  address: Address | null;
  cards: SavedCard[];
}
