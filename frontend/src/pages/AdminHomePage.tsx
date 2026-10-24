import { Link } from "react-router-dom";
import { ADMIN_MENU } from "../adminMenu";
import { useAuth } from "../context/AuthContext";

export default function AdminHomePage() {
  const { user } = useAuth();
  return (
    <>
      <section className="hero">
        <h1>Admin portal</h1>
        <p>Welcome, {user?.firstName}. What would you like to manage today?</p>
      </section>
      <nav aria-label="Admin menu">
        <ul className="admin-grid">
          {ADMIN_MENU.map((item) => (
            <li key={item.path}>
              <Link className="admin-tile" to={`/admin/${item.path}`}>
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
