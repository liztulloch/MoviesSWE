// Plain JavaScript helper (allowJs is on in the Vite TS template, so JS and TS can live together).
// Accepts a YouTube watch URL, youtu.be URL, embed URL, or a bare 11-character ID.
export function toEmbedUrl(input) {
  if (!input) return "";
  const match =
    input.match(/[?&]v=([\w-]{11})/) ||
    input.match(/youtu\.be\/([\w-]{11})/) ||
    input.match(/embed\/([\w-]{11})/) ||
    input.match(/^([\w-]{11})$/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : "";
}