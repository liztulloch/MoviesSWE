import AddressFields from "./AddressFields";
import FormField from "./FormField";
import { cardBrand, formatCardNumber, formatExpiry, isAddressEmpty, type CardErrors } from "../validation";
import type { Address, CardInput } from "../types";

interface Props {
  value: CardInput;
  onChange: (card: CardInput) => void;
  errors?: CardErrors;
  homeAddress?: Address | null;
  existingLast4?: string; // editing a saved card: a blank number keeps it
}

export default function CardFields({ value, onChange, errors = {}, homeAddress, existingLast4 }: Props) {
  const digits = value.number.replace(/\D/g, "");
  const brand = digits.length >= 2 ? cardBrand(digits) : "";
  const canCopy = homeAddress && !isAddressEmpty(homeAddress);

  return (
    <>
      <div className="form-grid">
        <FormField
          className="span-2"
          label="Name on card"
          required
          autoComplete="cc-name"
          value={value.cardholderName}
          onChange={(e) => onChange({ ...value, cardholderName: e.target.value })}
          error={errors.cardholderName}
        />
        <FormField
          label={existingLast4 ? "New card number" : "Card number"}
          required={!existingLast4}
          autoComplete="cc-number"
          inputMode="numeric"
          placeholder={existingLast4 ? `Leave blank to keep •••• ${existingLast4}` : "1234 5678 9012 3456"}
          value={value.number}
          onChange={(e) => onChange({ ...value, number: formatCardNumber(e.target.value) })}
          error={errors.number}
          hint={brand && brand !== "Card" ? brand : undefined}
        />
        <FormField
          label="Expiration date"
          required
          autoComplete="cc-exp"
          inputMode="numeric"
          placeholder="MM/YY"
          value={value.expiry}
          onChange={(e) => onChange({ ...value, expiry: formatExpiry(e.target.value) })}
          error={errors.expiry}
        />
      </div>

      <div className="card-block-head">
        <p className="subhead">Billing address</p>
        {canCopy && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onChange({ ...value, billingAddress: { ...homeAddress } })}
          >
            Use my home address
          </button>
        )}
      </div>
      <AddressFields
        required
        billing
        value={value.billingAddress}
        onChange={(billingAddress) => onChange({ ...value, billingAddress })}
        errors={errors.billingAddress}
      />
    </>
  );
}
