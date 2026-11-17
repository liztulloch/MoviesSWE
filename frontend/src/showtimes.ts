// Turns showtimes into the date and time lists the pickers show.
import type { Showtime } from "./types";

export interface ShowDate {
  iso: string;
  label: string;
  times: string[];
}

export interface ShowDay {
  iso: string;
  label: string;
  showtimes: Showtime[];
}

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function formatShowDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// The API sends one string per showing: "2026-09-26 1:00 PM"
function splitStamp(stamp: string): [iso: string, time: string] | null {
  const gap = stamp.indexOf(" ");
  if (gap === -1) return null;
  const iso = stamp.slice(0, gap).trim();
  const time = stamp.slice(gap + 1).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && time ? [iso, time] : null;
}

// "1:00 PM" -> 780, so times sort chronologically instead of alphabetically
function toMinutes(time: string): number {
  const m = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return 0;
  const hour = Number(m[1]) % 12;
  const pm = m[3]?.toUpperCase() === "PM";
  return (hour + (pm ? 12 : 0)) * 60 + Number(m[2]);
}

export function isUpcoming(iso: string, time: string, now = new Date()): boolean {
  const today = toIso(now);
  if (iso !== today) return iso > today;
  return toMinutes(time) > now.getHours() * 60 + now.getMinutes();
}

const compareShowtimes =(a: Showtime, b: Showtime) =>
  a.date.localeCompare(b.date) || toMinutes(a.time) - toMinutes(b.time) || a.hall - b.hall;

// Several halls can run the same movie at the same time, so times are de duplicated.
export function groupShowtimes(stamps: string[]): ShowDate[] {
  const byDate = new Map<string, Set<string>>();
  for (const stamp of stamps) {
    const parsed = splitStamp(stamp);
    if (!parsed || !isUpcoming(...parsed)) continue;
    const [iso, time] = parsed;
    if (!byDate.has(iso)) byDate.set(iso, new Set());
    byDate.get(iso)!.add(time);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([iso, times]) => ({
      iso,
      label: formatShowDate(iso),
      times: [...times].sort((a, b) => toMinutes(a) - toMinutes(b)),
    }));
}

// Upcoming showings only, one entry per day. Unlike groupShowtimes, each hall stays separate because each is its own booking.
export function groupByDay(showtimes: Showtime[]): ShowDay[] {
  const byDate = new Map<string, Showtime[]>();
  for (const s of [...showtimes].sort(compareShowtimes)) {
    if (!isUpcoming(s.date, s.time)) continue;
    if (!byDate.has(s.date)) byDate.set(s.date, []);
    byDate.get(s.date)!.push(s);
  }
  return [...byDate.entries()].map(([iso, list]) => ({ iso, label: formatShowDate(iso), showtimes: list }));
}

// The database numbers seats row by row, 10 per row: 1-10 is row A, 11-20 is row B.
export const SEATS_PER_ROW = 10;
export const seatRow = (n: number) => String.fromCharCode(65 + Math.floor((n - 1) / SEATS_PER_ROW));
export const seatLabel = (n: number) => `${seatRow(n)}${((n - 1) % SEATS_PER_ROW) + 1}`;
