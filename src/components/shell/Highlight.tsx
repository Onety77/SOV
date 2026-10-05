/** Text with the matched part of a query emphasised. */
export function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim().replace(/^\$/, '')
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-transparent text-accent-text">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  )
}
