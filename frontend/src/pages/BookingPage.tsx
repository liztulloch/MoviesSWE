import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ApiError, messageOf } from "../api/client";
import { cancelBooking, getDraft, getSavedDraft, startBooking, updateBooking, type DraftRef } from "../api/booking";
import { getMovie, getSeatMap, getShowtimes } from "../api/movies";
import { useAuth } from "../context/AuthContext";
import { formatShowDate, isUpcoming, seatLabel } from "../showtimes";
import { TICKET_PRICES, type Movie, type ShowSeat, type Showtime, type TicketCounts, type TicketType } from "../types";
import Alert from "../components/Alert";
import SeatMap from "../components/SeatMap";
import TicketSelector from "../components/TicketSelector";

// The backend reports this tab's own held seats as "Reserved", but this customer can still pick them.
const freeOwnSeats = (seats: ShowSeat[], own: number[]) =>
  seats.map((s) => (own.includes(s.id) ? { ...s, status: "Available" } : s));

// Tickets and seats stay in the browser until "Proceed to checkout", which reserves them on the backend.
export default function BookingPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const showtimeId = Number(params.get("showtime"));
  const { user } = useAuth();
  const navigate = useNavigate();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [seatMap, setSeatMap] = useState<ShowSeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [counts, setCounts] = useState<TicketCounts>({ adult: 1, child: 0, senior: 0 });
  const [seats, setSeats] = useState<Set<number>>(new Set());
  // Set when the customer comes back to change a booking this tab already started.
  const [draft, setDraft] = useState<{ ref: DraftRef; seatIds: number[] } | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const saved = getSavedDraft();
    const own = saved && saved.showtimeId === showtimeId ? saved : null;
    Promise.all([
      getMovie(Number(id)),
      getShowtimes(Number(id)),
      showtimeId ? getSeatMap(showtimeId) : [],
      own ? getDraft(own).catch(() => null) : null,
    ])
      .then(([m, list, seatList, existing]) => {
        if (cancelled) return;
        setMovie(m);
        setShowtime(list.find((s) => s.id === showtimeId && isUpcoming(s.date, s.time)) ?? null);
        if (own && existing) {
          setDraft({ ref: own, seatIds: existing.seatIds });
          setCounts(existing.counts);
          setSeats(new Set(existing.seatIds));
          setSeatMap(freeOwnSeats(seatList, existing.seatIds));
        } else setSeatMap(seatList);
      })
      .catch((e) => { if (!cancelled) setLoadError(messageOf(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, showtimeId]);

  // Total price: number of tickets of each type times that type's price.
  const ticketTotal = counts.adult + counts.child + counts.senior;
  const price = useMemo(
    () => (Object.keys(counts) as TicketType[]).reduce((sum, t) => sum + counts[t] * TICKET_PRICES[t], 0),
    [counts]
  );

  // If tickets drop below the seats already picked, drop the most recently picked seats.
  const changeTickets = (type: TicketType, n: number) => {
    const nextCounts = { ...counts, [type]: n };
    const nextTotal = nextCounts.adult + nextCounts.child + nextCounts.senior;
    setCounts(nextCounts);
    setSeats((prev) => (prev.size <= nextTotal ? prev : new Set([...prev].slice(0, nextTotal))));
  };

  // Deselecting is always allowed, selecting only while there's room and aligns with # of seats selected.
  const toggleSeat = (seat: number) =>
    setSeats((prev) => {
      const next = new Set(prev);
      if (next.has(seat)) next.delete(seat);
      else if (next.size < ticketTotal) next.add(seat);
      return next;
    });

  async function proceed() {
    setError("");
    setSubmitting(true);
    try {
      if (draft) await updateBooking(draft.ref, counts, [...seats]);
      else {
        // Only one booking per tab: release seats held for another showtime first.
        const old = getSavedDraft();
        if (old) await cancelBooking(old).catch(() => {});
        await startBooking(movie!.id, showtimeId, counts, [...seats]);
      }
      if (user) navigate("/checkout");
      else navigate("/login", {
        state: { from: { pathname: "/checkout" }, message: "Your seats are on hold. Log in to continue to checkout." },
      });
    } catch (e) {
      setError(messageOf(e));
      setSubmitting(false);
      // 409: someone else took one of these seats after the map loaded.
      if (e instanceof ApiError && e.status === 409) {
        getSeatMap(showtimeId)
          .then((list) => {
            const fresh = freeOwnSeats(list, draft?.seatIds ?? []);
            setSeatMap(fresh);
            setSeats((prev) => new Set([...prev].filter((sid) => fresh.some((s) => s.id === sid && s.status === "Available"))));
          })
          .catch(() => {});
      }
    }
  }

  if (loading) return <p className="notice">Loading…</p>;
  if (loadError) return <p className="notice notice-error" role="alert">{loadError}</p>;
  if (!movie) return <p className="notice">We couldn't find that movie. <Link to="/">Back to movies</Link></p>;
  if (!showtime) {
    return (
      <p className="notice">
        That showtime isn't available. <Link to={`/movies/${movie.id}`}>Pick another showtime for {movie.title}</Link>
      </p>
    );
  }

  const remaining = ticketTotal - seats.size;
  const allChosen = ticketTotal > 0 && remaining === 0;
  const hint =
    ticketTotal === 0 ? "Add at least one ticket to choose seats."
    : allChosen ? "All seats chosen. Deselect one to pick a different seat."
    : `Select ${remaining} more seat${remaining > 1 ? "s" : ""}.`;
  const seatNumbers = seatMap.filter((s) => seats.has(s.id)).map((s) => s.number);
  const ticketText = (Object.keys(counts) as TicketType[]).filter((t) => counts[t]).map((t) => `${counts[t]} ${t}`).join(", ");

  return (
    <div className="booking">
      <Link to={`/movies/${movie.id}`} className="back">← Back to {movie.title}</Link>
      <h1>Book tickets</h1>
      <p className="meta booking-summary">
        <strong>{movie.title}</strong> · {formatShowDate(showtime.date)} · {showtime.time} · Hall {showtime.hall}
      </p>

      <div className="booking-grid">
        <section>
          <h2>Tickets</h2>
          <TicketSelector counts={counts} onChange={changeTickets} />
        </section>

        <section>
          <h2>Choose seats</h2>
          <p className={allChosen ? "hint hint-ok" : "hint"}>{hint}</p>
          <SeatMap seats={seatMap} selected={seats} onToggle={toggleSeat} locked={ticketTotal === 0 || allChosen} />
        </section>

        <aside className="order" aria-label="Order summary">
          <h2>Your order</h2>
          <dl>
            <dt>Tickets</dt><dd>{ticketTotal ? `${ticketTotal} (${ticketText})` : 0}</dd>
            <dt>Seats</dt><dd>{seatNumbers.length ? seatNumbers.map(seatLabel).join(", ") : "None yet"}</dd>
            <dt>Total</dt><dd>${price.toFixed(2)}</dd>
          </dl>
          {error && <Alert kind="error">{error}</Alert>}
          <button type="button" className="btn btn-primary" disabled={!allChosen || submitting} onClick={proceed}>
            {submitting ? "Holding your seats…" : "Proceed to checkout"}
          </button>
          {!allChosen && <p className="meta">Choose one seat for each ticket to continue.</p>}
          {allChosen && !user && <p className="meta">You'll log in next. Your seats stay on hold while you do.</p>}
        </aside>
      </div>
    </div>
  );
}
