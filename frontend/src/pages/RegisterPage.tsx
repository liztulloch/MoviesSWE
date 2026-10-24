import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { register } from "../api/auth";
import { ApiError, messageOf } from "../api/client";
import { useAuth } from "../context/AuthContext";
import AddressFields from "../components/AddressFields";
import Alert from "../components/Alert";
import CardFields from "../components/CardFields";
import FormField, { RequiredNote } from "../components/FormField";
import PasswordRules from "../components/PasswordRules";
import {
  addressErrors, cardErrors, confirmError, emailError, hasErrors, isAddressEmpty,
  passwordError, phoneError, required, type AddressErrors, type CardErrors,
} from "../validation";
import { EMPTY_ADDRESS, MAX_CARDS, emptyCard, type Address, type CardInput } from "../types";

type Field = "firstName" | "lastName" | "email" | "phone" | "password" | "confirm";

export default function RegisterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<Record<Field, string>>({
    firstName: "", lastName: "", email: "", phone: "", password: "", confirm: "",
  });
  const [receivePromotions, setReceivePromotions] = useState(false);
  const [address, setAddress] = useState<Address>({ ...EMPTY_ADDRESS });
  const [cards, setCards] = useState<CardInput[]>([]);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [addressErr, setAddressErr] = useState<AddressErrors>({});
  const [cardErrs, setCardErrs] = useState<CardErrors[]>([]);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key: Field) => (e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const updateCard = (i: number, card: CardInput) => setCards((list) => list.map((c, j) => (j === i ? card : c)));
  const removeCard = (i: number) => {
    setCards((list) => list.filter((_, j) => j !== i));
    setCardErrs((list) => list.filter((_, j) => j !== i));
  };

  function validate() {
    const e = {
      firstName: required(form.firstName, "First name"),
      lastName: required(form.lastName, "Last name"),
      email: emailError(form.email),
      phone: phoneError(form.phone),
      password: passwordError(form.password),
      confirm: confirmError(form.password, form.confirm),
    };
    const a = addressErrors(address, true);
    const c = cards.map((card) => cardErrors(card));
    setErrors(e);
    setAddressErr(a);
    setCardErrs(c);
    return !hasErrors(e) && !hasErrors(a) && !c.some(hasErrors);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!validate()) {
      setFormError("Please fix the highlighted fields and try again.");
      return;
    }
    setSubmitting(true);
    const email = form.email.trim();
    try {
      const res = await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email,
        phone: form.phone.trim(),
        password: form.password,
        receivePromotions,
        address: isAddressEmpty(address) ? null : address,
        cards,
      });
      navigate(`/verify-email?email=${encodeURIComponent(email)}`, {
        state: { message: res.message, devCode: res.devCode },
      });
    } catch (err) {
      // 503: the account was saved but the email didn't send, so go verify and resend the code.
      if (err instanceof ApiError && err.status === 503) {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`, { state: { message: err.message, isError: true } });
        return;
      }
      if (err instanceof ApiError) setErrors((prev) => ({ ...prev, ...err.fieldErrors }));
      setFormError(messageOf(err));
      setSubmitting(false);
    }
  }

  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/"} replace />;

  return (
    <div className="auth-page auth-wide">
      <h1>Create your account</h1>
      <p className="lead">Sign up to book tickets faster, save favorite movies and get special offers.</p>

      <form className="form" noValidate onSubmit={submit}>
        <RequiredNote />

        <fieldset className="form-section">
          <legend>Account details</legend>
          <div className="form-grid">
            <FormField label="First name" required autoComplete="given-name" maxLength={100}
              value={form.firstName} onChange={set("firstName")} error={errors.firstName} />
            <FormField label="Last name" required autoComplete="family-name" maxLength={100}
              value={form.lastName} onChange={set("lastName")} error={errors.lastName} />
            <FormField label="Email" type="email" required autoComplete="email"
              value={form.email} onChange={set("email")} error={errors.email}
              hint="We'll send a code here to confirm it's you." />
            <FormField label="Phone number" type="tel" required autoComplete="tel" maxLength={20} placeholder="706-555-0123"
              value={form.phone} onChange={set("phone")} error={errors.phone} />
            <div className="span-2">
              <FormField label="Password" type="password" required autoComplete="new-password" maxLength={128}
                value={form.password} onChange={set("password")} error={errors.password} />
              <PasswordRules password={form.password} />
            </div>
            <FormField className="span-2" label="Confirm password" type="password" required autoComplete="new-password" maxLength={128}
              value={form.confirm} onChange={set("confirm")} error={errors.confirm} />
          </div>
          <label className="check">
            <input type="checkbox" checked={receivePromotions} onChange={(e) => setReceivePromotions(e.target.checked)} />
            <span>Email me about promotions and discounts</span>
          </label>
        </fieldset>

        <fieldset className="form-section">
          <legend>Home address <span className="optional">(optional)</span></legend>
          <p className="hint">Leave this blank to skip it, or fill in every field.</p>
          <AddressFields value={address} onChange={setAddress} errors={addressErr} />
        </fieldset>

        <fieldset className="form-section">
          <legend>Payment cards <span className="optional">(optional)</span></legend>
          <p className="hint">
            Save up to {MAX_CARDS} cards for faster checkout. You can also add them later from your profile.
          </p>
          {cards.map((card, i) => (
            <div className="card-block" key={i}>
              <div className="card-block-head">
                <p className="subhead">Card {i + 1}</p>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeCard(i)}>
                  Remove card
                </button>
              </div>
              <CardFields
                value={card}
                onChange={(c) => updateCard(i, c)}
                errors={cardErrs[i]}
                homeAddress={address}
              />
            </div>
          ))}
          {cards.length < MAX_CARDS ? (
            <div>
              <button type="button" className="btn" onClick={() => setCards((list) => [...list, emptyCard()])}>
                + Add a card
              </button>
            </div>
          ) : (
            <p className="hint">You've added the maximum of {MAX_CARDS} cards.</p>
          )}
        </fieldset>

        {formError && <Alert kind="error">{formError}</Alert>}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Creating your account…" : "Create account"}
          </button>
          <p className="form-footer">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </form>
    </div>
  );
}
