import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cancelBooking, setCheckoutEmail, type DraftRef } from "../api/booking";
import { messageOf } from "../api/client";
import Alert from "../components/Alert";
import FormField from "../components/FormField";
import OrderSummary from "../components/OrderSummary";
import type { CheckoutSummary } from "../types";
import { useCheckout } from "../useCheckout";
import { emailError } from "../validation";

export default function CheckoutPage() {
  const { draft, summary, error } = useCheckout();

  if (!draft) {
    return (
      <div className="empty">
        <h2>No booking in progress</h2>
        <p>Pick a movie and a showtime to choose your seats.</p>
        <Link className="btn" to="/">Browse movies</Link>
      </div>
    );
  }
  if (error) {
    return (
      <div className="empty">
        <h2>We couldn't load your order</h2>
        <p>{error}</p>
        <Link className="btn" to={`/booking/${draft.movieId}?showtime=${draft.showtimeId}`}>Choose seats again</Link>
      </div>
    );
  }
  if (!summary) return <p className="notice">Loading your order…</p>;

  return (
    <div className="checkout">
      <h1>Checkout</h1>
      <OrderSummary summary={summary} />
      <EmailForm draft={draft} summary={summary} />
    </div>
  );
}

// Only mounted once the order has loaded, so coming back from the payment page starts with the email chosen before.
function EmailForm({ draft, summary }: { draft: DraftRef; summary: CheckoutSummary }) {
  const navigate = useNavigate();
  const saved = summary.checkoutEmail && summary.checkoutEmail !== summary.accountEmail ? summary.checkoutEmail : "";
  const [sendElsewhere, setSendElsewhere] = useState(Boolean(saved));
  const [email, setEmail] = useState(saved);
  const [emailErr, setEmailErr] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const err = sendElsewhere ? emailError(email) : "";
    setEmailErr(err);
    if (err) return;
    setBusy(true);
    try {
      await setCheckoutEmail(draft, sendElsewhere ? email.trim() : summary.accountEmail);
      navigate("/checkout/payment");
    } catch (err) {
      setFormError(messageOf(err));
      setBusy(false);
    }
  }

  async function cancel() {
    if (!window.confirm("Cancel this booking? Your seats will be released.")) return;
    setFormError("");
    setBusy(true);
    try {
      await cancelBooking(draft);
      navigate(`/movies/${draft.movieId}`, { replace: true });
    } catch (err) {
      setFormError(messageOf(err));
      setBusy(false);
    }
  }

  return (
    <form className="form" noValidate onSubmit={submit}>
      <fieldset className="form-section">
        <legend>Confirmation email</legend>
        <p className="meta">Where should we send your tickets?</p>
        <label className="check">
          <input type="radio" name="email-choice" checked={!sendElsewhere} onChange={() => setSendElsewhere(false)} />
          <span>My account email: <strong>{summary.accountEmail}</strong></span>
        </label>
        <label className="check">
          <input type="radio" name="email-choice" checked={sendElsewhere} onChange={() => setSendElsewhere(true)} />
          <span>A different email</span>
        </label>
        {sendElsewhere && (
          <FormField label="Email" type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)} error={emailErr} />
        )}
      </fieldset>

      {formError && <Alert kind="error">{formError}</Alert>}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={busy}>Continue to payment</button>
        <Link to={`/booking/${draft.movieId}?showtime=${draft.showtimeId}`}>Change tickets or seats</Link>
        <button type="button" className="link-btn" disabled={busy} onClick={cancel}>Cancel booking</button>
      </div>
    </form>
  );
}
