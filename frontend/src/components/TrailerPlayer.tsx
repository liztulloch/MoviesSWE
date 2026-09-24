import { toEmbedUrl } from "../utils";

export default function TrailerPlayer({ url, title }: { url: string; title: string }) {
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