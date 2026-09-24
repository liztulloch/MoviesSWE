import { useEffect, useState } from "react";
import { getMovies } from "../api/movies";
import type { Movie } from "../types";
import Filters from "../components/Filters";
import MovieSection from "../components/MovieSection";

export default function HomePage() {
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restart query when search or genre changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      getMovies({ title, genre })
        .then((data) => { if (!cancelled) { setMovies(data); setError(null); } })
        .catch((e: Error) => { if (!cancelled) setError(e.message); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [title, genre]);

  const clear = () => { setTitle(""); setGenre(""); };
  const running = movies.filter((m) => m.status === "CURRENTLY_RUNNING");
  const soon = movies.filter((m) => m.status === "COMING_SOON");

  return (
    <>
      <section className="hero">
        <h1>What's playing tonight?</h1>
        <p>Pick a movie, choose a showtime, and grab your seats.</p>
      </section>

      <Filters title={title} genre={genre} onTitleChange={setTitle} onGenreChange={setGenre} onClear={clear} />

      {error && <p className="notice notice-error" role="alert">{error} Check that the backend is running.</p>}
      {loading && !error && <p className="notice">Loading movies…</p>}

      {!loading && !error && movies.length === 0 && (
        <div className="empty">
          <h2>No movies match your search</h2>
          <p>Try a different title or genre.</p>
          <button type="button" className="btn" onClick={clear}>Clear filters</button>
        </div>
      )}

      {!error && (
        <>
          <MovieSection title="Currently running" movies={running} />
          <MovieSection title="Coming soon" movies={soon} />
        </>
      )}
    </>
  );
}