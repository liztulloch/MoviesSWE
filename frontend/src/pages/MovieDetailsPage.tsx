import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getMovie } from "../api/movies";
import { showDatesFor, formatShowDate } from "../showtimes";
import type { Movie } from "../types";
import ShowtimeList from "../components/ShowtimeList";
import TrailerPlayer from "../components/TrailerPlayer";

export default function MovieDetailsPage() {
  const { id } = useParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [showtime, setShowtime] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMovie(Number(id))
      .then((m) => { if (!cancelled) setMovie(m); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <p className="notice">Loading movie…</p>;
  if (error) return <p className="notice notice-error" role="alert">{error}</p>;
  if (!movie) return <p className="notice">We couldn't find that movie. <Link to="/">Back to movies</Link></p>;

  const comingSoon = movie.status === "COMING_SOON";
  const poster = movie.posterUrl || movie.trailerImage || "";
  const dates = showDatesFor(movie);
  const activeDate = date ?? dates[0].iso;

  // Each date has its own times, so a held-over selection could point at a time
  // the new date doesn't offer.
  const selectDate = (iso: string) => {
    setDate(iso);
    setShowtime(null);
  };

  return (
    <article className="details">
      <Link to="/" className="back">← All movies</Link>

      <div className="details-top">
        <div className="poster poster-lg">
          {poster ? (
            <img src={poster} alt={`${movie.title} poster`} />
          ) : (
            <div className="poster-fallback" aria-hidden="true">{movie.title}</div>
          )}
        </div>

        <div className="details-info">
          <h1>{movie.title}</h1>
          <div className="detail-meta">
            <span className="rating-badge" title="Rating">
              {movie.rating ? `Rated ${movie.rating}` : "Not rated"}
            </span>
            <span className="meta">{movie.genre}</span>
            <span className="meta">{comingSoon ? "Coming soon" : "Now showing"}</span>
          </div>
          <p className="description">{movie.description}</p>

          {movie.director && <p><strong>Director:</strong> {movie.director}</p>}
          {movie.producers && movie.producers.length > 0 && (
            <p><strong>Producer{movie.producers.length > 1 ? "s" : ""}:</strong> {movie.producers.join(", ")}</p>
          )}
          {movie.cast && movie.cast.length > 0 && <p><strong>Cast:</strong> {movie.cast.join(", ")}</p>}
          {movie.reviews && (
            <p>
              <strong>Reviews:</strong>{" "}
              <a href={movie.reviews} target="_blank" rel="noopener noreferrer">
                Read reviews for {movie.title}
              </a>
            </p>
          )}

          <h2>Showtimes</h2>
          <ShowtimeList
            dates={dates}
            selectedDate={activeDate}
            onSelectDate={selectDate}
            selectedTime={showtime}
            onSelectTime={setShowtime}
          />
          {showtime && (
            <Link
              className="btn btn-primary"
              to={`/booking/${movie.id}?date=${activeDate}&showtime=${encodeURIComponent(showtime)}`}
            >
              Book {formatShowDate(activeDate)} · {showtime}
            </Link>
          )}
        </div>
      </div>

      <section>
        <h2>Trailer</h2>
        <TrailerPlayer url={movie.trailerUrl} title={movie.title} />
      </section>
    </article>
  );
}