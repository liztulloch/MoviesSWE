import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import RequireAuth from "./components/RequireAuth";
import HomePage from "./pages/HomePage";
import MovieDetailsPage from "./pages/MovieDetailsPage";
import BookingPage from "./pages/BookingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import AdminHomePage from "./pages/AdminHomePage";
import AdminSectionPage from "./pages/AdminSectionPage";

// Sets up the pages and which URL shows each one. The Navbar shows on every page.
// Pages wrapped in RequireAuth need a login, and the role says who may see them.
export default function App() {
  return (
    <>
      <Navbar />
      <main className="page">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/movies/:id" element={<MovieDetailsPage />} />
          <Route path="/booking/:id" element={<BookingPage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route path="/profile" element={<RequireAuth role="customer"><ProfilePage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth role="admin"><AdminHomePage /></RequireAuth>} />
          <Route path="/admin/:section" element={<RequireAuth role="admin"><AdminSectionPage /></RequireAuth>} />

          <Route
            path="*"
            element={<p className="notice">That page doesn't exist. <a href="/">Back to movies</a></p>}
          />
        </Routes>
      </main>
    </>
  );
}
