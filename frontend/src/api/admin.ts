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
