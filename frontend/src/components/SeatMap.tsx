const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const COLS = 10;

// Taken state is demoed.
export const TAKEN_SEATS = new Set(["A4", "A5", "C7", "C8", "D3", "E5", "E6", "F9", "G2", "H10"]);

interface Props {
  selected: Set<string>;
  onToggle: (seat: string) => void;
  locked: boolean;
}

// The seat layout on the booking page. Builds rows A to H with 10 seats each.
// BookingPage decides which seats are picked. This just draws them.
export default function SeatMap({ selected, onToggle, locked }: Props) {
  return (
    <div className="seatmap">
      <div className="screen" aria-hidden="true">Screen</div>
      <div className="seat-grid" role="group" aria-label="Seat map">
        {ROWS.map((row) => (
          <div className="seat-row" key={row}>
            <span className="row-label" aria-hidden="true">{row}</span>
            {Array.from({ length: COLS }, (_, i) => {
              const id = `${row}${i + 1}`;
              const taken = TAKEN_SEATS.has(id);
              const isOn = selected.has(id);
              // Already-picked seats stay clickable so they can be released.
              const blocked = locked && !isOn && !taken;
              return (
                <button
                  key={id}
                  type="button"
                  className={`seat ${taken ? "seat-taken" : isOn ? "seat-on" : ""} ${blocked ? "seat-locked" : ""} ${i === 4 ? "seat-aisle" : ""}`}
                  disabled={taken || blocked}
                  aria-pressed={isOn}
                  aria-label={`Seat ${id}${taken ? ", taken" : ""}`}
                  onClick={() => onToggle(id)}
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