import { formatShowDate, seatLabel } from "../showtimes";
import type { CheckoutSummary } from "../types";

const money = (n: number) => `$${n.toFixed(2)}`;

export default function OrderSummary({ summary }: { summary: CheckoutSummary }) {
  const ticketCount = summary.tickets.reduce((sum, t) => sum + t.quantity, 0);
  return (
    <section className="order" aria-label="Order summary">
      <h2>Order summary</h2>
      <dl>
        <dt>Movie</dt><dd>{summary.movieTitle}</dd>
        <dt>Showtime</dt><dd>{formatShowDate(summary.date)} · {summary.time} · Hall {summary.hall}</dd>
        <dt>Seats</dt><dd>{summary.seats.map(seatLabel).join(", ")}</dd>
        <dt>Tickets</dt><dd>{ticketCount}</dd>
      </dl>
      <table className="table">
        <thead>
          <tr><th scope="col">Ticket</th><th scope="col">Quantity</th><th scope="col">Price each</th><th scope="col">Subtotal</th></tr>
        </thead>
        <tbody>
          {summary.tickets.map((t) => (
            <tr key={t.type}><td>{t.type}</td><td>{t.quantity}</td><td>{money(t.unitPrice)}</td><td>{money(t.lineTotal)}</td></tr>
          ))}
        </tbody>
        <tfoot>
          <tr><th scope="row" colSpan={3}>Total before tax</th><td>{money(summary.subtotal)}</td></tr>
        </tfoot>
      </table>
    </section>
  );
}
