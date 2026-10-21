import { PASSWORD_RULES } from "../validation";

// Live checklist under a new password field. Each rule turns green once it's met.
export default function PasswordRules({ password }: { password: string }) {
  return (
    <ul className="pw-rules" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <li key={rule.label} className={ok ? "ok" : undefined}>
            <span aria-hidden="true">{ok ? "✓" : "•"}</span> {rule.label}
            <span className="sr-only">{ok ? " (done)" : " (not yet)"}</span>
          </li>
        );
      })}
    </ul>
  );
}
