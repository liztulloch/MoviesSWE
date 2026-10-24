import { Link, NavLink, useNavigate } from "react-router-dom";
import { LOGGED_OUT_MESSAGE, useAuth } from "../context/AuthContext";

// Top bar with the site name. Clicking it goes back to the home page.
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true, state: { message: LOGGED_OUT_MESSAGE } });
  }

  return (
    <header className="navbar">
      <Link to="/" className="brand" aria-label="Cinema E-Booking System home">
        <span className="brand-mark">CES</span>
        <span className="brand-name">Cinema E-Booking</span>
      </Link>
      <nav className="nav-links" aria-label="Main">
        <NavLink to="/" end>Movies</NavLink>
        {!user && (
          <>
            <NavLink to="/login">Log in</NavLink>
            <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
          </>
        )}
        {user?.role === "customer" && <NavLink to="/profile">My profile</NavLink>}
        {user?.role === "admin" && <NavLink to="/admin">Admin portal</NavLink>}
        {user && (
          <>
            {user.firstName && <span className="nav-user">Hi, {user.firstName}</span>}
            <button type="button" className="btn btn-sm" onClick={handleLogout}>Log out</button>
          </>
        )}
      </nav>
    </header>
  );
}
