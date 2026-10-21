import type { ReactNode } from "react";

export type AlertKind = "success" | "error" | "info";

// A message a form can hold in state and show with <Alert>.
export interface Notice {
  kind: AlertKind;
  text: string;
}

// A colored message box. Errors use role="alert" so screen readers announce them right away.
export default function Alert({ kind = "info", children }: { kind?: AlertKind; children: ReactNode }) {
  return (
    <div className={`alert alert-${kind}`} role={kind === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}

// Mock mode can't send email, so it shows the code that the email would have contained.
export function MockCodeNotice({ code }: { code?: string }) {
  if (!code) return null;
  return (
    <Alert kind="info">
      <strong>Demo mode:</strong> no real email is sent, so here's the code it would contain: <strong>{code}</strong>
    </Alert>
  );
}
