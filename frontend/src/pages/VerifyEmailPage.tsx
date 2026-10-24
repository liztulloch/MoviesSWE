import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { resendVerification, verifyEmail } from "../api/auth";
import { messageOf } from "../api/client";
import Alert, { MockCodeNotice, type Notice } from "../components/Alert";
import FormField, { RequiredNote } from "../components/FormField";
import { codeError, emailError, hasErrors } from "../validation";

// The email comes from the URL (?email=...) so the page still works after a refresh.
export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const state = (useLocation().state ?? {}) as { message?: string; isError?: boolean; devCode?: string };
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<{ email?: string; code?: string }>({});
  const [notice, setNotice] = useState<Notice | null>(
    state.message ? { kind: state.isError ? "error" : "success", text: state.message } : null
  );
  const [devCode, setDevCode] = useState(state.devCode);
  const [busy, setBusy] = useState<"verify" | "resend" | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs = { email: emailError(email), code: codeError(code) };
    setErrors(errs);
    if (hasErrors(errs)) return;
    setBusy("verify");
    try {
      await verifyEmail(email.trim(), code);
      navigate("/login", {
        state: { message: "Your email is confirmed and your account is now active. Log in to get started!", email: email.trim() },
      });
    } catch (err) {
      setNotice({ kind: "error", text: messageOf(err) });
      setBusy(null);
    }
  }

  async function resend() {
    const err = emailError(email);
    setErrors({ email: err });
    if (err) return;
    setBusy("resend");
    try {
      const res = await resendVerification(email.trim());
      setNotice({ kind: "success", text: res.message });
      setDevCode(res.devCode);
      setCode("");
    } catch (e) {
      setNotice({ kind: "error", text: messageOf(e) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="auth-page">
      <h1>Confirm your email</h1>
      <p className="lead">Enter the 4-digit code we emailed you to activate your account.</p>
      {notice && <Alert kind={notice.kind}>{notice.text}</Alert>}
      <MockCodeNotice code={devCode} />

      <form className="form" noValidate onSubmit={submit}>
        <RequiredNote />
        <FormField label="Email" type="email" required autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <FormField
          label="Verification code"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={4}
          placeholder="1234"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          error={errors.code}
        />
        <button type="submit" className="btn btn-primary btn-block" disabled={busy !== null}>
          {busy === "verify" ? "Checking…" : "Confirm email"}
        </button>
      </form>

      <p className="form-footer">
        Didn't get a code?{" "}
        <button type="button" className="link-btn" onClick={resend} disabled={busy !== null}>
          {busy === "resend" ? "Sending…" : "Send a new code"}
        </button>
        {" · "}
        <Link to="/login">Back to log in</Link>
      </p>
    </div>
  );
}
