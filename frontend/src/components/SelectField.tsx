import { useId, type ReactNode, type SelectHTMLAttributes } from "react";

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
}

// FormField's twin for dropdowns.
export default function SelectField({ label, error, hint, required, id, className, children, ...select }: Props) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const messageId = `${selectId}-msg`;
  const message = error || hint;

  return (
    <div className={`field${className ? ` ${className}` : ""}`}>
      <label htmlFor={selectId}>
        {label}
        {required && <span className="req" aria-hidden="true"> *</span>}
      </label>
      <select
        id={selectId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        {...select}
      >
        {children}
      </select>
      {message && (
        <span id={messageId} className={error ? "field-error" : "field-hint"}>
          {message}
        </span>
      )}
    </div>
  );
}
