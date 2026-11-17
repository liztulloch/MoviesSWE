import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { addMovie } from "../api/admin";
import { ApiError, messageOf } from "../api/client";
import { getMovies } from "../api/movies";
import Alert from "../components/Alert";
import FormField, { RequiredNote } from "../components/FormField";
import SelectField from "../components/SelectField";
import { GENRES, MPAA_RATINGS, type Movie, type MovieStatus } from "../types";
import { toEmbedUrl } from "../utils";
import { hasErrors, required, urlError } from "../validation";

const EMPTY = {
  title: "",
  genres: [] as string[],
  rating: "",
  status: "",
  synopsis: "",
  posterUrl: "",
  trailerUrl: "",
  trailerImage: "",
  reviews: "",
};
type MovieForm = typeof EMPTY;
type Errors = Partial<Record<keyof MovieForm, string>>;

function validate(f: MovieForm): Errors {
  return {
    title: required(f.title, "Title") || (f.title.trim().length > 255 ? "Title must be 255 characters or fewer." : ""),
    genres: f.genres.length ? "" : "Choose at least one genre.",
    rating: f.rating ? "" : "Choose a rating.",
    status: f.status ? "" : "Choose whether the movie is showing now or coming soon.",
    synopsis: required(f.synopsis, "Synopsis"),
    posterUrl: urlError(f.posterUrl, "Poster link"),
    // The trailer player only plays YouTube videos.
    trailerUrl: urlError(f.trailerUrl, "Trailer link")
      || (toEmbedUrl(f.trailerUrl.trim()) ? "" : "Use a YouTube link, like https://www.youtube.com/watch?v=..."),
    trailerImage: f.trailerImage.trim() ? urlError(f.trailerImage, "Trailer image link") : "",
    reviews: f.reviews.trim() ? urlError(f.reviews, "Reviews link") : "",
  };
}

export default function AdminMoviesPage() {
  const [form, setForm] = useState<MovieForm>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [added, setAdded] = useState<Movie | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [listError, setListError] = useState("");

  useEffect(() => {
    getMovies().then(setMovies).catch((e) => setListError(messageOf(e)));
  }, []);

  const set = (key: keyof MovieForm) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [key]: e.target.value });

  const toggleGenre = (g: string) =>
    setForm({ ...form, genres: form.genres.includes(g) ? form.genres.filter((x) => x !== g) : [...form.genres, g] });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setAdded(null);
    const errs = validate(form);
    setErrors(errs);
    if (hasErrors(errs)) return;
    setSubmitting(true);
    try {
      const movie = await addMovie({
        ...form,
        genre: GENRES.filter((g) => form.genres.includes(g)).join(", "),
        status: form.status as MovieStatus,
      });
      setAdded(movie);
      setMovies((prev) => [...prev, movie]);
      setForm(EMPTY);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setErrors({ title: "A movie with this title already exists." });
      else setFormError(messageOf(err));
    } finally {
      setSubmitting(false);
    }
  }

  const sorted = [...movies].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="admin-page">
      <Link to="/admin" className="back">← Admin portal</Link>
      <h1>Manage Movies</h1>

      <form className="form" noValidate onSubmit={submit}>
        <fieldset className="form-section">
          <legend>Add a movie</legend>
          <RequiredNote />
          <div className="form-grid">
            <FormField className="span-2" label="Title" required maxLength={255}
              value={form.title} onChange={set("title")} error={errors.title} />

            <fieldset className="choice-group span-2">
              <legend>Genre <span className="req" aria-hidden="true">*</span></legend>
              <div className="check-grid">
                {GENRES.map((g) => (
                  <label key={g} className="check">
                    <input type="checkbox" checked={form.genres.includes(g)} onChange={() => toggleGenre(g)} />
                    <span>{g}</span>
                  </label>
                ))}
              </div>
              {errors.genres && <span className="field-error">{errors.genres}</span>}
            </fieldset>

            <SelectField label="MPAA rating" required value={form.rating} onChange={set("rating")} error={errors.rating}>
              <option value="">Choose a rating</option>
              {MPAA_RATINGS.map((r) => <option key={r}>{r}</option>)}
            </SelectField>
            <SelectField label="Status" required value={form.status} onChange={set("status")} error={errors.status}>
              <option value="">Choose a status</option>
              <option value="CURRENTLY_RUNNING">Currently running</option>
              <option value="COMING_SOON">Coming soon</option>
            </SelectField>

            <div className="field span-2">
              <label htmlFor="movie-synopsis">Synopsis<span className="req" aria-hidden="true"> *</span></label>
              <textarea id="movie-synopsis" rows={4} required value={form.synopsis} onChange={set("synopsis")}
                aria-invalid={errors.synopsis ? true : undefined} aria-describedby={errors.synopsis ? "movie-synopsis-msg" : undefined} />
              {errors.synopsis && <span id="movie-synopsis-msg" className="field-error">{errors.synopsis}</span>}
            </div>

            <FormField label="Poster image link" type="url" required placeholder="https://"
              value={form.posterUrl} onChange={set("posterUrl")} error={errors.posterUrl} />
            <FormField label="Trailer video link (YouTube)" type="url" required placeholder="https://www.youtube.com/watch?v="
              value={form.trailerUrl} onChange={set("trailerUrl")} error={errors.trailerUrl} />
            <FormField label="Trailer image link" type="url" placeholder="https://"
              value={form.trailerImage} onChange={set("trailerImage")} error={errors.trailerImage} />
            <FormField label="Reviews link" type="url" placeholder="https://"
              value={form.reviews} onChange={set("reviews")} error={errors.reviews} />
          </div>
        </fieldset>

        {formError && <Alert kind="error">{formError}</Alert>}
        {added && (
          <Alert kind="success">
            "{added.title}" was added and now shows on the home page.{" "}
            <Link to={`/movies/${added.id}`}>View it</Link>
          </Alert>
        )}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Adding movie…" : "Add movie"}
          </button>
        </div>
      </form>

      <section>
        <h2>All movies</h2>
        {listError ? (
          <p className="notice notice-error" role="alert">{listError}</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th scope="col">Title</th><th scope="col">Rating</th><th scope="col">Status</th></tr>
            </thead>
            <tbody>
              {sorted.map((m) => (
                <tr key={m.id}>
                  <td><Link to={`/movies/${m.id}`}>{m.title}</Link></td>
                  <td>{m.rating || "Not rated"}</td>
                  <td>{m.status === "COMING_SOON" ? "Coming soon" : "Currently running"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
