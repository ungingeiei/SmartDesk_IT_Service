/**
 * Marks the first case-insensitive occurrence of `query` inside `text`, matching
 * the design's single-hit highlight behaviour on knowledge-base search results.
 */
export default function Highlight({ text, query }) {
  const q = (query || '').trim();
  if (!q) return text;

  const index = text.toLowerCase().indexOf(q.toLowerCase());
  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + q.length)}</mark>
      {text.slice(index + q.length)}
    </>
  );
}
