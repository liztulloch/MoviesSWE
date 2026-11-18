import type { ShowDay } from "../showtimes";
import type { Showtime } from "../types";

interface Props {
  dates: ShowDay[];
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  selected: Showtime | null;
  onSelect: (s: Showtime) => void;
}

// Date buttons and time buttons on the details page.
export default function ShowtimeList({ dates, selectedDate, onSelectDate, selected, onSelect }: Props) {
  if (dates.length === 0) return <p className="meta">No showtimes are scheduled for this movie yet.</p>;

  // Only show the times for the date that is picked.
  const showtimes = dates.find((d) => d.iso === selectedDate)?.showtimes ?? [];

  return (
    <div>
      <p className="picker-label">Date</p>
      <div className="showtimes" role="group" aria-label="Show dates">
        {dates.map((d) => (
          <button
            key={d.iso}
            type="button"
            className={`chip ${selectedDate === d.iso ? "chip-on" : ""}`}
            aria-pressed={selectedDate === d.iso}
            onClick={() => onSelectDate(d.iso)}
          >
            {d.label}
          </button>
        ))}
      </div>

      <p className="picker-label">Time</p>
      <div className="showtimes" role="group" aria-label="Showtimes">
        {showtimes.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`chip ${selected?.id === s.id ? "chip-on" : ""}`}
            aria-pressed={selected?.id === s.id}
            onClick={() => onSelect(s)}
          >
            {s.time} · Hall {s.hall}
          </button>
        ))}
      </div>
    </div>
  );
}
