import type { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";

// This only controls what the screen shows; the backend has to refuse these requests too.
export default function RequireAuth({ role, children }: { role?: Role; children: ReactNode }) {
  const { user, logoutNotice } = useAuth();
  const location = useLocation();

  // Right after a logout, show why on the login page instead of coming back here after the next login.
  if (!user && logoutNotice) return <Navigate to="/login" replace state={{ message: logoutNotice }} />;
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
