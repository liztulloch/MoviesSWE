import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../../api/profile";
import { ApiError, messageOf } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import Alert, { type Notice } from "../Alert";
import FormField, { RequiredNote } from "../FormField";
import PasswordRules from "../PasswordRules";
import { confirmError, hasErrors, passwordError } from "../../validation";

type Field = "currentPassword" | "newPassword" | "confirm";
const EMPTY: Record<Field, string> = { currentPassword: "", newPassword: "", confirm: "" };

// The backend ends every session for this account on a password change (this one too), so the user logs in again.
export default function ChangePasswordForm() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (key: Field, value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setNotice(null);
    const errs = {
      currentPassword: form.currentPassword ? "" : "Enter your current password.",
      newPassword: passwordError(form.newPassword),
      confirm: confirmError(form.newPassword, form.confirm),
    };
    setErrors(errs);
    if (hasErrors(errs)) return;
    setSaving(true);
    try {
      await changePassword(form.currentPassword, form.newPassword);
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      setNotice({ kind: "error", text: messageOf(err) });
      setSaving(false);
      return;
    }
    const message = "Your password was changed. Please log in with your new password.";
    await logout(message);
    navigate("/login", { replace: true, state: { message } });
  }

  return (
    <form className="form" noValidate onSubmit={submit}>
      <RequiredNote />
      <FormField label="Current password" type="password" required autoComplete="current-password"
        value={form.currentPassword} onChange={(e) => set("currentPassword", e.target.value)} error={errors.currentPassword} />
      <div>
        <FormField label="New password" type="password" required autoComplete="new-password"
          value={form.newPassword} onChange={(e) => set("newPassword", e.target.value)} error={errors.newPassword} />
        <PasswordRules password={form.newPassword} />
      </div>
      <FormField label="Confirm new password" type="password" required autoComplete="new-password"
        value={form.confirm} onChange={(e) => set("confirm", e.target.value)} error={errors.confirm} />
      {notice && <Alert kind={notice.kind}>{notice.text}</Alert>}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Updating…" : "Change password"}
        </button>
      </div>
    </form>
  );
}
