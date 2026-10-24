import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import type { Movie } from "../types";

interface Props {
  movie: Pick<Movie, "id" | "title">;
  className?: string;
}

// The tooltip is drawn from data-tip by .fav-btn::after in styles.css.
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
