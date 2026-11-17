import { useEffect, useState } from "react";
import { checkout, getSavedDraft } from "./api/booking";
import { messageOf } from "./api/client";
import type { CheckoutSummary } from "./types";

// Used by the checkout and payment pages. Checkout is safe to repeat, so a page refresh just reloads the same order.
export function useCheckout() {
  const [draft] = useState(getSavedDraft);
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!draft) return;
    let cancelled = false;
    checkout(draft)
      .then((s) => { if (!cancelled) setSummary(s); })
      .catch((e) => { if (!cancelled) setError(messageOf(e)); });
    return () => { cancelled = true; };
  }, [draft]);

  return { draft, summary, error };
}
