import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import MovieDetailsPage from "./pages/MovieDetailsPage";
import BookingPage from "./pages/BookingPage";

// Sets up the pages and which URL shows each one. The Navbar shows on every page.
export default function App() {
  return (
    <>
      <Navbar />
      <main className="page">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/movies/:id" element={<MovieDetailsPage />} />
          <Route path="/booking/:id" element={<BookingPage />} />
          <Route
            path="*"
            element={<p className="notice">That page doesn't exist. <a href="/">Back to movies</a></p>}
          />
        </Routes>
      </main>
    </>
  );
}