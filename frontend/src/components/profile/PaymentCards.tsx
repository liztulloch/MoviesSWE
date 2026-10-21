import { useState, type FormEvent } from "react";
import { addCard, removeCard } from "../../api/profile";
import { messageOf } from "../../api/client";
import Alert, { type Notice } from "../Alert";
import CardFields from "../CardFields";
import { RequiredNote } from "../FormField";
import { cardErrors, hasErrors, type CardErrors } from "../../validation";
import { MAX_CARDS, emptyCard, type Address, type CardInput, type SavedCard } from "../../types";

interface Props {
  cards: SavedCard[];
  homeAddress: Address | null;
  onChange: (cards: SavedCard[]) => void;
}

// Saved cards plus a form to add one. Only the brand and last 4 digits are ever shown.
// The add button goes away at MAX_CARDS. The backend has to enforce the limit as well.
export default function PaymentCards({ cards, homeAddress, onChange }: Props) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<CardInput>(emptyCard());
  const [errors, setErrors] = useState<CardErrors>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const full = cards.length >= MAX_CARDS;

  function cancel() {
    setAdding(false);
    setDraft(emptyCard());
    setErrors({});
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setNotice(null);
    const errs = cardErrors(draft);
    setErrors(errs);
    if (hasErrors(errs)) return;
    setSaving(true);
    try {
      const card = await addCard(draft);
      onChange([...cards, card]);
      cancel();
      setNotice({ kind: "success", text: `Your ${card.brand} ending in ${card.last4} was saved.` });
    } catch (err) {
      setNotice({ kind: "error", text: messageOf(err) });
    } finally {
      setSaving(false);
    }
  }

  async function remove(card: SavedCard) {
    if (!window.confirm(`Remove the ${card.brand} ending in ${card.last4}?`)) return;
    setNotice(null);
    setRemovingId(card.id);
    try {
      await removeCard(card.id);
      onChange(cards.filter((c) => c.id !== card.id));
      setNotice({ kind: "success", text: `Your ${card.brand} ending in ${card.last4} was removed.` });
    } catch (err) {
      setNotice({ kind: "error", text: messageOf(err) });
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="form">
      <p className="hint">
        {cards.length} of {MAX_CARDS} cards saved. Card numbers are stored encrypted and only the last 4 digits are shown.
      </p>

      {cards.length > 0 ? (
        <ul className="saved-cards">
          {cards.map((card) => (
            <li key={card.id} className="saved-card">
              <div>
                <strong>{card.brand} •••• {card.last4}</strong>
                <p className="meta">Expires {card.expiry}</p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(card)} disabled={removingId === card.id}>
                {removingId === card.id ? "Removing…" : "Remove"}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="meta">You don't have any saved cards yet.</p>
      )}

      {notice && <Alert kind={notice.kind}>{notice.text}</Alert>}

      {adding ? (
        <form className="card-block" noValidate onSubmit={save}>
          <p className="subhead">New card</p>
          <RequiredNote />
          <CardFields value={draft} onChange={setDraft} errors={errors} homeAddress={homeAddress} />
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving card…" : "Save card"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={cancel} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      ) : full ? (
        <p className="hint">You've reached the limit of {MAX_CARDS} cards. Remove one to add a different card.</p>
      ) : (
        <div>
          <button type="button" className="btn" onClick={() => { setAdding(true); setNotice(null); }}>
            + Add a card
          </button>
        </div>
      )}
    </div>
  );
}
