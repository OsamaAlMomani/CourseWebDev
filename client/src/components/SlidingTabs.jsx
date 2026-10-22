import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

// A strip of tabs with ONE highlight that slides to whichever tab is active.
// Used twice in the header: the big audience tabs (links) and the smaller section subtabs (filter buttons).
//
//   items:    [{ id, label, icon?, count?, href? }]   an item with href is a link, otherwise a button
//   activeId: the id that gets the highlight (null/unknown = no highlight)
//   tone:     'blue' (audience tabs) or 'coral' (subtabs)
//   onSelect: called with (item) when a tab is clicked
//   mode:     'nav' (links / filter buttons, the default) or 'tabs' (real ARIA tabs that switch a panel with id panel-<id>)
//
// On narrow screens the strip scrolls sideways, fades out at the edges, and keeps the active tab in view.
const tones = {
  blue: { pill: 'bg-blue', on: 'text-white' },
  coral: { pill: 'bg-coral', on: 'text-ink' },
}
const sizes = {
  md: 'min-h-11 px-4 text-base',
  sm: 'min-h-10 px-3.5 text-sm',
}

export default function SlidingTabs({ items, activeId, label, tone = 'blue', size = 'md', mode = 'nav', onSelect }) {
  const listRef = useRef(null)
  const tabRefs = useRef({})
  const [pill, setPill] = useState(null) // where the highlight sits: { left, top, width, height }
  const [animate, setAnimate] = useState(false) // off for the very first placement, so it doesn't fly in from the corner
  const [edge, setEdge] = useState({ start: false, end: false }) // is there more to scroll on each side?
  const t = tones[tone]

  // measure the active tab. offsetLeft is relative to the list (it is position: relative), and it scrolls with it
  const measure = useCallback(() => {
    const el = tabRefs.current[activeId]
    setPill(el ? { left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight } : null)
  }, [activeId])

  const measureEdges = useCallback(() => {
    const list = listRef.current
    if (!list) return
    setEdge({
      start: list.scrollLeft > 2,
      end: list.scrollLeft + list.clientWidth < list.scrollWidth - 2,
    })
  }, [])

  useLayoutEffect(measure, [measure, items])

  // sizes change when the window is resized or the web font arrives, so measure again then
  useEffect(() => {
    const list = listRef.current
    const redo = () => {
      measure()
      measureEdges()
    }
    const ro = new ResizeObserver(redo)
    ro.observe(list)
    document.fonts?.ready.then(redo)
    return () => ro.disconnect()
  }, [measure, measureEdges, items])

  // turn the slide animation on one frame after the first placement
  useEffect(() => {
    if (!pill || animate) return
    let id2
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => setAnimate(true))
    })
    return () => {
      cancelAnimationFrame(id1)
      cancelAnimationFrame(id2)
    }
  }, [pill, animate])

  // keep the active tab in view when the strip scrolls (phones)
  useEffect(() => {
    const list = listRef.current
    const el = tabRefs.current[activeId]
    if (!list || !el || list.scrollWidth <= list.clientWidth) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    list.scrollTo({ left: Math.max(0, el.offsetLeft - (list.clientWidth - el.offsetWidth) / 2), behavior: reduced ? 'auto' : 'smooth' })
  }, [activeId, items.length])

  const fade = 28 // px of fade at a scrollable edge
  const mask = `linear-gradient(to right, ${edge.start ? 'transparent' : '#000'} 0, #000 ${fade}px, #000 calc(100% - ${fade}px), ${edge.end ? 'transparent' : '#000'} 100%)`

  return (
    <div
      ref={listRef}
      onScroll={measureEdges}
      role={mode === 'tabs' ? 'tablist' : 'group'}
      aria-label={label}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
      className="relative flex gap-1 overflow-x-auto overscroll-x-contain py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {/* the sliding highlight sits under the labels */}
      {pill && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-0 z-0 rounded-full ${t.pill} ${animate ? 'transition-[transform,width,height] duration-300 ease-out motion-reduce:transition-none' : ''}`}
          style={{ top: pill.top, width: pill.width, height: pill.height, transform: `translateX(${pill.left}px)` }}
        />
      )}

      {items.map((item) => {
        const active = item.id === activeId
        const cls = `relative z-10 inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue motion-reduce:transition-none ${sizes[size]} ${
          active ? t.on : 'text-ink/75 hover:bg-ink/5 hover:text-ink'
        }`
        const inner = (
          <>
            {item.icon && <span aria-hidden="true">{item.icon}</span>}
            {item.label}
            {item.count !== undefined && (
              <span className={`rounded-full px-1.5 text-xs font-bold tabular-nums ${active ? 'bg-current/20' : 'bg-ink/10'}`}>{item.count}</span>
            )}
          </>
        )
        return item.href ? (
          <a
            key={item.id}
            ref={(el) => (tabRefs.current[item.id] = el)}
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
            ref={(el) => (tabRefs.current[item.id] = el)}
            type="button"
            {...(mode === 'tabs'
              ? { role: 'tab', id: `tab-${item.id}`, 'aria-selected': active, 'aria-controls': `panel-${item.id}` }
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
