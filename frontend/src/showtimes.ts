import { SHOWTIMES, type Movie, type MovieStatus } from "./types";

export interface ShowDate {
  iso: string;
  label: string;
  times: string[];
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

// Several halls can run the same movie at the same time, so times are de-duplicated.
export function groupShowtimes(stamps: string[]): ShowDate[] {
  const byDate = new Map<string, Set<string>>();
  for (const stamp of stamps) {
    const parsed = splitStamp(stamp);
    if (!parsed) continue;
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

// three consecutive days. coming soon starts two weeks out.
export function getShowDates(status: MovieStatus, count = 3): ShowDate[] {
  const startOffset = status === "COMING_SOON" ? 14 : 0;
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + startOffset + i);
    const iso = toIso(d);
    return { iso, label: formatShowDate(iso), times: [...SHOWTIMES] };
  });
}

// Coming-soon movies have no rows in the Showtime table, so they fall back to
// the hardcoded sprint-1 times rather than showing an empty picker.
export function showDatesFor(movie: Movie): ShowDate[] {
  const scheduled = groupShowtimes(movie.showtimes ?? []);
  return scheduled.length > 0 ? scheduled : getShowDates(movie.status);
}
