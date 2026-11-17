import { SEATS_PER_ROW, seatLabel, seatRow } from "../showtimes";
import type { ShowSeat } from "../types";

interface Props {
  seats: ShowSeat[];
  selected: Set<number>;
  onToggle: (id: number) => void;
  locked: boolean;
}

// The seat layout on the booking page, built from the showroom's seats in the database.
// BookingPage decides which seats are picked. This just draws them.
export default function SeatMap({ seats, selected, onToggle, locked }: Props) {
  if (seats.length === 0) return <p className="notice">Seats for this showing aren't available yet.</p>;

  const rows = new Map<string, ShowSeat[]>();
  for (const seat of seats) {
    const row = seatRow(seat.number);
    if (!rows.has(row)) rows.set(row, []);
    rows.get(row)!.push(seat);
  }

  return (
    <div className="seatmap">
      <div className="screen" aria-hidden="true">Screen</div>
      <div className="seat-grid" role="group" aria-label="Seat map">
        {[...rows.entries()].map(([row, rowSeats]) => (
          <div className="seat-row" key={row}>
            <span className="row-label" aria-hidden="true">{row}</span>
            {rowSeats.map((seat) => {
              const label = seatLabel(seat.number);
              const taken = seat.status !== "Available";
              const isOn = selected.has(seat.id);
              // Already-picked seats stay clickable so they can be released.
              const blocked = locked && !isOn && !taken;
              return (
                <button
                  key={seat.id}
                  type="button"
                  className={`seat ${taken ? "seat-taken" : isOn ? "seat-on" : ""} ${blocked ? "seat-locked" : ""} ${seat.number % SEATS_PER_ROW === 5 ? "seat-aisle" : ""}`}
                  disabled={taken || blocked}
                  aria-pressed={isOn}
                  aria-label={`Seat ${label}${taken ? `, ${seat.status.toLowerCase()}` : ""}`}
                  title={taken ? `${label} is ${seat.status.toLowerCase()}` : label}
                  onClick={() => onToggle(seat.id)}
                />
              );
            })}
          </div>
        ))}
      </div>
      <ul className="legend">
        <li><span className="seat legend-seat" /> Available</li>
        <li><span className="seat seat-on legend-seat" /> Selected</li>
        <li><span className="seat seat-taken legend-seat" /> Taken</li>
      </ul>
    </div>
  );
}
