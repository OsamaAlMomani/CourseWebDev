// INKWELL behaviour that has no React component: reveal on scroll, card tilt + glow, magnetic buttons, hero tilt.
// Started ONCE from main.jsx. It listens on the whole document (event delegation), so any element that
// carries the right class gets the effect, now or after a page change, without its JSX knowing about it.
//
//   .reveal / .ink-reveal   gets .in when it scrolls into view (styles/inkwell.css fades it up)
//   .card-lift              tilts toward the pointer and a glow follows it  (sets --rx --ry --mx --my)
//   .skin-btn               leans toward the pointer (magnetic)
//   .ink-hero               its .ink-tilt child (the cover fan) turns slightly with the pointer (sets --rx --ry)
//
// The pointer effects only run on devices with a real mouse, in the Night theme, and when the visitor did not ask for less motion.
// The reveal always runs (it is harmless in the light theme: only the dark CSS hides elements before .in).

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const hasMouse = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches
const isDark = () => document.documentElement.dataset.theme !== 'light'

const REVEAL = '.reveal, .ink-reveal'

function startReveal() {
  const show = (el) => el.classList.add('in')

  // no observer, or less motion wanted: everything is simply shown, now and when new pages arrive
  if (typeof IntersectionObserver === 'undefined' || reduced()) {
    const all = (root) => {
      if (root.matches?.(REVEAL)) show(root)
      root.querySelectorAll?.(REVEAL).forEach(show)
    }
    all(document)
    new MutationObserver((list) => list.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && all(n)))).observe(document.body, { childList: true, subtree: true })
    return
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        // very tall blocks never reach 14% of their own height, so a fixed share of the screen counts too
        const enough = entry.intersectionRatio >= 0.14 || entry.intersectionRect.height >= window.innerHeight * 0.2
        if (entry.isIntersecting && enough) {
          show(entry.target)
          io.unobserve(entry.target)
        }
      }
    },
    { threshold: [0, 0.14], rootMargin: '0px 0px -8% 0px' },
  )

  const seen = new WeakSet()
  const watch = (el) => {
    if (seen.has(el)) return
    seen.add(el)
    io.observe(el)
  }
  const scan = (root) => {
    if (root.matches?.(REVEAL)) watch(root)
    root.querySelectorAll?.(REVEAL).forEach(watch)
  }

  scan(document)
  new MutationObserver((list) => list.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && scan(n)))).observe(document.body, { childList: true, subtree: true })
}

function startPointerFx() {
  let card = null
  let button = null
  let hero = null

  const resetCard = () => {
    if (!card) return
    card.style.setProperty('--rx', '0deg')
    card.style.setProperty('--ry', '0deg')
    card = null
  }
  const resetButton = () => {
    if (!button) return
    button.style.transform = ''
    button = null
  }
  const resetHero = () => {
    const tilt = hero?.querySelector('.ink-tilt')
    if (tilt) {
      tilt.style.setProperty('--rx', '0deg')
      tilt.style.setProperty('--ry', '0deg')
    }
    hero = null
  }
  const resetAll = () => {
    resetCard()
    resetButton()
    resetHero()
  }

  document.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse' || !hasMouse() || reduced() || !isDark()) return
      const target = e.target instanceof Element ? e.target : null

      // card tilt + glow (reference section 6). Wide cards tilt less, so a big banner does not swing.
      const c = target?.closest('.card-lift') ?? null
      if (c !== card) resetCard()
      if (c) {
        card = c
        const r = c.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width - 0.5
        const py = (e.clientY - r.top) / r.height - 0.5
        const k = Math.min(1, 300 / Math.max(r.width, r.height))
        c.style.setProperty('--rx', `${-py * 9 * k}deg`)
        c.style.setProperty('--ry', `${px * 12 * k}deg`)
        c.style.setProperty('--mx', `${(px + 0.5) * 100}%`)
        c.style.setProperty('--my', `${(py + 0.5) * 100}%`)
      }

      // magnetic buttons (reference section 7)
      const b = target?.closest('.skin-btn') ?? null
      const live = b && !b.disabled && b.getAttribute('aria-disabled') !== 'true' ? b : null
      if (live !== button) resetButton()
      if (live) {
        button = live
        const r = live.getBoundingClientRect()
        const x = e.clientX - r.left - r.width / 2
        const y = e.clientY - r.top - r.height / 2
        live.style.transform = `translate(${x * 0.16}px, ${y * 0.24}px)`
      }

      // hero cover fan (reference section 5: the 3D book follows the pointer)
      const h = target?.closest('.ink-hero') ?? null
      if (h !== hero) resetHero()
      if (h) {
        hero = h
        const tilt = h.querySelector('.ink-tilt')
        if (tilt) {
          const r = h.getBoundingClientRect()
          const px = (e.clientX - r.left) / r.width - 0.5
          const py = (e.clientY - r.top) / r.height - 0.5
          tilt.style.setProperty('--ry', `${px * 14}deg`)
          tilt.style.setProperty('--rx', `${-py * 10}deg`)
        }
      }
    },
    { passive: true },
  )

  document.documentElement.addEventListener('pointerleave', resetAll)
  window.addEventListener('blur', resetAll)
}

export function initInkwellFx() {
  if (window.__inkwellFx) return // StrictMode / hot reload: start once
  window.__inkwellFx = true
  startReveal()
  startPointerFx()
}
