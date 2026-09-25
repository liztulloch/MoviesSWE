import { Link } from "react-router-dom";

// Top bar with the site name. Clicking it goes back to the home page.
export default function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="brand" aria-label="Cinema E-Booking System home">
        <span className="brand-mark">CES</span>
        <span className="brand-name">Cinema E-Booking</span>
      </Link>
      <nav className="nav-links">
        <Link to="/">Movies</Link>
      </nav>
    </header>
  );
}