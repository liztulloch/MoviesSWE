import { GENRES } from "../types";

interface Props {
  title: string;
  genre: string;
  onTitleChange: (v: string) => void;
  onGenreChange: (v: string) => void;
  onClear: () => void;
}

// Search box, genre dropdown, and show date picker on the home page.
// HomePage keeps the values and does the actual searching.
export default function Filters({ title, genre, onTitleChange, onGenreChange, onClear }: Props) {
  const active = title !== "" || genre !== "";
  return (
    <div className="filters" role="search">
      <label className="field field-grow">
        <span>Search by title</span>
        <input
          type="search"
          value={title}
          placeholder="Try “Orbit”"
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </label>

      <label className="field">
        <span>Genre</span>
        <select value={genre} onChange={(e) => onGenreChange(e.target.value)}>
          <option value="">All genres</option>
          {GENRES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </label>

      {/* Visible but not functional */}
      <label className="field">
        <span>Show date</span>
        <input type="date" disabled title="Show date filtering is coming in a later sprint" />
      </label>

      {active && (
        <button type="button" className="btn btn-ghost" onClick={onClear}>
          Clear filters
        </button>
      )}
    </div>
  );
}