import { useRef, useState } from 'react'
import { asset } from '../lib/asset'

// A muted looping video that sits behind a section, plus the button that pauses it.
// The parent section must be `relative isolate overflow-hidden`.
// Hidden for people who asked their device for less motion (they see the section colour instead).
export default function BackgroundVideo({
  src,
  poster,
  className = 'opacity-55',
  buttonClass = 'bg-ink/70 text-white',
}) {
  const ref = useRef(null)
  // autoplay means it starts out playing
  const [playing, setPlaying] = useState(true)

  function toggle() {
    const v = ref.current
    if (!v) return
    if (v.paused) {
      v.play()
      setPlaying(true)
    } else {
      v.pause()
      setPlaying(false)
    }
  }

  return (
    <>
      <video
        ref={ref}
        className={`absolute inset-0 -z-20 h-full w-full object-cover motion-reduce:hidden ${className}`}
        src={asset(src)}
        poster={poster ? asset(poster) : undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        disablePictureInPicture
        aria-hidden="true"
        tabIndex={-1}
      />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={!playing}
        className={`absolute right-4 bottom-4 z-10 min-h-11 rounded-full px-4 text-sm font-bold backdrop-blur motion-reduce:hidden ${buttonClass}`}
      >
        {playing ? 'Pause background' : 'Play background'}
      </button>
    </>
  )
}
