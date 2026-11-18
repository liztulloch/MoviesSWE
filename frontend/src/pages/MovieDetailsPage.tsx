import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getMovie, getShowtimes } from "../api/movies";
import { groupByDay, formatShowDate } from "../showtimes";
import type { Movie, Showtime } from "../types";
import FavoriteButton from "../components/FavoriteButton";
import ShowtimeList from "../components/ShowtimeList";
import TrailerPlayer from "../components/TrailerPlayer";

// Movie details page: poster, info, showtimes, and trailer.
// Picking a date and time shows the Book button, which opens the booking page.
export default function MovieDetailsPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(params.get("date"));
  const [showtime, setShowtime] = useState<Showtime | null>(null);

  // Load the movie and its showtimes from the backend using the id in the URL.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMovie(Number(id))
      .then(async (m) => {
        const list = m ? await getShowtimes(m.id) : [];
        if (cancelled) return;
        setMovie(m);
        setShowtimes(list);
        // A time chip on the home page links here with ?date=&time=
        const linked = list.filter((s) => s.date === params.get("date") && s.time === params.get("time"));
        if (linked.length === 1) setShowtime(linked[0]);
      })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, params]);

  if (loading) return <p className="notice">Loading movie…</p>;
  if (error) return <p className="notice notice-error" role="alert">{error}</p>;
  if (!movie) return <p className="notice">We couldn't find that movie. <Link to="/">Back to movies</Link></p>;

  const comingSoon = movie.status === "COMING_SOON";
  const poster = movie.posterUrl || movie.trailerImage || "";
  const dates = groupByDay(showtimes);
  const activeDate = dates.some((d) => d.iso === date) ? date! : dates[0]?.iso ?? "";

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
          <div className="title-row">
            <h1>{movie.title}</h1>
            <FavoriteButton movie={movie} />
          </div>
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
            selected={showtime}
            onSelect={setShowtime}
          />
          {showtime && (
            <Link className="btn btn-primary" to={`/booking/${movie.id}?showtime=${showtime.id}`}>
              Book {formatShowDate(showtime.date)} · {showtime.time} · Hall {showtime.hall}
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