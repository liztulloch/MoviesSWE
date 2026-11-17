import { Link, Navigate } from "react-router-dom";
import Alert from "../components/Alert";
import FormField from "../components/FormField";
import OrderSummary from "../components/OrderSummary";
import { useCheckout } from "../useCheckout";

// A preview of the payment step. Charging the card and the final confirmation come in the final release.
export default function PaymentPage() {
  const { draft, summary, error } = useCheckout();

  if (!draft) return <Navigate to="/checkout" replace />;
  if (error) {
    return <p className="notice notice-error" role="alert">{error} <Link to="/checkout">Back to order summary</Link></p>;
  }
  if (!summary) return <p className="notice">Loading your order…</p>;

  return (
    <div className="checkout">
      <Link to="/checkout" className="back">← Back to order summary</Link>
      <h1>Payment</h1>
      <Alert kind="info">Payment processing isn't available yet. Your seats stay on hold.</Alert>
      <OrderSummary summary={summary} />

      <form className="form" onSubmit={(e) => e.preventDefault()}>
        <fieldset className="form-section" disabled>
          <legend>Card details</legend>
          <p className="meta">
            Your confirmation will be sent to <strong>{summary.checkoutEmail ?? summary.accountEmail}</strong>.
          </p>
          <FormField label="Name on card" required autoComplete="cc-name" />
          <FormField label="Card number" required inputMode="numeric" autoComplete="cc-number" />
          <FormField label="Expiration date (MM/YY)" required autoComplete="cc-exp" />
        </fieldset>
        <button type="submit" className="btn btn-primary btn-block" disabled>
          Pay ${summary.subtotal.toFixed(2)} + tax
        </button>
      </form>
    </div>
  );
}
