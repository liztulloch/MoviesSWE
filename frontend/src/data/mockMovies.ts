import type { Movie } from "../types";

// Placeholder trailer ID (YouTube's own demo video). Replace with real trailer IDs in the DB seed.
const T = "M7lc1UVf-VE";

// Mock data with the same shape as the API. Used until the backend is ready.
export const mockMovies: Movie[] = [
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
