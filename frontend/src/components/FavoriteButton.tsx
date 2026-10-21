import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import type { Movie } from "../types";

interface Props {
  movie: Pick<Movie, "id" | "title">;
  className?: string;
}

// Heart button that adds a movie to, or removes it from, the customer's favorites.
// The tooltip comes from data-tip (see .fav-btn::after in styles.css).
// Logged-out visitors are sent to log in first. Admins don't have favorites, so they don't see it.
export default function FavoriteButton({ movie, className }: Props) {
  const { user } = useAuth();
  const { isFavorite, toggle } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();

  if (user?.role === "admin") return null;

  const on = isFavorite(movie.id);
  const tip = !user ? "Log in to save favorites" : on ? "Remove from favorites" : "Add to favorites";

  const click = () => {
    if (!user) {
      navigate("/login", { state: { from: location, message: "Log in to save movies to your favorites." } });
      return;
    }
    toggle(movie.id, movie.title);
  };

  return (
    <button
      type="button"
      className={`fav-btn${on ? " fav-on" : ""}${className ? ` ${className}` : ""}`}
      onClick={click}
      aria-pressed={user ? on : undefined}
      aria-label={`${tip}: ${movie.title}`}
      data-tip={tip}
    >
      <span aria-hidden="true">{on ? "♥" : "♡"}</span>
    </button>
  );
}
