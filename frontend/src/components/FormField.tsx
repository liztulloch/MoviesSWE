import { useId, type InputHTMLAttributes, type ReactNode } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
}

export default function FormField({ label, error, hint, required, id, className, ...input }: Props) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const messageId = `${inputId}-msg`;
  const message = error || hint;

  return (
    <div className={`field${className ? ` ${className}` : ""}`}>
      <label htmlFor={inputId}>
        {label}
        {required && <span className="req" aria-hidden="true"> *</span>}
      </label>
      <input
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        {...input}
      />
      {message && (
        <span id={messageId} className={error ? "field-error" : "field-hint"}>
          {message}
        </span>
      )}
    </div>
  );
}

export function RequiredNote() {
  return (
    <p className="form-note">
      Fields marked <span className="req">*</span> are required.
    </p>
  );
}
