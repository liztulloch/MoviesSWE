import { TICKET_PRICES, type TicketType } from "../types";

interface Props {
  counts: Record<TicketType, number>;
  onChange: (type: TicketType, count: number) => void;
}

const LABELS: Record<TicketType, string> = { adult: "Adult", child: "Child", senior: "Senior" };

// The + and - buttons for adult, child, and senior tickets, with each price.
// Makes one row for each type in TICKET_PRICES.
export default function TicketSelector({ counts, onChange }: Props) {
  return (
    <div className="tickets">
      {(Object.keys(TICKET_PRICES) as TicketType[]).map((type) => (
        <div key={type} className="ticket-row">
          <div>
            <strong>{LABELS[type]}</strong>
            <div className="meta">${TICKET_PRICES[type].toFixed(2)} each</div>
          </div>
          <div className="stepper">
            <button
              type="button"
              aria-label={`Remove one ${LABELS[type]} ticket`}
              disabled={counts[type] === 0}
              onClick={() => onChange(type, counts[type] - 1)}
            >
              -
            </button>
            <output aria-live="polite">{counts[type]}</output>
            <button
              type="button"
              aria-label={`Add one ${LABELS[type]} ticket`}
              disabled={counts[type] >= 10}
              onClick={() => onChange(type, counts[type] + 1)}
            >
              +
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}