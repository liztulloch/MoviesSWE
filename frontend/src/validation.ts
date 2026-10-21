import type { Address, CardInput } from "./types";

// Form checks shared by every page. Each returns an error message, or "" when the value is fine.
// These give quick feedback while typing. The backend still has to check everything again.

export const required = (value: string, label: string) => (value.trim() ? "" : `${label} is required.`);

export function emailError(value: string) {
  if (!value.trim()) return "Email is required.";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? "" : "Enter a valid email, like name@example.com.";
}

export function phoneError(value: string) {
  if (!value.trim()) return "Phone number is required.";
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15 ? "" : "Enter a phone number with area code, like 706-555-0123.";
}

// Shown as a live checklist under new password fields.
export const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "A letter", test: (p: string) => /[a-z]/i.test(p) },
  { label: "A number", test: (p: string) => /\d/.test(p) },
];

export function passwordError(value: string) {
  if (!value) return "Password is required.";
  return PASSWORD_RULES.every((r) => r.test(value)) ? "" : "Your password doesn't meet all the rules below.";
}

export const confirmError = (password: string, confirm: string) =>
  !confirm ? "Please type your password again." : confirm === password ? "" : "Passwords don't match.";

export const codeError = (code: string) => (/^\d{4}$/.test(code) ? "" : "Enter the 4-digit code from your email.");

export const isAddressEmpty = (a: Address) => Object.values(a).every((v) => !v.trim());

export type AddressErrors = Partial<Record<keyof Address, string>>;

// An optional address may be left fully blank, but a half-filled one isn't allowed.
export function addressErrors(a: Address, optional: boolean): AddressErrors {
  if (optional && isAddressEmpty(a)) return {};
  const errors: AddressErrors = {};
  if (!a.street.trim()) errors.street = "Street address is required.";
  if (!a.city.trim()) errors.city = "City is required.";
  if (!/^[A-Za-z]{2}$/.test(a.state.trim())) errors.state = "Use the 2-letter state code, like GA.";
  if (!/^\d{5}(-\d{4})?$/.test(a.zip.trim())) errors.zip = "Enter a 5-digit ZIP code.";
  return errors;
}

export type CardErrors = Partial<Record<"cardholderName" | "number" | "expiry", string>> & {
  billingAddress?: AddressErrors;
};

// Luhn checksum, which catches most mistyped card numbers. 4111 1111 1111 1111 is a valid test number.
function passesLuhn(digits: string) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export function cardBrand(number: string) {
  const d = number.replace(/\D/g, "");
  if (/^4/.test(d)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "Amex";
  if (/^6(011|5)/.test(d)) return "Discover";
  return "Card";
}

export function cardErrors(c: CardInput, now = new Date()): CardErrors {
  const errors: CardErrors = {};
  if (!c.cardholderName.trim()) errors.cardholderName = "Name on card is required.";

  const digits = c.number.replace(/\D/g, "");
  if (!digits) errors.number = "Card number is required.";
  else if (digits.length < 13 || digits.length > 19 || !passesLuhn(digits)) errors.number = "That card number isn't valid.";

  const m = c.expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!m) errors.expiry = "Expiration date is required, as MM/YY.";
  else {
    const month = Number(m[1]);
    const year = 2000 + Number(m[2]);
    if (month < 1 || month > 12) errors.expiry = "Month must be between 01 and 12.";
    // Months counted from year 0, so "12/25" vs today is a single comparison.
    else if (year * 12 + month < now.getFullYear() * 12 + now.getMonth() + 1) errors.expiry = "This card has expired.";
  }

  const billing = addressErrors(c.billingAddress, false);
  if (hasErrors(billing)) errors.billingAddress = billing;
  return errors;
}

// True when any value in an errors object is set.
export const hasErrors = (errors: object) => Object.values(errors).some(Boolean);

// Formatters used while typing: "4111111111111111" -> "4111 1111 1111 1111", "1228" -> "12/28".
export const formatCardNumber = (v: string) => v.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
export function formatExpiry(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}
