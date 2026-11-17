import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { getAvailability, scheduleShowtime, type HallAvailability } from "../api/admin";
import { ApiError, messageOf } from "../api/client";
import { getMovies } from "../api/movies";
import Alert, { type Notice } from "../components/Alert";
import FormField, { RequiredNote } from "../components/FormField";
import { formatShowDate, toIso } from "../showtimes";
import type { Movie } from "../types";
import { required } from "../validation";

interface Slot {
  hallId: number;
  hall: number;
  time: string;
}

export default function AdminShowtimesPage() {
  const [query, setQuery] = useState("");
  const [queryErr, setQueryErr] = useState("");
  const [results, setResults] = useState<Movie[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [date, setDate] = useState("");
  const [dateErr, setDateErr] = useState("");
  const [halls, setHalls] = useState<HallAvailability[] | null>(null);
  const [loadingHalls, setLoadingHalls] = useState(false);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [saving, setSaving] = useState(false);

  const today = toIso(new Date());

  async function search(e: FormEvent) {
    e.preventDefault();
    setNotice(null);
    const err = required(query, "Movie name");
    setQueryErr(err);
    if (err) return;
    setSearching(true);
    try {
      setResults(await getMovies({ title: query }));
    } catch (err) {
      setNotice({ kind: "error", text: messageOf(err) });
    } finally {
      setSearching(false);
    }
  }

  function pickMovie(m: Movie) {
    setMovie(m);
    setHalls(null);
    setSlot(null);
    setNotice(null);
  }

  async function showTimes(e: FormEvent) {
    e.preventDefault();
    setNotice(null);
    setSlot(null);
    const err = !date ? "Date is required." : date < today ? "Pick today or a later date." : "";
    setDateErr(err);
    if (err) return;
    setLoadingHalls(true);
    try {
      setHalls(await getAvailability(movie!.id, date));
    } catch (err) {
      setNotice({ kind: "error", text: messageOf(err) });
    } finally {
      setLoadingHalls(false);
    }
  }

  async function confirm() {
    if (!movie || !slot) return;
    setSaving(true);
    setNotice(null);
    try {
      await scheduleShowtime(movie.id, slot.hallId, date, slot.time);
      setNotice({
        kind: "success",
        text: `Scheduled ${movie.title} on ${formatShowDate(date)} at ${slot.time} in Hall ${slot.hall}.`,
      });
      setSlot(null);
      setHalls(await getAvailability(movie.id, date));
    } catch (err) {
      setNotice({ kind: "error", text: messageOf(err) });
      // 409: another admin took the slot after the times loaded, so show the current ones.
      if (err instanceof ApiError && err.status === 409) {
        setSlot(null);
        getAvailability(movie.id, date).then(setHalls).catch(() => {});
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page">
      <Link to="/admin" className="back">← Admin portal</Link>
      <h1>Manage Showtimes</h1>

      <form className="form" noValidate onSubmit={search}>
        <fieldset className="form-section">
          <legend>1. Find the movie</legend>
          <RequiredNote />
          <div className="search-row">
            <FormField label="Movie name" required value={query}
              onChange={(e) => setQuery(e.target.value)} error={queryErr} />
            <button type="submit" className="btn" disabled={searching}>{searching ? "Searching…" : "Search"}</button>
          </div>
          {results && (results.length === 0 ? (
            <p className="meta">No movies match that name.</p>
          ) : (
            <div className="showtimes" role="group" aria-label="Matching movies">
              {results.map((m) => (
                <button key={m.id} type="button" className={`chip ${movie?.id === m.id ? "chip-on" : ""}`}
                  aria-pressed={movie?.id === m.id} onClick={() => pickMovie(m)}>
                  {m.title}
                </button>
              ))}
            </div>
          ))}
        </fieldset>
      </form>

      {movie && (
        <form className="form" noValidate onSubmit={showTimes}>
          <fieldset className="form-section">
            <legend>2. Choose a date for {movie.title}</legend>
            <FormField label="Date" type="date" required min={today} value={date}
              onChange={(e) => { setDate(e.target.value); setHalls(null); setSlot(null); }} error={dateErr} />
            <div className="form-actions">
              <button type="submit" className="btn" disabled={loadingHalls}>
                {loadingHalls ? "Loading…" : "Show available times"}
              </button>
            </div>
          </fieldset>
        </form>
      )}

      {movie && halls && (
        <section className="form-section">
          <h2>3. Pick a showroom and time</h2>
          <div className="hall-grid">
            {halls.map((h) => (
              <div key={h.hallId} className="hall-card">
                <h3>Hall {h.hall}</h3>
                {h.availableTimes.length === 0 ? (
                  <p className="meta">No open times on this date.</p>
                ) : (
                  <div className="showtimes" role="group" aria-label={`Open times in Hall ${h.hall}`}>
                    {h.availableTimes.map((t) => {
                      const on = slot?.hallId === h.hallId && slot.time === t;
                      return (
                        <button key={t} type="button" className={`chip ${on ? "chip-on" : ""}`} aria-pressed={on}
                          onClick={() => setSlot({ hallId: h.hallId, hall: h.hall, time: t })}>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                )}
                {h.booked.length > 0 && (
                  <>
                    <p className="subhead">Already booked</p>
                    <ul className="booked-list">
                      {h.booked.map((b) => <li key={b.time}>{b.time}: {b.movieTitle}</li>)}
                    </ul>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-primary" disabled={!slot || saving} onClick={confirm}>
              {saving ? "Saving…" : slot ? `Schedule at ${slot.time} in Hall ${slot.hall}` : "Pick an open time"}
            </button>
          </div>
        </section>
      )}

      {notice && <Alert kind={notice.kind}>{notice.text}</Alert>}
    </div>
  );
}
