import { useEffect, useRef } from 'react'
import useTheme from '../../lib/theme'

// The INKWELL background (reference sections 1 and 10): aurora glow, floating page / glyph particles that
// the cursor pushes away, a spotlight that follows the cursor, a vignette, film grain, and the side rail
// that shows how far down the page you are. CSS for all of it is in styles/inkwell.css (.ink-fx, .side-rail).
// Only drawn in the Night theme. In the light theme this renders nothing and no loop runs.

const GLYPHS = ['✦', '✧', '❝', '❞', '⁂', '§', '¶', '❦', '※', '✶', '⌘', '◈']
const rand = (a, b) => a + Math.random() * (b - a)
const pick = (list) => list[(Math.random() * list.length) | 0]

function roundRectPath(c, x, y, w, h, r) {
  c.beginPath()
  if (c.roundRect) {
    c.roundRect(x, y, w, h, r)
    return
  }
  c.moveTo(x + r, y)
  c.arcTo(x + w, y, x + w, y + h, r)
  c.arcTo(x + w, y + h, x, y + h, r)
  c.arcTo(x, y + h, x, y, r)
  c.arcTo(x, y, x + w, y, r)
  c.closePath()
}

function Layers() {
  const canvasRef = useRef(null)
  const spotRef = useRef(null)
  const fillRef = useRef(null)
  const pctRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const spot = spotRef.current
    const fill = fillRef.current
    const pct = pctRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !spot || !ctx) return undefined

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const mouse = { x: -9999, y: -9999, active: false }
    let targetX = window.innerWidth / 2
    let targetY = window.innerHeight / 2
    let spotX = targetX
    let spotY = targetY
    let W = 0
    let H = 0
    let parts = []
    let frame = 0
    let resizeTimer = 0
    let scrollQueued = false
    let lastDraw = 0

    // ---- pointer ----------------------------------------------------------
    const onMove = (e) => {
      if (e.pointerType === 'touch') return
      targetX = e.clientX
      targetY = e.clientY
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.active = true
    }
    const onLeave = () => {
      mouse.active = false
      mouse.x = mouse.y = -9999
    }

    // ---- particles --------------------------------------------------------
    function makeParticle() {
      const isGlyph = Math.random() < 0.42
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: rand(-0.22, 0.22),
        vy: rand(-0.3, 0.14),
        rot: Math.random() * Math.PI * 2,
        vr: rand(-0.01, 0.01),
        size: isGlyph ? rand(11, 26) : rand(7, 20),
        glyph: pick(GLYPHS),
        isGlyph,
        alpha: isGlyph ? rand(0.14, 0.46) : rand(0.05, 0.17),
        hue: Math.random() < 0.55 ? 34 : 265,
        wob: Math.random() * Math.PI * 2,
        wobSpeed: rand(0.0016, 0.0055),
      }
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = canvas.clientWidth
      H = canvas.clientHeight
      canvas.width = Math.floor(W * dpr)
      canvas.height = Math.floor(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const cap = W < 760 ? 70 : 150 // fewer on phones
      const count = Math.min(cap, Math.max(40, Math.floor((W * H) / 13500)))
      parts = Array.from({ length: count }, makeParticle)
    }

    // k = how many 60 fps frames passed since the last draw, so motion keeps its speed when we draw less often
    function draw(k) {
      ctx.clearRect(0, 0, W, H)
      for (const p of parts) {
        p.wob += p.wobSpeed * k
        p.x += (p.vx + Math.sin(p.wob) * 0.24) * k
        p.y += (p.vy + Math.cos(p.wob * 0.7) * 0.14) * k
        p.rot += p.vr * k

        // the cursor pushes particles away
        if (mouse.active) {
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const d2 = dx * dx + dy * dy
          const R = 175
          if (d2 < R * R && d2 > 1) {
            const d = Math.sqrt(d2)
            const f = (1 - d / R) ** 2 * 20
            p.x += (dx / d) * f * k
            p.y += (dy / d) * f * k
          }
        }

        // wrap around the edges
        if (p.x < -70) p.x = W + 70
        if (p.x > W + 70) p.x = -70
        if (p.y < -70) p.y = H + 70
        if (p.y > H + 70) p.y = -70

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        if (p.isGlyph) {
          ctx.font = `${p.size}px 'Fraunces', Georgia, serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = `hsla(${p.hue}, 82%, 82%, ${p.alpha})`
          ctx.fillText(p.glyph, 0, 0)
        } else {
          // a tiny book: a page with a spine line
          const w = p.size * 0.62
          const h = p.size
          ctx.fillStyle = `hsla(${p.hue}, 62%, 90%, ${p.alpha})`
          roundRectPath(ctx, -w / 2, -h / 2, w, h, 1.6)
          ctx.fill()
          ctx.strokeStyle = `hsla(${p.hue}, 70%, 66%, ${p.alpha * 1.9})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(-w / 2 + 2.2, -h / 2)
          ctx.lineTo(-w / 2 + 2.2, h / 2)
          ctx.stroke()
        }
        ctx.restore()
      }

      // constellation lines from the cursor to nearby particles
      if (mouse.active) {
        const R = 185
        for (const p of parts) {
          const d = Math.hypot(p.x - mouse.x, p.y - mouse.y)
          if (d < R) {
            ctx.strokeStyle = `rgba(245,185,113,${(1 - d / R) * 0.32})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(mouse.x, mouse.y)
            ctx.stroke()
          }
        }
      }
    }

    // ---- scroll progress (the side rail) -----------------------------------
    function updateScroll() {
      scrollQueued = false
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      if (fill) fill.style.height = `${(p * 100).toFixed(2)}%`
      if (pct) pct.textContent = String(Math.round(p * 100)).padStart(2, '0')
    }
    const onScroll = () => {
      if (scrollQueued) return
      scrollQueued = true
      requestAnimationFrame(updateScroll)
    }

    // ---- master loop (paused while the tab is hidden) ------------------------
    // the spotlight follows the pointer every frame (cheap); the ~100 particles are drawn every other frame (about 30 fps)
    function loop(now) {
      spotX += (targetX - spotX) * 0.12
      spotY += (targetY - spotY) * 0.12
      spot.style.transform = `translate3d(${spotX}px, ${spotY}px, 0)`
      if (!reduceMotion && now - lastDraw >= 30) {
        draw(Math.min(3, (now - lastDraw) / 16.67))
        lastDraw = now
      }
      frame = requestAnimationFrame(loop)
    }
    const onVisibility = () => {
      cancelAnimationFrame(frame)
      if (!document.hidden && !reduceMotion) {
        lastDraw = performance.now()
        frame = requestAnimationFrame(loop)
      }
    }
    const onResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        resize()
        updateScroll()
      }, 180)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)

    // the page grows and shrinks when a shelf loads or the route changes: keep the rail honest
    const sizeWatcher = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onScroll)
    sizeWatcher?.observe(document.documentElement)

    resize()
    updateScroll()
    if (reduceMotion) {
      spot.style.transform = `translate3d(${spotX}px, ${spotY}px, 0)` // no particles, no chasing: the glow just sits there
    } else {
      lastDraw = performance.now()
      frame = requestAnimationFrame(loop)
    }

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(resizeTimer)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      sizeWatcher?.disconnect()
    }
  }, [])

  return (
    <>
      <div className="ink-fx" aria-hidden="true">
        <div className="ink-aurora">
          <span className="ink-a1" />
          <span className="ink-a2" />
          <span className="ink-a3" />
          <span className="ink-a4" />
        </div>
        <canvas ref={canvasRef} className="ink-canvas" />
        <div ref={spotRef} className="ink-spotlight" />
        <div className="ink-vignette" />
        <div className="ink-grain" />
      </div>
      <aside className="side-rail" aria-hidden="true">
        <span className="side-rail__label">Scroll</span>
        <div className="side-rail__track">
          <div ref={fillRef} className="side-rail__fill" />
        </div>
        <span ref={pctRef} className="side-rail__pct">00</span>
      </aside>
    </>
  )
}

export default function InkwellBackground() {
  const dark = useTheme() === 'dark'
  return dark ? <Layers /> : null
}
