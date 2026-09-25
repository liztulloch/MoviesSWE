// Plain JavaScript helper. utils.d.ts next to it tells TypeScript what this function takes and returns.
// Turns any YouTube link into the embed link the trailer player needs. Returns "" if it isn't a YouTube link.
export function toEmbedUrl(input) {
  if (!input) return "";
  const match =
    input.match(/[?&]v=([\w-]{11})/) ||
    input.match(/youtu\.be\/([\w-]{11})/) ||
    input.match(/embed\/([\w-]{11})/) ||
    input.match(/^([\w-]{11})$/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : "";
}