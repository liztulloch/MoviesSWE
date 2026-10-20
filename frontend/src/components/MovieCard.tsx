import { Link } from "react-router-dom";
import { showDatesFor } from "../showtimes";
import type { Movie } from "../types";

// One movie on the home page. poster and title (links to details) plus quick showtime buttons.
export default function MovieCard({ movie }: { movie: Movie }) {
  const meta = [movie.rating, movie.genre].filter(Boolean).join(" · ");
  const next = showDatesFor(movie)[0];

  return (
    <article className="movie-card">
      <Link to={`/movies/${movie.id}`} className="movie-card-link">
        <div className="poster">
          {movie.posterUrl ? (
            <img src={movie.posterUrl} alt={`${movie.title} poster`} loading="lazy" />
          ) : (
            <div className="poster-fallback" aria-hidden="true">{movie.title}</div>
          )}
        </div>
        <div className="movie-card-body">
          <h3>{movie.title}</h3>
          <p className="meta">{meta}</p>
        </div>
      </Link>

      {next && (
        <>
          <p className="meta">{next.label}</p>
          {/* Kept outside the card link because a link can't go inside another link. */}
          <div className="card-showtimes">
            {next.times.slice(0, 3).map((t) => (
              <Link
                key={t}
                className="chip chip-sm"
                to={`/booking/${movie.id}?date=${next.iso}&showtime=${encodeURIComponent(t)}`}
                aria-label={`Book ${movie.title} on ${next.label} at ${t}`}
              >
                {t}
              </Link>
            ))}
          </div>
        </>
      )}
    </article>
  );
}
