import type { Movie } from "../types";

// Placeholder trailer ID
const T = "M7lc1UVf-VE";

// Sample movies, only used in mock mode (when VITE_USE_MOCK is not "false").
// The real site gets its movies from the database.
const baseMovies: Movie[] = [
  { id: 1, title: "Midnight Circuit", genre: "Action", rating: "PG-13", status: "CURRENTLY_RUNNING", posterUrl: "", trailerUrl: T, description: "A retired courier is pulled back into the city's underground race scene when her brother goes missing." },
  { id: 2, title: "The Lantern Keeper", genre: "Animation", rating: "PG", status: "CURRENTLY_RUNNING", posterUrl: "", trailerUrl: T, description: "A young apprentice must relight the village lanterns before the longest night of the year." },
  { id: 3, title: "Second Helpings", genre: "Comedy", rating: "PG-13", status: "CURRENTLY_RUNNING", posterUrl: "", trailerUrl: T, description: "Two rival food truck owners are forced to share one parking spot for a summer." },
  { id: 4, title: "Harbor Lights", genre: "Drama", rating: "R", status: "CURRENTLY_RUNNING", posterUrl: "", trailerUrl: T, description: "Three generations of a fishing family disagree about whether to sell the boat that built their town." },
  { id: 5, title: "Static Bloom", genre: "Horror", rating: "R", status: "CURRENTLY_RUNNING", posterUrl: "", trailerUrl: T, description: "A radio host begins receiving calls from a listener who describes tomorrow's news." },
  { id: 6, title: "Orbit Nine", genre: "Sci-Fi", rating: "PG-13", status: "COMING_SOON", posterUrl: "", trailerUrl: T, description: "The crew of a failing space station has nine hours to decide who takes the last escape pod." },
  { id: 7, title: "Paper Hearts", genre: "Romance", rating: "PG", status: "COMING_SOON", posterUrl: "", trailerUrl: T, description: "Two strangers keep swapping the same library book, leaving notes in the margins." },
  { id: 8, title: "Cold Case Café", genre: "Thriller", rating: "PG-13", status: "COMING_SOON", posterUrl: "", trailerUrl: T, description: "A barista realizes a regular customer matches a suspect from a 20-year-old case." },
  { id: 9, title: "Iron Meridian", genre: "Action", rating: "R", status: "COMING_SOON", posterUrl: "", trailerUrl: T, description: "A rail security chief has one night to stop a heist on the country's fastest train." },
  { id: 10, title: "Moonwake", genre: "Sci-Fi", rating: "PG", status: "COMING_SOON", posterUrl: "", trailerUrl: T, description: "A family on a lunar colony discovers their new home has been waiting for them." },
];

// Only currently-running movies carry reviews in the seed data, so the mocks match.
const R = "https://www.rottentomatoes.com/";

const extras: Record<number, Pick<Movie, "cast" | "director" | "producers" | "reviews">> = {
  1: { director: "Renata Cole", producers: ["Marcus Bell"], cast: ["Dana Whitlock", "Theo Marsh", "Priya Anand"], reviews: `${R}m/midnight_circuit` },
  2: { director: "Elias Ward", producers: ["Naomi Fischer"], cast: ["Lucy Park", "Omar Haddad", "June Alvarez"], reviews: `${R}m/the_lantern_keeper` },
  3: { director: "Gina Okafor", producers: ["Sam Rivera"], cast: ["Ben Toller", "Mia Chen", "Carlos Duarte"], reviews: `${R}m/second_helpings` },
  4: { director: "Anders Holm", producers: ["Ruth Kessler"], cast: ["Ingrid Moss", "Paul Grayson", "Leah Stone"], reviews: `${R}m/harbor_lights` },
  5: { director: "Vera Lindqvist", producers: ["Jonah Pike"], cast: ["Kai Morrow", "Tessa Bright", "Dev Malhotra"], reviews: `${R}m/static_bloom` },
  6: { director: "Hiro Tanaka", producers: ["Alma Reyes"], cast: ["Nadia Volkov", "Eli Frost", "Grace Adeyemi"] },
  7: { director: "Claire Dubois", producers: ["Ravi Menon"], cast: ["Sophie Lang", "Marco Bellini", "Ada Whitfield"] },
  8: { director: "Damon Reyes", producers: ["Ellie Zhang"], cast: ["Nora Blake", "Jack Ostrow", "Tamika Hayes"] },
  9: { director: "Petra Novak", producers: ["Louis Abara"], cast: ["Rex Callahan", "Mina Sato", "Ollie Grant"] },
  10: { director: "Yara Haddad", producers: ["Felix Warner"], cast: ["Amara Cole", "Leo Baptiste", "Ines Duarte"] },
};

export const mockMovies: Movie[] = baseMovies.map((m) => ({ ...m, ...extras[m.id] }));