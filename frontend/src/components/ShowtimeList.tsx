import type { ShowDate } from "../showtimes";

interface Props {
  dates: ShowDate[];
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  selectedTime: string | null;
  onSelectTime: (t: string) => void;
}

// Date buttons and time buttons on the details page.
export default function ShowtimeList({ dates, selectedDate, onSelectDate, selectedTime, onSelectTime }: Props) {
  // Only show the times for the date that is picked.
  const times = dates.find((d) => d.iso === selectedDate)?.times ?? [];

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
        {times.length === 0 ? (
          <p className="meta">No showtimes scheduled for this date.</p>
        ) : (
          times.map((t) => (
            <button
              key={t}
              type="button"
              className={`chip ${selectedTime === t ? "chip-on" : ""}`}
              aria-pressed={selectedTime === t}
              onClick={() => onSelectTime(t)}
            >
              {t}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
