import { useState, type ChangeEvent, type FormEvent } from "react";
import { updateProfile } from "../../api/profile";
import { ApiError, USE_MOCK_AUTH, messageOf } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import AddressFields from "../AddressFields";
import Alert, { type Notice } from "../Alert";
import FormField, { RequiredNote } from "../FormField";
import { addressErrors, hasErrors, isAddressEmpty, phoneError, required, type AddressErrors } from "../../validation";
import { EMPTY_ADDRESS, type Address, type Profile } from "../../types";

type Field = "firstName" | "lastName" | "phone";

// Name, phone, promotions and the one home address, saved together.
// Email is shown but locked, because it identifies the account.
export default function PersonalInfoForm({ profile, onSaved }: { profile: Profile; onSaved: (p: Profile) => void }) {
  const { updateUser } = useAuth();
  const [form, setForm] = useState<Record<Field, string>>({
    firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone,
  });
  const [receivePromotions, setReceivePromotions] = useState(profile.receivePromotions);
  const [address, setAddress] = useState<Address>(profile.address ?? { ...EMPTY_ADDRESS });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [addressErr, setAddressErr] = useState<AddressErrors>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (key: Field) => (e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setNotice(null);
    const errs = {
      firstName: required(form.firstName, "First name"),
      lastName: required(form.lastName, "Last name"),
      phone: phoneError(form.phone),
    };
    const aErrs = addressErrors(address, true);
    setErrors(errs);
    setAddressErr(aErrs);
    if (hasErrors(errs) || hasErrors(aErrs)) {
      setNotice({ kind: "error", text: "Please fix the highlighted fields and try again." });
      return;
    }
    setSaving(true);
    try {
      const saved = await updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        receivePromotions,
        address: isAddressEmpty(address) ? null : address,
      });
      onSaved(saved);
      updateUser({ firstName: saved.firstName, lastName: saved.lastName });
      // The change notification email is sent by the backend, so the mock can't promise one.
      setNotice({
        kind: "success",
        text: USE_MOCK_AUTH
          ? "Your profile was saved. (Demo mode: the change notification email will come from the backend.)"
          : `Your profile was saved. We've emailed ${profile.email} to let you know about this change.`,
      });
    } catch (err) {
      if (err instanceof ApiError) setErrors((prev) => ({ ...prev, ...err.fieldErrors }));
      setNotice({ kind: "error", text: messageOf(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form" noValidate onSubmit={submit}>
      <RequiredNote />
      <div className="form-grid">
        <FormField label="First name" required autoComplete="given-name" maxLength={100}
          value={form.firstName} onChange={set("firstName")} error={errors.firstName} />
        <FormField label="Last name" required autoComplete="family-name" maxLength={100}
          value={form.lastName} onChange={set("lastName")} error={errors.lastName} />
        <FormField label="Email" type="email" value={profile.email} disabled readOnly
          hint="Your email can't be changed because it's your login." />
        <FormField label="Phone number" type="tel" required autoComplete="tel" maxLength={20}
          value={form.phone} onChange={set("phone")} error={errors.phone} />
      </div>
      <label className="check">
        <input type="checkbox" checked={receivePromotions} onChange={(e) => setReceivePromotions(e.target.checked)} />
        <span>Email me about promotions and discounts</span>
      </label>

      <div className="card-block-head">
        <p className="subhead">Home address <span className="optional">(optional, one per account)</span></p>
        {!isAddressEmpty(address) && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAddress({ ...EMPTY_ADDRESS })}>
            Clear address
          </button>
        )}
      </div>
      <AddressFields value={address} onChange={setAddress} errors={addressErr} />

      {notice && <Alert kind={notice.kind}>{notice.text}</Alert>}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
