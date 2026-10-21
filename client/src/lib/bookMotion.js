// The maths behind the "you bought this book!" animation.
// Nothing in this file touches React or the page. It only turns a time t (in seconds) into numbers,
// so every number can be checked by hand, by the Motion Lab page (#/motion-lab), or by `npm run check:motion`.
//
// One clock t runs from 0 to T. Three things happen on it:
//
//  1. JUMP  - the book hops and bounces, every hop lower than the last.
//     Gravity is the same for all hops, so a hop that lasts d seconds peaks at g*d^2/8.
//     Each landing keeps a fraction e (0 < e < 1) of the speed, so hop k is:
//         duration  d_k    = d0 * e^k
//         peak      H_k    = H  * e^(2k)
//         height    h(t)   = 4 * H_k * s * (1 - s)        where s = (t - start_k) / d_k, from 0 to 1
//     The hops add up to a geometric series, so the whole jump has a finite length:
//         T = d0 / (1 - e)
//     and hop k starts at C_k = d0 * (1 - e^k) / (1 - e), which gives k straight from t without a loop:
//         k = floor( ln(1 - t(1 - e) / d0) / ln(e) )
//
//  2. FLIP  - the book turns around its vertical axis like a spring that is pulled to its target angle.
//     With damping ratio z (< 1) and natural frequency w (rad/s):
//         f(t)  = 1 - exp(-z*w*t) * ( cos(wd*t) + z*w/wd * sin(wd*t) )      wd = w * sqrt(1 - z^2)
//         angle = 360 * turns * f(t)
//     f starts at 0 with zero speed, overshoots a little, then settles on 1.
//     The biggest overshoot is exp(-pi*z / sqrt(1 - z^2)) of the full turn.
//
//  3. COLOUR - a colour wash sweeps round the colour wheel and fades in and out:
//         p     = t / T
//         hue   = hueStart + 360 * hueTurns * p
//         alpha = glow * sin^2(pi * p)          (0 at both ends, biggest in the middle)
//
// The shadow on the floor follows the height: shadow = 1 / (1 + h / H), so it is 1 on the floor and 0.5 at the first peak.
//
// LOOP (book lists): the same show, repeated forever with a rest in between, for books the signed-in person already owns.
//     cycle = T + pause
//     state(time) = sample( min( time mod cycle, T ) )
// Because the show starts and ends at rest (height 0, flip on a whole turn, wash at 0), the end of one cycle is the start of
// the next and there is no jump at the seam. Each book gets its own time shift so a shelf of owned books does not flip in step.

export const BOOK_MOTION = {
  hopHeight: 64, // H, px: how high the first hop goes
  hopTime: 0.55, // d0, s: how long the first hop lasts
  restitution: 0.55, // e: share of the speed kept after every landing
  turns: 1, // full turns during the flip (whole numbers only, so the book ends facing front)
  omega: 9.8, // w, rad/s: how fast the spring snaps towards the target angle (was 14, now 0.7x)
  zeta: 0.45, // z: damping. Lower = more wobble, 1 = no overshoot at all
  hueTurns: 1, // trips round the colour wheel
  glow: 0.55, // biggest alpha of the colour wash
  hueStart: null, // null means each book picks its own start colour from its id
}

// the calmer version used in book lists: a small hop, a softer wash, same flip
export const LOOP_MOTION = { ...BOOK_MOTION, hopHeight: 4, hopTime: 0.45, zeta: 0.6, glow: 0.35 }
export const LOOP_PAUSE = 2.4 // s of rest between two shows

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

// keep sliders and typos inside the range where the equations make sense
export function normalize(p = {}) {
  const m = { ...BOOK_MOTION, ...p }
  return {
    ...m,
    hopHeight: clamp(m.hopHeight, 1, 400),
    hopTime: clamp(m.hopTime, 0.1, 3),
    restitution: clamp(m.restitution, 0.05, 0.95),
    turns: Math.max(0, Math.round(m.turns)),
    omega: clamp(m.omega, 1, 80),
    zeta: clamp(m.zeta, 0.05, 3),
    hueTurns: Math.max(0, m.hueTurns),
    glow: clamp(m.glow, 0, 1),
  }
}

// a book's own starting colour, always the same for the same id
export function hueStartFor(id = '') {
  let h = 0
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) % 360
  return h
}

// ---------- JUMP ----------

// whole animation length, T = d0 / (1 - e)
export function totalTime(params) {
  const { hopTime, restitution } = normalize(params)
  return hopTime / (1 - restitution)
}

// when hop k starts: C_k = d0 (1 - e^k) / (1 - e)
export function hopStart(k, params) {
  const { hopTime, restitution } = normalize(params)
  return (hopTime * (1 - restitution ** k)) / (1 - restitution)
}

// which hop is the book in at time t (0 for the first one)
export function hopIndex(t, params) {
  const { hopTime, restitution } = normalize(params)
  const x = 1 - (t * (1 - restitution)) / hopTime
  return Math.max(0, Math.floor(Math.log(x) / Math.log(restitution)))
}

// height above the floor in px
export function jumpHeight(t, params) {
  const p = normalize(params)
  if (t <= 0 || t >= totalTime(p)) return 0
  const k = hopIndex(t, p)
  const d = p.hopTime * p.restitution ** k
  const s = clamp((t - hopStart(k, p)) / d, 0, 1)
  return 4 * p.hopHeight * p.restitution ** (2 * k) * s * (1 - s)
}

// ---------- FLIP ----------

// 0 -> 1 spring step (can go past 1 for a moment)
export function spinFraction(t, params) {
  const { omega, zeta } = normalize(params)
  if (t <= 0) return 0
  if (zeta >= 1) return 1 - Math.exp(-omega * t) * (1 + omega * t) // no wobble case
  const a = zeta * omega
  const wd = omega * Math.sqrt(1 - zeta * zeta)
  return 1 - Math.exp(-a * t) * (Math.cos(wd * t) + (a / wd) * Math.sin(wd * t))
}

export function spinAngle(t, params) {
  const p = normalize(params)
  return 360 * p.turns * spinFraction(t, p)
}

// ---------- COLOUR ----------

// unwrapped (can go past 360, so total travel is easy to check)
export function hueUnwrapped(p01, params) {
  const p = normalize(params)
  return (p.hueStart ?? 0) + 360 * p.hueTurns * p01
}

export function glowAlpha(p01, params) {
  const { glow } = normalize(params)
  if (p01 <= 0 || p01 >= 1) return 0
  return glow * Math.sin(Math.PI * p01) ** 2
}

export function shadowScale(height, params) {
  const { hopHeight } = normalize(params)
  return 1 / (1 + height / hopHeight)
}

// ---------- everything at one instant ----------

export function sample(t, params) {
  const p = normalize(params)
  const T = totalTime(p)
  const tt = clamp(t, 0, T)
  const p01 = tt / T
  const jump = jumpHeight(tt, p)
  const k = tt > 0 && tt < T ? hopIndex(tt, p) : 0
  const d = p.hopTime * p.restitution ** k
  return {
    t: tt,
    p: p01,
    hop: k,
    s: clamp((tt - hopStart(k, p)) / d, 0, 1), // how far through the current hop, 0 to 1
    jump,
    spin: spinAngle(tt, p),
    hue: ((hueUnwrapped(p01, p) % 360) + 360) % 360,
    glow: glowAlpha(p01, p),
    shadow: shadowScale(jump, p),
  }
}

// the looping show: time can be any number of seconds, it just wraps round
export function loopSample(time, params, pause = LOOP_PAUSE) {
  const T = totalTime(params)
  const cycle = T + pause
  const local = ((time % cycle) + cycle) % cycle
  return sample(Math.min(local, T), params)
}

// ---------- numbers worth looking at when choosing values ----------

export function derived(params) {
  const p = normalize(params)
  const z = p.zeta
  return {
    total: totalTime(p),
    gravity: (8 * p.hopHeight) / p.hopTime ** 2, // px/s^2, same for every hop
    hops: Math.ceil(Math.log(p.hopHeight / 0.5) / (2 * Math.log(1 / p.restitution))), // hops that rise more than half a pixel
    overshoot: z < 1 ? Math.exp((-Math.PI * z) / Math.sqrt(1 - z * z)) : 0, // share of the turn the flip goes past
    settle: z < 1 ? 4 / (z * p.omega) : 5.8 / p.omega, // about when the flip is within 2% of done
    peakAngle: 360 * p.turns * (1 + (z < 1 ? Math.exp((-Math.PI * z) / Math.sqrt(1 - z * z)) : 0)),
  }
}

// ---------- the rules the maths must obey ----------
// Each rule says what should be true, what the formula predicts, and what a brute-force look at the curve finds.
// If a rule fails, the maths is wrong (or the chosen numbers break it). No need to read any drawing code.

const scan = (fn, a, b, n = 2000) => {
  let best = { min: Infinity, max: -Infinity, atMax: a }
  for (let i = 0; i <= n; i++) {
    const x = a + ((b - a) * i) / n
    const v = fn(x)
    if (v < best.min) best.min = v
    if (v > best.max) {
      best.max = v
      best.atMax = x
    }
  }
  return best
}

export function checkInvariants(params) {
  const p = normalize(params)
  const T = totalTime(p)
  const e = p.restitution
  const H = p.hopHeight
  const g = (8 * H) / p.hopTime ** 2
  const rules = []
  const add = (id, group, rule, expected, actual, tol, extra = {}) =>
    rules.push({ id, group, rule, expected, actual, tol, pass: Math.abs(expected - actual) <= tol, ...extra })

  // JUMP
  add('floor-start', 'Jump', 'The book starts on the floor', 0, jumpHeight(0, p), 1e-9)
  add('floor-end', 'Jump', 'The book ends on the floor (just before T)', 0, jumpHeight(T * (1 - 1e-9), p), 0.01)
  const all = scan((t) => jumpHeight(t, p), 0, T, 4000)
  add('never-below', 'Jump', 'The book never goes through the floor (lowest height)', 0, Math.min(0, all.min), 1e-9)
  add('never-above', 'Jump', 'The book never goes higher than the first peak H (highest point)', H, all.max, 0.05)

  for (const k of [0, 1, 2]) {
    const a = hopStart(k, p)
    const b = hopStart(k + 1, p)
    const peak = scan((t) => jumpHeight(t, p), a, b, 2000).max
    add(`peak-${k}`, 'Jump', `Hop ${k + 1} peaks at H * e^(2k)`, H * e ** (2 * k), peak, 0.02)
  }

  for (const k of [1, 2, 3]) {
    const c = hopStart(k, p)
    const worst = Math.max(jumpHeight(c - 1e-7, p), jumpHeight(c + 1e-7, p))
    add(`join-${k}`, 'Jump', `Hops ${k} and ${k + 1} meet on the floor (no gap, no teleport)`, 0, worst, 0.01)
  }

  for (const k of [0, 1]) {
    const c = hopStart(k + 1, p)
    const d = 1e-6
    const landing = jumpHeight(c - d, p) / d
    const takeoff = jumpHeight(c + d, p) / d
    add(`restitution-${k}`, 'Jump', `Take-off speed after landing ${k + 1} is e times the landing speed`, e, takeoff / landing, 1e-3)
  }

  {
    const gs = [0, 1, 2].map((k) => {
      const a = hopStart(k, p)
      const b = hopStart(k + 1, p)
      const peak = scan((t) => jumpHeight(t, p), a, b, 2000).max
      return (8 * peak) / (b - a) ** 2
    })
    add('gravity', 'Jump', 'Gravity is the same in every hop (g = 8 * peak / duration^2)', g, gs.reduce((m, v) => (Math.abs(v - g) > Math.abs(m - g) ? v : m), g), g * 1e-3)
  }

  {
    let sum = 0
    for (let k = 0; k < 400; k++) sum += p.hopTime * e ** k
    add('total-time', 'Jump', 'All hop durations add up to T = d0 / (1 - e)', T, sum, 1e-6)
  }

  // FLIP
  add('spin-start', 'Flip', 'The flip starts at angle 0', 0, spinAngle(0, p), 1e-9)
  {
    const d = 1e-5
    add('spin-speed-start', 'Flip', 'The flip starts from rest (speed about 0 degrees per second)', 0, spinAngle(d, p) / d, 1)
  }
  add('spin-end', 'Flip', 'The flip has landed on the full turn by T (degrees)', 360 * p.turns, spinAngle(T, p), 0.5, { kind: 'design' })
  if (p.zeta < 1) {
    const peak = scan((t) => spinAngle(t, p), 0, T, 4000).max
    add('overshoot', 'Flip', 'Biggest angle matches 360 * turns * (1 + exp(-pi z / sqrt(1 - z^2)))', derived(p).peakAngle, peak, 0.5)
  }

  // COLOUR
  add('glow-start', 'Colour', 'The colour wash is invisible at the start', 0, glowAlpha(0, p), 1e-9)
  add('glow-end', 'Colour', 'The colour wash is gone again at the end', 0, glowAlpha(1, p), 1e-9)
  add('glow-peak', 'Colour', 'The wash is strongest in the middle and reaches exactly "glow"', p.glow, glowAlpha(0.5, p), 1e-9)
  {
    const wash = scan((q) => glowAlpha(q, p), 0, 1, 2000)
    add('glow-range', 'Colour', 'The wash never goes below 0 or above "glow" (highest value)', p.glow, wash.max, 1e-6)
  }
  add('hue-travel', 'Colour', 'The colour travels exactly hueTurns times round the wheel (degrees)', 360 * p.hueTurns, hueUnwrapped(1, p) - hueUnwrapped(0, p), 1e-9)

  // SHADOW
  add('shadow-floor', 'Shadow', 'The shadow is full size when the book is on the floor', 1, shadowScale(0, p), 1e-12)
  add('shadow-peak', 'Shadow', 'The shadow is half size at the first peak', 0.5, shadowScale(H, p), 1e-12)

  // LOOP (the version in book lists)
  {
    const cycle = T + LOOP_PAUSE
    const start = loopSample(0, p)
    const end = loopSample(cycle - 1e-9, p)
    const gap = (a, b) => {
      const d = Math.abs(a - b) % 360
      return Math.min(d, 360 - d)
    }
    add('loop-seam-height', 'Loop', 'Height is the same at the end of a cycle and the start of the next (no jump at the seam)', start.jump, end.jump, 0.01)
    add('loop-seam-colour', 'Loop', 'Colour wash is the same on both sides of the seam', start.glow, end.glow, 0.001)
    add('loop-seam-hue', 'Loop', 'Colour is the same on both sides of the seam (degrees round the wheel)', 0, gap(start.hue, end.hue), 0.5)
    add('loop-seam-angle', 'Loop', 'The book faces the same way on both sides of the seam (degrees)', 0, gap(start.spin, end.spin), 0.5, { kind: 'design' })
    const rest = loopSample(T + LOOP_PAUSE / 2, p)
    add('loop-rest', 'Loop', 'In the middle of the pause the book is still, on the floor, with no colour wash', 0, Math.abs(rest.jump) + rest.glow, 0.01)
    const x = 0.37
    add('loop-periodic', 'Loop', 'The show repeats exactly every T + pause (height one cycle later)', loopSample(x, p).jump, loopSample(x + cycle, p).jump, 1e-9)
  }

  // DESIGN CHECKS (not maths errors, but choices that can make it look wrong)
  const dv = derived(p)
  add('settled-in-time', 'Design', 'The flip has settled (within 2%) before the jump ends (seconds)', Math.min(dv.settle, T), dv.settle, Math.max(0, T - dv.settle), { kind: 'design' })
  return rules
}
