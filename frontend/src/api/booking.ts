// Request fields match the backend schemas (Booking_schema.py).
import { request } from "./client";
import type { CheckoutSummary, TicketCounts } from "../types";

export interface DraftRef {
  id: number;
  // Only guests get a token; it's the only way they can reach the draft again.
  token: string | null;
  movieId: number;
  showtimeId: number;
}

export interface Draft {
  counts: TicketCounts;
  seatIds: number[];
}

const KEY = "ces-booking";

// sessionStorage keeps the booking through the login redirect, and ends with the tab.
export function getSavedDraft(): DraftRef | null {
  try {
    const saved = sessionStorage.getItem(KEY);
    return saved ? (JSON.parse(saved) as DraftRef) : null;
  } catch {
    return null;
  }
}

function saveDraft(ref: DraftRef | null) {
  try {
    if (ref) sessionStorage.setItem(KEY, JSON.stringify(ref));
    else sessionStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the booking still works until the page reloads.
  }
}

const tokenHeader = (ref: DraftRef) => (ref.token ? { "X-Booking-Token": ref.token } : undefined);

// Creating the draft is what reserves the seats.
export async function startBooking(
  movieId: number, showtimeId: number, counts: TicketCounts, seatIds: number[]
): Promise<DraftRef> {
  const res = await request<any>("/booking-drafts", {
    method: "POST",
    body: { showtime_id: showtimeId, ...counts, show_seat_ids: seatIds },
  });
  const ref = { id: res.draft_id, token: res.access_token ?? null, movieId, showtimeId };
  saveDraft(ref);
  return ref;
}

export async function getDraft(ref: DraftRef): Promise<Draft> {
  const res = await request<any>(`/booking-drafts/${ref.id}`, { headers: tokenHeader(ref) });
  return {
    counts: { adult: res.adult, child: res.child, senior: res.senior },
    seatIds: res.selected_show_seat_ids,
  };
}

export async function updateBooking(ref: DraftRef, counts: TicketCounts, seatIds: number[]): Promise<void> {
  await request(`/booking-drafts/${ref.id}`, {
    method: "PUT",
    headers: tokenHeader(ref),
    body: { ...counts, show_seat_ids: seatIds },
  });
}

export async function cancelBooking(ref: DraftRef): Promise<void> {
  await request(`/booking-drafts/${ref.id}`, { method: "DELETE", headers: tokenHeader(ref) });
  saveDraft(null);
}

// Needs a logged-in customer. The first call moves a guest's draft onto their account.
export async function checkout(ref: DraftRef): Promise<CheckoutSummary> {
  const res = await request<any>(`/booking-drafts/${ref.id}/checkout`, { method: "POST", headers: tokenHeader(ref) });
  return {
    movieTitle: res.movie_title,
    date: res.show_date,
    time: res.show_time,
    hall: res.hall_number,
    seats: res.seats.map((s: any) => s.seat_number),
    // Prices are decimals, which FastAPI sends as strings like "12.00".
    tickets: res.tickets.map((t: any) => ({
      type: t.ticket_type,
      quantity: t.quantity,
      unitPrice: Number(t.unit_price),
      lineTotal: Number(t.line_total),
    })),
    subtotal: Number(res.subtotal_before_tax),
    accountEmail: res.account_email,
    checkoutEmail: res.checkout_email ?? null,
  };
}

export async function setCheckoutEmail(ref: DraftRef, email: string): Promise<void> {
  await request(`/booking-drafts/${ref.id}/email`, { method: "PUT", body: { checkout_email: email } });
}
