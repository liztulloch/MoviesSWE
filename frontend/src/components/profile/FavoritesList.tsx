import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMovie } from "../../api/movies";
import { useFavorites } from "../../context/FavoritesContext";
import MovieCard from "../MovieCard";
import type { Movie } from "../../types";

export default function FavoritesList() {
  const { ids, loading: idsLoading } = useFavorites();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([...ids].map((id) => getMovie(id)))
      .then((list) => {
        if (cancelled) return;
        setMovies(list.filter((m): m is Movie => m !== null));
        setError(null);
      })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [ids]);

  // Filtering by ids makes a removed movie disappear right away, before the reload finishes.
  const shown = movies.filter((m) => ids.has(m.id));

  if (idsLoading || (loading && ids.size > 0)) return <p className="notice">Loading your favorites…</p>;
  if (error) return <p className="notice notice-error" role="alert">{error}</p>;

  if (shown.length === 0) {
    return (
      <div className="empty">
        <h3>No favorites yet</h3>
        <p>Tap the ♡ on any movie while browsing to save it here.</p>
        <Link className="btn" to="/">Browse movies</Link>
      </div>
    );
  }

  return (
    <div className="movie-grid">
      {shown.map((m) => (
        <MovieCard key={m.id} movie={m} />
      ))}
    </div>
  );
}
