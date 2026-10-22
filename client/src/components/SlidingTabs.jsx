'use client'

import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

// A strip of tabs with ONE highlight that slides to whichever tab is active.
// Used twice in the header: the big audience tabs (links) and the smaller section subtabs (filter buttons).
//
//   items:    [{ id, label, icon?, count?, href? }]   an item with href is a link, otherwise a button
//   activeId: the id that gets the highlight (null/unknown = no highlight)
//   tone:     'blue' (audience tabs) or 'coral' (subtabs)
//   onSelect: called with (item) when a tab is clicked or selected with the keyboard
//   mode:     'nav' (links / filter buttons, the default) or 'tabs' (real ARIA tabs that switch a panel
//             with id panel-<id>; arrow keys / Home / End move focus and selection)
//
// On narrow screens the strip scrolls sideways, fades out at the edges, and keeps the active tab in view.

// useLayoutEffect warns during SSR; on the server it degrades to useEffect (a no-op there anyway)
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

const TONES = {
  blue: { pill: 'bg-blue', on: 'text-white' },
  coral: { pill: 'bg-coral', on: 'text-ink' },
}

const SIZES = {
  md: 'min-h-11 px-4 text-base',
  sm: 'min-h-10 px-3.5 text-sm',
}

const FADE = 28 // px of fade at a scrollable edge
const SLOP = 1 // px of tolerance for "at the edge" / "needs scrolling"

function samePill(a, b) {
  if (a === b) return true
  if (!a || !b) return false
  return a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height
}

function SlidingTabs({
  items,
  activeId,
  label,
  tone = 'blue',
  size = 'md',
  mode = 'nav',
  onSelect,
}
) {
  const listRef = useRef(null)
  const tabRefs = useRef(new Map())

  const [pill, setPill] = useState(null) // where the highlight sits: { left, top, width, height }
  const [edges, setEdges] = useState({ start: false, end: false }) // is there more to scroll on each side?
  const [scrollable, setScrollable] = useState(false)
  const [focused, setFocused] = useState(false)
  const [animate, setAnimate] = useState(false) // off for the very first placement, so it doesn't fly in from the corner

  const t = TONES[tone] ?? TONES.blue
  const s = SIZES[size] ?? SIZES.md
  const isTabs = mode === 'tabs'

  // ---- measurement ---------------------------------------------------------

  const updatePill = useCallback(() => {
    // offsetLeft/Top are relative to the list's padding box, which is also what
    // an absolutely positioned child's `left: 0; top: 0` resolves against.
    const el = activeId == null ? null : tabRefs.current.get(activeId)
    setPill((prev) => {
      const next = el
        ? { left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight }
        : null
      return samePill(prev, next) ? prev : next
    })
  }, [activeId])

  const updateEdges = useCallback(() => {
    const list = listRef.current
    if (!list) return
    const overflowing = list.scrollWidth > list.clientWidth + SLOP
    setScrollable((prev) => (prev === overflowing ? prev : overflowing))
    setEdges((prev) => {
      const start = overflowing && list.scrollLeft > SLOP
      const end = overflowing && list.scrollLeft + list.clientWidth < list.scrollWidth - SLOP
      return prev.start === start && prev.end === end ? prev : { start, end }
    })
  }, [])

  // one path for every reason to re-measure: render, resize, font load, scroll
  const sync = useCallback(() => {
    updatePill()
    updateEdges()
  }, [updatePill, updateEdges])

  useIsomorphicLayoutEffect(sync, [sync, items])

  // sizes change when the window is resized or the web font arrives, so measure again then
  useEffect(() => {
    const list = listRef.current
    if (!list) return

    const ro = new ResizeObserver(sync)
    ro.observe(list)

    let cancelled = false
    document.fonts?.ready.then(() => {
      if (!cancelled) sync()
    })

    return () => {
      cancelled = true
      ro.disconnect()
    }
  }, [sync])

  // turn the slide animation on one frame after the first placement
  useEffect(() => {
    if (!pill || animate) return
    let inner
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setAnimate(true))
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [pill, animate])

  // keep the active tab in view (phones), but only when it is actually out of view
  useEffect(() => {
    const list = listRef.current
    const el = activeId == null ? null : tabRefs.current.get(activeId)
    if (!list || !el || list.scrollWidth <= list.clientWidth + SLOP) return

    const start = el.offsetLeft
    const end = start + el.offsetWidth
    const viewStart = list.scrollLeft
    const viewEnd = viewStart + list.clientWidth
    if (start >= viewStart && end <= viewEnd) return

    const max = list.scrollWidth - list.clientWidth
    const target = Math.min(Math.max(start - (list.clientWidth - el.offsetWidth) / 2, 0), max)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    list.scrollTo({ left: target, behavior: reduced ? 'auto' : 'smooth' })
  }, [activeId, items.length])

  // ---- keyboard (real tabs only) -------------------------------------------

  const handleKeyDown = (event) => {
    if (!isTabs) return
    const tabs = items.filter((item) => !item.href)
    if (tabs.length < 2) return

    const index = tabs.findIndex((item) => tabRefs.current.get(item.id) === document.activeElement)
    if (index === -1) return

    let next
    switch (event.key) {
      case 'ArrowRight':
        next = (index + 1) % tabs.length
        break
      case 'ArrowLeft':
        next = (index - 1 + tabs.length) % tabs.length
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = tabs.length - 1
        break
      default:
        return
    }

    event.preventDefault()
    const item = tabs[next]
    onSelect?.(item)
    tabRefs.current.get(item.id)?.focus()
  }

  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
  }

  // ---- render --------------------------------------------------------------

  const hasActiveTab = items.some((item) => !item.href && item.id === activeId)
  const firstTabId = isTabs ? items.find((item) => !item.href)?.id : undefined

  // only mask when it does something, and never while a tab is focused (it would clip the focus ring)
  const mask =
    scrollable && !focused
      ? `linear-gradient(to right, ${edges.start ? 'transparent' : '#000'} 0, #000 ${FADE}px, #000 calc(100% - ${FADE}px), ${edges.end ? 'transparent' : '#000'} 100%)`
      : undefined

  return (
    <div
      ref={listRef}
      role={isTabs ? 'tablist' : 'group'}
      aria-label={label}
      onScroll={updateEdges}
      onKeyDown={handleKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
      style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
      className="relative flex gap-1 overflow-x-auto overscroll-x-contain px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {/* the sliding highlight sits under the labels */}
      {pill && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-0 top-0 rounded-full ${t.pill} ${
            animate ? 'transition-[transform,width,height] duration-300 ease-out motion-reduce:transition-none' : ''
          }`}
          style={{
            width: pill.width,
            height: pill.height,
            transform: `translate3d(${pill.left}px, ${pill.top}px, 0)`,
          }}
        />
      )}

      {items.map((item) => {
        const active = item.id === activeId
        // roving tabindex: exactly one tab is reachable with Tab
        const tabbable = !isTabs || active || (!hasActiveTab && item.id === firstTabId)

        const cls = [
          'relative z-10 inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-semibold',
          'transition-colors motion-reduce:transition-none',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue',
          s,
          active ? t.on : 'text-ink/75 hover:bg-ink/5 hover:text-ink',
        ].join(' ')

        const inner = (
          <>
            {item.icon && <span aria-hidden="true">{item.icon}</span>}
            {item.label}
            {item.count !== undefined && (
              <span
                className={`rounded-full px-1.5 text-xs font-bold tabular-nums ${
                  active ? 'bg-current/20' : 'bg-ink/10'
                }`}
              >
                {item.count}
              </span>
            )}
          </>
        )

        const setRef = (el) => {
          if (el) tabRefs.current.set(item.id, el)
          else tabRefs.current.delete(item.id)
        }

        return item.href ? (
          <a
            key={item.id}
            ref={setRef}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            onClick={() => onSelect?.(item)}
            className={cls}
          >
            {inner}
          </a>
        ) : (
          <button
            key={item.id}
            ref={setRef}
            type="button"
            {...(isTabs
              ? {
                  role: 'tab',
                  id: `tab-${item.id}`,
                  tabIndex: tabbable ? 0 : -1,
                  'aria-selected': active,
                  'aria-controls': `panel-${item.id}`,
                }
              : { 'aria-pressed': active })}
            onClick={() => onSelect?.(item)}
            className={cls}
          >
            {inner}
          </button>
        )
      })}
    </div>
  )
}
export default memo(SlidingTabs)
