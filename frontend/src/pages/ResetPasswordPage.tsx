import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/auth";
import { ApiError, messageOf } from "../api/client";
import Alert, { MockCodeNotice } from "../components/Alert";
import FormField, { RequiredNote } from "../components/FormField";
import PasswordRules from "../components/PasswordRules";
import { codeError, confirmError, emailError, hasErrors, passwordError } from "../validation";

type Field = "email" | "code" | "password" | "confirm";

// Step 2 of resetting a password: the code from the email plus the new password.
export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const state = (useLocation().state ?? {}) as { message?: string; devCode?: string };
  const [form, setForm] = useState<Record<Field, string>>({
    email: params.get("email") ?? "", code: "", password: "", confirm: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key: Field, value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const errs = {
      email: emailError(form.email),
      code: codeError(form.code),
      password: passwordError(form.password),
      confirm: confirmError(form.password, form.confirm),
    };
    setErrors(errs);
    if (hasErrors(errs)) return;
    setSubmitting(true);
    try {
      await resetPassword(form.email.trim(), form.code, form.password);
      navigate("/login", {
        state: { message: "Your password has been reset. Log in with your new password.", email: form.email.trim() },
      });
    } catch (err) {
      if (err instanceof ApiError) setErrors((prev) => ({ ...prev, ...err.fieldErrors }));
      setFormError(messageOf(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <h1>Choose a new password</h1>
      <p className="lead">Enter the 4-digit code from your email, then pick a new password.</p>
      {state.message && <Alert kind="success">{state.message}</Alert>}
      <MockCodeNotice code={state.devCode} />

      <form className="form" noValidate onSubmit={submit}>
        <RequiredNote />
        <FormField label="Email" type="email" required autoComplete="email"
          value={form.email} onChange={(e) => set("email", e.target.value)} error={errors.email} />
        <FormField label="Reset code" required inputMode="numeric" autoComplete="one-time-code" maxLength={4} placeholder="1234"
          value={form.code} onChange={(e) => set("code", e.target.value.replace(/\D/g, ""))} error={errors.code} />
        <div>
          <FormField label="New password" type="password" required autoComplete="new-password"
            value={form.password} onChange={(e) => set("password", e.target.value)} error={errors.password} />
          <PasswordRules password={form.password} />
        </div>
        <FormField label="Confirm new password" type="password" required autoComplete="new-password"
          value={form.confirm} onChange={(e) => set("confirm", e.target.value)} error={errors.confirm} />
        {formError && <Alert kind="error">{formError}</Alert>}
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? "Saving…" : "Reset password"}
        </button>
      </form>

      <p className="form-footer">
        Didn't get a code? <Link to="/forgot-password">Send another</Link> · <Link to="/login">Back to log in</Link>
      </p>
    </div>
  );
}
