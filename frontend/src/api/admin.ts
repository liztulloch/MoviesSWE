import { request } from "./client";
import { toMovie } from "./movies";
import type { Movie, MovieStatus } from "../types";

export interface NewMovie {
  title: string;
  genre: string;
  rating: string;
  status: MovieStatus;
  synopsis: string;
  posterUrl: string;
  trailerUrl: string;
  trailerImage: string;
  reviews: string;
}

export interface HallAvailability {
  hallId: number;
  hall: number;
  availableTimes: string[];
  booked: { time: string; movieTitle: string }[];
}

// Matches Admin_schedule.py: every showroom with its open and taken slots for one date.
export async function getAvailability(movieId: number, date: string): Promise<HallAvailability[]> {
  const res = await request<any>(`/admin/schedule/availability?movie_id=${movieId}&show_date=${date}`);
  return res.halls.map((h: any) => ({
    hallId: h.hall_id,
    hall: h.hall_number,
    availableTimes: h.available_times,
    booked: h.booked.map((b: any) => ({ time: b.show_time, movieTitle: b.movie_title })),
  }));
}

export async function scheduleShowtime(movieId: number, hallId: number, date: string, time: string): Promise<void> {
  await request("/admin/schedule/showtimes", {
    method: "POST",
    body: { movie_id: movieId, hall_id: hallId, show_date: date, show_time: time },
  });
}

// Matches MovieCreate on the backend. Blank optional fields are sent as null.
export async function addMovie(m: NewMovie): Promise<Movie> {
  const res = await request("/admin/movies", {
    method: "POST",
    body: {
      title: m.title.trim(),
      genre: m.genre,
      mpaa_rating: m.rating,
      status: m.status === "COMING_SOON" ? "Coming Soon" : "Currently Running",
      synopsis: m.synopsis.trim(),
      poster: m.posterUrl.trim(),
      trailer: m.trailerUrl.trim(),
      trailer_image: m.trailerImage.trim() || null,
      reviews: m.reviews.trim() || null,
    },
  });
  return toMovie(res);
}
