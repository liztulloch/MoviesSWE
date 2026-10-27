import { useState, type FormEvent } from "react";
import { addCard, removeCard, updateCard } from "../../api/profile";
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

// openFor: null = no form, "new" = adding a card, a number = editing that card.
export default function PaymentCards({ cards, homeAddress, onChange }: Props) {
  const [openFor, setOpenFor] = useState<"new" | number | null>(null);
  const [draft, setDraft] = useState<CardInput>(emptyCard());
  const [errors, setErrors] = useState<CardErrors>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const full = cards.length >= MAX_CARDS;
  const editing = typeof openFor === "number" ? cards.find((c) => c.id === openFor) : undefined;

  function open(card?: SavedCard) {
    setDraft(card
      ? { cardholderName: card.cardholderName, number: "", expiry: card.expiry, billingAddress: { ...card.billingAddress } }
      : emptyCard());
    setErrors({});
    setNotice(null);
    setOpenFor(card ? card.id : "new");
  }

  function close() {
    setOpenFor(null);
    setDraft(emptyCard());
    setErrors({});
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setNotice(null);
    const errs = cardErrors(draft, !!editing);
    setErrors(errs);
    if (hasErrors(errs)) return;
    setSaving(true);
    try {
      if (editing) {
        const card = await updateCard(editing.id, draft);
        onChange(cards.map((c) => (c.id === card.id ? card : c)));
        setNotice({ kind: "success", text: `Your ${card.brand} ending in ${card.last4} was updated.` });
      } else {
        const card = await addCard(draft);
        onChange([...cards, card]);
        setNotice({ kind: "success", text: `Your ${card.brand} ending in ${card.last4} was saved.` });
      }
      close();
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
      if (openFor === card.id) close();
      setNotice({ kind: "success", text: `Your ${card.brand} ending in ${card.last4} was removed.` });
    } catch (err) {
      setNotice({ kind: "error", text: messageOf(err) });
    } finally {
      setRemovingId(null);
    }
  }

  const form = (
    <form className="card-block" noValidate onSubmit={save}>
      <p className="subhead">{editing ? `Edit ${editing.brand} •••• ${editing.last4}` : "New card"}</p>
      <RequiredNote />
      <CardFields
        value={draft}
        onChange={setDraft}
        errors={errors}
        homeAddress={homeAddress}
        existingLast4={editing?.last4}
      />
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving card…" : "Save card"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={close} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );

  return (
    <div className="form">
      <p className="hint">
        {cards.length} of {MAX_CARDS} cards saved. Card numbers are stored encrypted and only the last 4 digits are shown.
      </p>

      {cards.length > 0 ? (
        <ul className="saved-cards">
          {cards.map((card) => (
            <li key={card.id}>
              <div className="saved-card">
                <div>
                  <strong>{card.brand} •••• {card.last4}</strong>
                  <p className="meta">{card.cardholderName ? `${card.cardholderName} · ` : ""}Expires {card.expiry}</p>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => open(card)} disabled={saving || openFor === card.id}>
                    Edit
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(card)} disabled={removingId === card.id}>
                    {removingId === card.id ? "Removing…" : "Remove"}
                  </button>
                </div>
              </div>
              {openFor === card.id && form}
            </li>
          ))}
        </ul>
      ) : (
        <p className="meta">You don't have any saved cards yet.</p>
      )}

      {notice && <Alert kind={notice.kind}>{notice.text}</Alert>}

      {openFor === "new" ? (
        form
      ) : full ? (
        <p className="hint">You've reached the limit of {MAX_CARDS} cards. Remove one to add a different card.</p>
      ) : (
        <div>
          <button type="button" className="btn" onClick={() => open()}>
            + Add a card
          </button>
        </div>
      )}
    </div>
  );
}
