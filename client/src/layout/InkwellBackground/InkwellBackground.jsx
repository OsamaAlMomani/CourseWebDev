import { useEffect, useRef } from 'react'
import useTheme from '../../lib/theme'
import { getTier, onTier, sample } from '../../lib/quality'

// The INKWELL background: aurora glow, floating page / glyph particles that the cursor pushes away, a spotlight that
// follows the cursor, a vignette, film grain, and the side rail that shows how far down the page you are.
// CSS for all of it is in styles/inkwell.css (.ink-fx, .side-rail), styles/theme-glass.css (light colours) and
// styles/perf.css (the single-layer aurora and the quality levels).
// Drawn in both themes: Night is the amber / rose / violet aurora on ink-black, Light is the same scene in daylight
// colours with one extra layer, .ink-sheen, the slow reflection that crosses the page.
//
// HOW THE PARTICLES STAY CHEAP (lib/quality.js decides how many and how often):
//   * every glyph and tiny book is drawn ONCE into a small sprite (the "atlas"); each frame only stamps sprites with
//     drawImage + a rotation matrix. Text drawing (fillText) was the slowest call of the old version.
//   * positions live in flat typed arrays (no object per particle, nothing for the garbage collector to chase)
//   * about 64 particles (36 on a phone) drawn at 30 fps; 20 at 20 fps in the "lite" level; none in "min"
//   * the canvas is capped at 1.5x resolution (the shapes are small and soft, nobody can see the difference)
//   * the spotlight only touches the DOM while it is still catching up with the pointer

const GLYPHS = ['✦', '✧', '❝', '❞', '⁂', '§', '¶', '❦', '※', '✶', '⌘', '◈']
const HUES = [34, 265]
const GLYPH_SIZES = [12, 16, 21, 26]
const BOOK_SIZES = [8, 12, 16, 20]
const rand = (a, b) => a + Math.random() * (b - a)

// How each theme paints the sprites. Sprites are baked at full strength and faded with globalAlpha when stamped.
// Night: pale shapes on black. Light: deeper, more saturated shapes, because pale ones vanish on a pale page.
const LOOK = {
  dark: {
    glyph: (h) => `hsl(${h}, 82%, 82%)`, glyphAlpha: 1,
    bookFill: (h) => `hsl(${h}, 62%, 90%)`, bookStroke: (h) => `hsl(${h}, 70%, 66%)`, fillRel: 1 / 1.9, strokeRel: 1, bookAlpha: 1.9,
    line: '245,185,113', lineAlpha: 0.32,
  },
  light: {
    glyph: (h) => `hsl(${h}, 70%, 52%)`, glyphAlpha: 0.8,
    bookFill: (h) => `hsl(${h}, 80%, 66%)`, bookStroke: (h) => `hsl(${h}, 60%, 44%)`, fillRel: 1, strokeRel: 1.6 / 1.8, bookAlpha: 1.8,
    line: '106,77,224', lineAlpha: 0.3,
  },
}

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

// Draws every possible particle once. Returns { sprites, glyphBase, bookBase }: sprites[i] = { c: canvas, w, h } (w, h in CSS px).
function buildAtlas(look, dpr) {
  const sprites = []
  const make = (w, h) => {
    const c = document.createElement('canvas')
    c.width = Math.max(1, Math.ceil(w * dpr))
    c.height = Math.max(1, Math.ceil(h * dpr))
    const g = c.getContext('2d')
    g.scale(dpr, dpr)
    return { c, g, w, h }
  }
  const glyphBase = 0
  for (const glyph of GLYPHS) {
    for (const hue of HUES) {
      for (const size of GLYPH_SIZES) {
        const box = size * 1.7
        const s = make(box, box)
        s.g.font = `${size}px 'Fraunces', Georgia, serif`
        s.g.textAlign = 'center'
        s.g.textBaseline = 'middle'
        s.g.fillStyle = look.glyph(hue)
        s.g.fillText(glyph, box / 2, box / 2)
        sprites.push(s)
      }
    }
  }
  const bookBase = sprites.length
  for (const hue of HUES) {
    for (const size of BOOK_SIZES) {
      const w = size * 0.62
      const h = size
      const s = make(w + 4, h + 4) // 2px margin so the outline is not cut
      const g = s.g
      g.translate(2, 2)
      g.globalAlpha = look.fillRel
      g.fillStyle = look.bookFill(hue)
      roundRectPath(g, 0, 0, w, h, 1.6)
      g.fill()
      g.globalAlpha = look.strokeRel
      g.strokeStyle = look.bookStroke(hue)
      g.lineWidth = 1
      g.beginPath()
      g.moveTo(2.2, 0)
      g.lineTo(2.2, h)
      g.stroke()
      sprites.push(s)
    }
  }
  return { sprites, glyphBase, bookBase }
}

function Layers({ theme }) {
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

    const look = LOOK[theme === 'light' ? 'light' : 'dark']
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const mouse = { x: -9999, y: -9999, active: false }
    let targetX = window.innerWidth / 2
    let targetY = window.innerHeight / 2
    let spotX = targetX
    let spotY = targetY
    let W = 0
    let H = 0
    let dpr = 1
    let atlas = null
    let n = 0
    // one flat array per property instead of one object per particle
    const MAX = 80
    const px = new Float32Array(MAX)
    const py = new Float32Array(MAX)
    const vx = new Float32Array(MAX)
    const vy = new Float32Array(MAX)
    const rot = new Float32Array(MAX)
    const vr = new Float32Array(MAX)
    const wob = new Float32Array(MAX)
    const wobSpeed = new Float32Array(MAX)
    const alpha = new Float32Array(MAX)
    const isGlyph = new Uint8Array(MAX)
    const spr = new Uint16Array(MAX)
    let frame = 0
    let resizeTimer = 0
    let scrollQueued = false
    let lastDraw = 0
    let lastFrame = 0

    // ---- particles --------------------------------------------------------
    function spawn(i) {
      const glyph = Math.random() < 0.42
      isGlyph[i] = glyph ? 1 : 0
      const hue = Math.random() < 0.55 ? 0 : 1 // index into HUES
      if (glyph) {
        const g = (Math.random() * GLYPHS.length) | 0
        const s = (Math.random() * GLYPH_SIZES.length) | 0
        spr[i] = atlas.glyphBase + (g * HUES.length + hue) * GLYPH_SIZES.length + s
        alpha[i] = rand(0.14, 0.46)
      } else {
        const s = (Math.random() * BOOK_SIZES.length) | 0
        spr[i] = atlas.bookBase + hue * BOOK_SIZES.length + s
        alpha[i] = rand(0.05, 0.17)
      }
      px[i] = Math.random() * W
      py[i] = Math.random() * H
      vx[i] = rand(-0.22, 0.22)
      vy[i] = rand(-0.3, 0.14)
      rot[i] = Math.random() * Math.PI * 2
      vr[i] = rand(-0.01, 0.01)
      wob[i] = Math.random() * Math.PI * 2
      wobSpeed[i] = rand(0.0016, 0.0055)
    }

    function particleCount() {
      const tier = getTier()
      if (tier === 'min') return 0
      const cap = tier === 'lite' ? 20 : W < 760 ? 36 : 64
      return Math.min(cap, Math.max(16, Math.floor((W * H) / 18000)))
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      W = canvas.clientWidth
      H = canvas.clientHeight
      canvas.width = Math.floor(W * dpr)
      canvas.height = Math.floor(H * dpr)
      if (!atlas) atlas = buildAtlas(look, dpr)
      n = particleCount()
      for (let i = 0; i < n; i++) spawn(i)
    }

    // k = how many 60 fps frames passed since the last draw, so motion keeps its speed when we draw less often
    function draw(k, tier) {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const mx = mouse.x
      const my = mouse.y
      const active = mouse.active
      const sprites = atlas.sprites
      for (let i = 0; i < n; i++) {
        wob[i] += wobSpeed[i] * k
        let x = px[i] + (vx[i] + Math.sin(wob[i]) * 0.24) * k
        let y = py[i] + (vy[i] + Math.cos(wob[i] * 0.7) * 0.14) * k
        rot[i] += vr[i] * k

        // the cursor pushes particles away
        if (active) {
          const dx = x - mx
          const dy = y - my
          const d2 = dx * dx + dy * dy
          if (d2 < 30625 && d2 > 1) {
            const d = Math.sqrt(d2)
            const f = (1 - d / 175) ** 2 * 20
            x += (dx / d) * f * k
            y += (dy / d) * f * k
          }
        }

        // wrap around the edges
        if (x < -70) x = W + 70
        else if (x > W + 70) x = -70
        if (y < -70) y = H + 70
        else if (y > H + 70) y = -70
        px[i] = x
        py[i] = y

        // stamp the sprite: a rotation matrix + a position, scaled to device pixels
        const s = sprites[spr[i]]
        const c = Math.cos(rot[i]) * dpr
        const sn = Math.sin(rot[i]) * dpr
        ctx.globalAlpha = alpha[i] * (isGlyph[i] ? look.glyphAlpha : look.bookAlpha)
        ctx.setTransform(c, sn, -sn, c, x * dpr, y * dpr)
        ctx.drawImage(s.c, -s.w / 2, -s.h / 2, s.w, s.h)
      }

      // constellation lines from the cursor to nearby particles (full level only)
      if (active && tier === 'full') {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.globalAlpha = 1
        ctx.lineWidth = 1
        for (let i = 0; i < n; i++) {
          const d = Math.hypot(px[i] - mx, py[i] - my)
          if (d < 185) {
            ctx.strokeStyle = `rgba(${look.line},${(1 - d / 185) * look.lineAlpha})`
            ctx.beginPath()
            ctx.moveTo(px[i], py[i])
            ctx.lineTo(mx, my)
            ctx.stroke()
          }
        }
      }
      ctx.globalAlpha = 1
    }

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
    // Every frame it feeds the quality governor, eases the spotlight (only touching the DOM while it still moves), and
    // draws the particles every 33 ms (full) or 50 ms (lite).
    function loop(now) {
      frame = requestAnimationFrame(loop)
      const dt = now - lastFrame
      lastFrame = now
      sample(dt)
      const tier = getTier()
      if (tier === 'min') return
      if (tier === 'full') {
        const dx = targetX - spotX
        const dy = targetY - spotY
        if (Math.abs(dx) > 0.4 || Math.abs(dy) > 0.4) {
          const a = 1 - Math.exp(-Math.min(dt, 100) / 130) // same easing at 30, 60 or 144 fps
          spotX += dx * a
          spotY += dy * a
          spot.style.transform = `translate3d(${spotX}px, ${spotY}px, 0)`
        }
      }
      if (now - lastDraw >= (tier === 'full' ? 33 : 50)) {
        draw(Math.min(3, (now - lastDraw) / 16.67), tier)
        lastDraw = now
      }
    }
    const onVisibility = () => {
      cancelAnimationFrame(frame)
      if (!document.hidden && !reduceMotion) {
        lastDraw = lastFrame = performance.now()
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
    // the governor changed level: new particle count (and an empty canvas for "min")
    const offTier = onTier(() => {
      resize()
      if (getTier() === 'min') ctx.clearRect(0, 0, canvas.width, canvas.height)
    })

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
      lastDraw = lastFrame = performance.now()
      frame = requestAnimationFrame(loop)
    }

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(resizeTimer)
      offTier()
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      sizeWatcher?.disconnect()
    }
  }, [theme]) // a theme change rebuilds the sprites in the new colours

  return (
    <>
      <div className="ink-fx" aria-hidden="true">
        {/* ONE layer: styles/perf.css paints the four colour glows as gradients of this single element and drifts it slowly */}
        <div className="ink-aurora" />
        <canvas ref={canvasRef} className="ink-canvas" />
        <div ref={spotRef} className="ink-spotlight" />
        <div className="ink-sheen" />
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
  return <Layers theme={useTheme()} />
}
