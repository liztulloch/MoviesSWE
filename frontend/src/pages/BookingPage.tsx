import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getMovie } from "../api/movies";
import { formatShowDate } from "../showtimes";
import { TICKET_PRICES, type Movie, type TicketType } from "../types";
import SeatMap from "../components/SeatMap";
import TicketSelector from "../components/TicketSelector";

// UI prototype only. nothing here is saved or sent to the backend
export default function BookingPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const showtime = params.get("showtime");
  const date = params.get("date");
  const dateLabel = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? formatShowDate(date) : null;

  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Record<TicketType, number>>({ adult: 1, child: 0, senior: 0 });
  const [seats, setSeats] = useState<Set<string>>(new Set());

  useEffect(() => {
    getMovie(Number(id)).then(setMovie).finally(() => setLoading(false));
  }, [id]);

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
  const toggleSeat = (seat: string) =>
    setSeats((prev) => {
      const next = new Set(prev);
      if (next.has(seat)) next.delete(seat);
      else if (next.size < ticketTotal) next.add(seat);
      return next;
    });

  if (loading) return <p className="notice">Loading…</p>;
  if (!movie) return <p className="notice">We couldn't find that movie. <Link to="/">Back to movies</Link></p>;

  const remaining = ticketTotal - seats.size;
  const allChosen = ticketTotal > 0 && remaining === 0;
  const hint =
    ticketTotal === 0 ? "Add at least one ticket to choose seats."
    : allChosen ? "All seats chosen. Deselect one to pick a different seat."
    : `Select ${remaining} more seat${remaining > 1 ? "s" : ""}.`;

  return (
    <div className="booking">
      <Link to={`/movies/${movie.id}`} className="back">← Back to {movie.title}</Link>
      <h1>Book tickets</h1>
      <p className="meta booking-summary">
        <strong>{movie.title}</strong> · {dateLabel ? `${dateLabel} · ` : ""}{showtime ?? "No showtime chosen"}
      </p>

      <div className="booking-grid">
        <section>
          <h2>Tickets</h2>
          <TicketSelector counts={counts} onChange={changeTickets} />
        </section>

        <section>
          <h2>Choose seats</h2>
          <p className={allChosen ? "hint hint-ok" : "hint"}>{hint}</p>
          <SeatMap selected={seats} onToggle={toggleSeat} locked={ticketTotal === 0 || allChosen} />
        </section>

        <aside className="order" aria-label="Order summary">
          <h2>Your order</h2>
          <dl>
            <dt>Tickets</dt><dd>{ticketTotal}</dd>
            <dt>Seats</dt><dd>{seats.size ? [...seats].sort().join(", ") : "None yet"}</dd>
            <dt>Total</dt><dd>${price.toFixed(2)}</dd>
          </dl>
          <button type="button" className="btn btn-primary" disabled title="Checkout is coming in a later sprint">
            Continue to checkout
          </button>
          <p className="meta">Checkout isn't available yet.</p>
        </aside>
      </div>
    </div>
  );
}