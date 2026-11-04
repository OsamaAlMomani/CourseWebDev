// The quality governor. The site has three levels of effects:
//   full  aurora, sheen, spotlight, ~64 particles at 30 fps, card reflections and tilt
//   lite  one static aurora, 20 particles at 20 fps, no sheen / spotlight / card reflections
//   min   the existing .skin-reduce-fx kill switch: static gradient page, no particles, no pointer effects
// The level is written on <html data-fx="..."> (styles/perf.css reads it) and the particle canvas reads it too.
//
// How it picks: it starts at "lite" on weak devices (4 cores or fewer, 4 GB memory or less, Save-Data on) and at "full"
// otherwise. Then it watches the real frame time: the background loop feeds every frame in through sample(), and when the
// average stays slower than the limit for two windows in a row (about 4 seconds) it steps DOWN one level. It never steps up
// by itself, so the page can not flap between looks. The choice is kept for the tab (sessionStorage), so a slow device is
// not re-measured on every page load. To force a level while testing, run  window.__setFx('lite')  in the console.

const TIERS = ['full', 'lite', 'min']
const KEY = 'gb-fx'
const WARMUP_MS = 3000 // the first seconds are always janky (fonts, images, first render): do not judge them
const WINDOW_MS = 2000
const LIMIT_MS = { full: 24, lite: 38 } // average ms per frame that counts as "too slow" (24 = under ~42 fps)

let tier = 'full'
let ema = 0
let clock = 0
let windowStart = 0
let slowWindows = 0
const listeners = new Set()

function startTier() {
  try {
    const saved = sessionStorage.getItem(KEY)
    if (TIERS.includes(saved)) return saved
  } catch {
    // storage blocked: just measure again
  }
  const nav = navigator
  const weak = (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) || (nav.deviceMemory && nav.deviceMemory <= 4) || nav.connection?.saveData
  return weak ? 'lite' : 'full'
}

function apply(next, remember = true) {
  tier = next
  document.documentElement.dataset.fx = next
  document.body?.classList.toggle('skin-reduce-fx', next === 'min')
  if (remember) {
    try {
      sessionStorage.setItem(KEY, next)
    } catch {
      // fine
    }
  }
  listeners.forEach((fn) => fn(next))
}

export const getTier = () => tier

export function onTier(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// called once per animation frame with the time since the last frame (ms)
export function sample(dt) {
  if (dt > 250) return // the tab was hidden or the machine slept: not a real frame
  clock += dt
  if (clock < WARMUP_MS || tier === 'min') return
  ema = ema ? ema * 0.9 + dt * 0.1 : dt
  if (clock - windowStart < WINDOW_MS) return
  windowStart = clock
  slowWindows = ema > LIMIT_MS[tier] ? slowWindows + 1 : 0
  if (slowWindows >= 2) {
    slowWindows = 0
    ema = 0
    clock = WARMUP_MS - 1000 // let the new level settle for a second before judging it
    apply(TIERS[TIERS.indexOf(tier) + 1])
  }
}

export function initQuality() {
  apply(startTier(), false)
  window.__setFx = (t) => TIERS.includes(t) && apply(t, false)
}
