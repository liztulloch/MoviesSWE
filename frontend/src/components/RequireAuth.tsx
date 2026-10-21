import type { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { LOGGED_OUT, useAuth } from "../context/AuthContext";
import type { Role } from "../types";

// Wraps pages that need a login. Logged-out visitors go to the login page and come back here after.
// With a role, users with a different role see a "no access" message instead of the page.
// This only controls what the screen shows. The backend must also refuse these requests.
export default function RequireAuth({ role, children }: { role?: Role; children: ReactNode }) {
  const { user, justLoggedOut } = useAuth();
  const location = useLocation();

  // Right after logging out, go where the navbar sends people, not back here after the next login.
  if (!user && justLoggedOut) return <Navigate to={LOGGED_OUT.to} replace state={LOGGED_OUT.state} />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  if (role && user.role !== role) {
    return (
      <div className="empty">
        <h2>You don't have access to this page</h2>
        <p>{role === "admin" ? "This area is only for administrators." : "This page is only for customer accounts."}</p>
        <Link className="btn" to={user.role === "admin" ? "/admin" : "/"}>
          {user.role === "admin" ? "Go to the admin portal" : "Back to movies"}
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
