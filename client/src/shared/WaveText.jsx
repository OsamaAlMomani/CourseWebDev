// Text whose letters rise one after another in a slow wave (and flash the accent colour at the top of the wave).
// Only `transform` and `color` change, on a handful of letters, so it stays cheap.
// Words are kept together (inline-block) so the heading still wraps normally on small screens.
// Screen readers get the plain text; the animated copy is hidden from them.
// CSS: .fx-wave in styles/inkwell.css. Usage: <h2><WaveText text="Find your shelf" /></h2>
export default function WaveText({ text, className = '' }) {
  let n = 0
  const words = String(text).split(' ')
  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className={`fx-wave ${className}`}>
        {words.map((word, w) => (
          <span key={w}>
            <span className="fx-wave__word">
              {Array.from(word).map((ch, i) => (
                <span key={i} className="fx-wave__char" style={{ '--i': n++ }}>{ch}</span>
              ))}
            </span>
            {w < words.length - 1 ? ' ' : null}
          </span>
        ))}
      </span>
    </>
  )
}
