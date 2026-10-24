import type { ChangeEvent } from "react";
import FormField from "./FormField";
import type { AddressErrors } from "../validation";
import type { Address } from "../types";

interface Props {
  value: Address;
  onChange: (address: Address) => void;
  errors?: AddressErrors;
  required?: boolean;
  billing?: boolean; // tells the browser's autofill this is a billing address
}

export default function AddressFields({ value, onChange, errors = {}, required, billing }: Props) {
  const set = (key: keyof Address) => (e: ChangeEvent<HTMLInputElement>) => onChange({ ...value, [key]: e.target.value });
  const auto = (name: string) => (billing ? `billing ${name}` : name);

  return (
    <div className="form-grid">
      <FormField
        className="span-2"
        label="Street address"
        required={required}
        autoComplete={auto("street-address")}
        value={value.street}
        onChange={set("street")}
        error={errors.street}
      />
      <FormField
        label="City"
        required={required}
        autoComplete={auto("address-level2")}
        value={value.city}
        onChange={set("city")}
        error={errors.city}
      />
      <div className="form-grid form-grid-tight">
        <FormField
          label="State"
          required={required}
          autoComplete={auto("address-level1")}
          placeholder="GA"
          maxLength={2}
          value={value.state}
          onChange={set("state")}
          error={errors.state}
        />
        <FormField
          label="ZIP code"
          required={required}
          autoComplete={auto("postal-code")}
          inputMode="numeric"
          maxLength={10}
          value={value.zip}
          onChange={set("zip")}
          error={errors.zip}
        />
      </div>
    </div>
  );
}
