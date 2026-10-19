import type { Movie } from "../types";
import MovieCard from "./MovieCard";

interface Props {
  title: string;
  movies: Movie[];
}

// A titled grid of movie cards, like "Currently running" and hidden when no movies
export default function MovieSection({ title, movies }: Props) {
  if (movies.length === 0) return null;
  const headingId = `sec-${title.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <section className="movie-section" aria-labelledby={headingId}>
      <h2 id={headingId}>{title}</h2>
      <div className="movie-grid">
        {movies.map((m) => (
          <MovieCard key={m.id} movie={m} />
        ))}
      </div>
    </section>
  );
}