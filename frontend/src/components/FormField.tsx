import { useId, type InputHTMLAttributes, type ReactNode } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
}

// One labeled input. Required fields get a red *, and the error (or hint) shows under the input.
// aria-describedby links the message to the input so screen readers read it too.
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

// Goes at the top of every form.
export function RequiredNote() {
  return (
    <p className="form-note">
      Fields marked <span className="req">*</span> are required.
    </p>
  );
}
