import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { messageOf } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Alert from "../components/Alert";
import FormField, { RequiredNote } from "../components/FormField";
import { emailError, hasErrors } from "../validation";
import type { SessionUser } from "../types";

// What other pages can pass here through navigate("/login", { state }).
interface LoginState {
  message?: string;
  from?: { pathname: string; search?: string };
  email?: string;
}

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const state = (useLocation().state ?? {}) as LoginState;
  const [email, setEmail] = useState(state.email ?? "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const destination = (u: SessionUser) =>
    u.role === "admin" ? "/admin" : state.from ? state.from.pathname + (state.from.search ?? "") : "/";

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const errs = { email: emailError(email), password: password ? "" : "Password is required." };
    setErrors(errs);
    if (hasErrors(errs)) return;
    setSubmitting(true);
    try {
      const u = await login(email.trim(), password, remember);
      navigate(destination(u), { replace: true });
    } catch (err) {
      setFormError(messageOf(err));
      setPassword("");
      setSubmitting(false);
    }
  }

  // Already logged in (or just logged in): skip the form.
  if (user) return <Navigate to={destination(user)} replace />;

  const verifyLink = `/verify-email${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ""}`;

  return (
    <div className="auth-page">
      <h1>Log in</h1>
      <p className="lead">Welcome back! Log in to book tickets and manage your profile.</p>
      {state.message && <Alert kind="success">{state.message}</Alert>}

      <form className="form" noValidate onSubmit={submit}>
        <RequiredNote />
        <FormField label="Email" type="email" required autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <FormField label="Password" type="password" required autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />

        <div className="form-links">
          <label className="check">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span>Remember me</span>
          </label>
          <Link to="/forgot-password">Forgot your password?</Link>
        </div>

        {formError && <Alert kind="error">{formError}</Alert>}
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="form-footer">
        New here? <Link to="/register">Create an account</Link>
        <br />
        Haven't confirmed your email yet? <Link to={verifyLink}>Enter your code</Link>
      </p>
    </div>
  );
}
