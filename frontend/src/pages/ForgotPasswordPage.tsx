import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword } from "../api/auth";
import { messageOf } from "../api/client";
import Alert from "../components/Alert";
import FormField, { RequiredNote } from "../components/FormField";
import { emailError } from "../validation";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const err = emailError(email);
    setError(err);
    if (err) return;
    setSubmitting(true);
    try {
      const res = await forgotPassword(email.trim());
      navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`, {
        state: { message: res.message, devCode: res.devCode },
      });
    } catch (err) {
      setFormError(messageOf(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <h1>Forgot your password?</h1>
      <p className="lead">No problem. Enter the email you signed up with and we'll send you a code to reset it.</p>

      <form className="form" noValidate onSubmit={submit}>
        <RequiredNote />
        <FormField label="Email" type="email" required autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
        {formError && <Alert kind="error">{formError}</Alert>}
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? "Sending…" : "Send reset code"}
        </button>
      </form>

      <p className="form-footer">
        Remembered it? <Link to="/login">Back to log in</Link>
      </p>
    </div>
  );
}
