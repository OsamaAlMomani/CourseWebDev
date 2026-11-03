import { useEffect, useRef } from 'react'

// The engine of a sideways shelf (reference section 8): mouse drag, mouse wheel, keyboard, arrow buttons,
// and the arrows switch off at either end. Touch uses the browser's own swipe + scroll-snap.
//
//   const { rail, prev, next } = useDragRail()
//   <div ref={rail} tabIndex={0}> ...cards... </div>   <button ref={prev}>  <button ref={next}>
export default function useDragRail() {
  const rail = useRef(null)
  const prev = useRef(null)
  const next = useRef(null)

  useEffect(() => {
    const el = rail.current
    if (!el) return undefined
    const prevBtn = prev.current
    const nextBtn = next.current

    let dragging = false
    let moved = false
    let startX = 0
    let startLeft = 0
    let pointerId = null

    const step = () => Math.min(el.clientWidth * 0.82, 340)
    const scrollRail = (dir) => el.scrollBy({ left: dir * step(), behavior: 'smooth' })

    const syncArrows = () => {
      const max = el.scrollWidth - el.clientWidth
      if (prevBtn) prevBtn.disabled = el.scrollLeft <= 2
      if (nextBtn) nextBtn.disabled = el.scrollLeft >= max - 2
    }

    const onPrev = () => scrollRail(-1)
    const onNext = () => scrollRail(1)

    const onDown = (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      dragging = true
      moved = false
      startX = e.clientX
      startLeft = el.scrollLeft
      pointerId = e.pointerId
      el.classList.add('dragging')
      try {
        el.setPointerCapture(e.pointerId)
      } catch {
        // some browsers refuse capture; dragging still works while the pointer stays over the rail
      }
    }
    const onMove = (e) => {
      if (!dragging) return
      const dx = e.clientX - startX
      if (Math.abs(dx) > 4) moved = true
      el.scrollLeft = startLeft - dx
    }
    const endDrag = () => {
      if (!dragging) return
      dragging = false
      el.classList.remove('dragging')
      if (pointerId !== null) {
        try {
          el.releasePointerCapture(pointerId)
        } catch {
          // already released
        }
        pointerId = null
      }
    }
    // the click that ends a drag must not open the card under the pointer
    const onClickCapture = (e) => {
      if (moved) {
        e.preventDefault()
        e.stopPropagation()
        moved = false
      }
    }
    // a vertical wheel turn moves the shelf sideways, but lets the page scroll at either end
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      const max = el.scrollWidth - el.clientWidth
      const atStart = el.scrollLeft <= 0
      const atEnd = el.scrollLeft >= max - 1
      if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
    const onKey = (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); scrollRail(1) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); scrollRail(-1) }
      if (e.key === 'Home') { e.preventDefault(); el.scrollTo({ left: 0, behavior: 'smooth' }) }
      if (e.key === 'End') { e.preventDefault(); el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' }) }
    }

    prevBtn?.addEventListener('click', onPrev)
    nextBtn?.addEventListener('click', onNext)
    el.addEventListener('scroll', syncArrows, { passive: true })
    window.addEventListener('resize', syncArrows)
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', endDrag)
    el.addEventListener('pointercancel', endDrag)
    el.addEventListener('pointerleave', endDrag)
    el.addEventListener('click', onClickCapture, true)
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('keydown', onKey)
    syncArrows()

    return () => {
      prevBtn?.removeEventListener('click', onPrev)
      nextBtn?.removeEventListener('click', onNext)
      el.removeEventListener('scroll', syncArrows)
      window.removeEventListener('resize', syncArrows)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', endDrag)
      el.removeEventListener('pointercancel', endDrag)
      el.removeEventListener('pointerleave', endDrag)
      el.removeEventListener('click', onClickCapture, true)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('keydown', onKey)
    }
  }, [])

  return { rail, prev, next }
}
