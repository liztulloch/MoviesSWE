import { toEmbedUrl } from "../utils";

// Plays the movie's YouTube trailer inside the page.
export default function TrailerPlayer({ url, title }: { url: string; title: string }) {
  // YouTube only allows its "embed" link inside other sites, so the normal link is converted first.
  const src = toEmbedUrl(url);
  if (!src) return <p className="notice">No trailer is available for this movie yet.</p>;
  return (
    <div className="trailer">
      <iframe
        src={src}
        title={`${title} trailer`}
        allow="accelerometer; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}