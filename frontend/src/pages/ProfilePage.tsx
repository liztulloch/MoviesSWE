import { useEffect, useState } from "react";
import { getProfile } from "../api/profile";
import { messageOf } from "../api/client";
import ChangePasswordForm from "../components/profile/ChangePasswordForm";
import FavoritesList from "../components/profile/FavoritesList";
import PaymentCards from "../components/profile/PaymentCards";
import PersonalInfoForm from "../components/profile/PersonalInfoForm";
import type { Profile } from "../types";

// Loaded once; each section then saves on its own.
export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((p) => { if (!cancelled) setProfile(p); })
      .catch((e) => { if (!cancelled) setError(messageOf(e)); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <p className="notice notice-error" role="alert">{error}</p>;
  if (!profile) return <p className="notice">Loading your profile…</p>;

  return (
    <div className="profile">
      <h1>My profile</h1>
      <p className="lead">Hi {profile.firstName}! Update your details, payment cards and password here.</p>

      <nav className="profile-nav" aria-label="Profile sections">
        <a className="chip chip-sm" href="#personal">Personal info</a>
        <a className="chip chip-sm" href="#cards">Payment cards</a>
        <a className="chip chip-sm" href="#password">Password</a>
        <a className="chip chip-sm" href="#favorites">Favorite movies</a>
      </nav>

      <section id="personal" className="form-section profile-section" aria-labelledby="personal-h">
        <h2 id="personal-h">Personal information</h2>
        <PersonalInfoForm profile={profile} onSaved={setProfile} />
      </section>

      <section id="cards" className="form-section profile-section" aria-labelledby="cards-h">
        <h2 id="cards-h">Payment cards</h2>
        <PaymentCards
          cards={profile.cards}
          homeAddress={profile.address}
          onChange={(cards) => setProfile({ ...profile, cards })}
        />
      </section>

      <section id="password" className="form-section profile-section" aria-labelledby="password-h">
        <h2 id="password-h">Change password</h2>
        <ChangePasswordForm />
      </section>

      <section id="favorites" className="profile-section" aria-labelledby="favorites-h">
        <h2 id="favorites-h">Favorite movies</h2>
        <FavoritesList />
      </section>
    </div>
  );
}
