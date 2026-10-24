import type { ReactNode } from "react";

export type AlertKind = "success" | "error" | "info";

export interface Notice {
  kind: AlertKind;
  text: string;
}

export default function Alert({ kind = "info", children }: { kind?: AlertKind; children: ReactNode }) {
  return (
    <div className={`alert alert-${kind}`} role={kind === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}

// Mock mode can't send email, so the code is shown on screen.
export function MockCodeNotice({ code }: { code?: string }) {
  if (!code) return null;
  return (
    <Alert kind="info">
      <strong>Demo mode:</strong> no real email is sent, so here's the code it would contain: <strong>{code}</strong>
    </Alert>
  );
}
