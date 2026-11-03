import { useEffect, useRef, useState } from 'react'

// A number that counts up from 0 the first time it is on screen (reference section 10).
// Shows the final number straight away for people who asked for less motion, or when there is no IntersectionObserver.
//   to       the number to reach
//   suffix   text after it, e.g. "+"
export default function CountUp({ to, suffix = '', duration = 1600 }) {
  const ref = useRef(null)
  const [value, setValue] = useState(to)

  useEffect(() => {
    const el = ref.current
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!el || reduce || typeof IntersectionObserver === 'undefined') return undefined

    let raf = 0
    setValue(0)
    const watcher = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        watcher.disconnect()
        const t0 = performance.now()
        const step = (now) => {
          const p = Math.min((now - t0) / duration, 1)
          setValue(Math.round(to * (1 - (1 - p) ** 3))) // ease-out cubic
          if (p < 1) raf = requestAnimationFrame(step)
        }
        raf = requestAnimationFrame(step)
      },
      { threshold: 0.6 },
    )
    watcher.observe(el)
    return () => {
      watcher.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [to, duration])

  return (
    <span ref={ref}>
      {value.toLocaleString('en-US')}
      {suffix}
    </span>
  )
}
