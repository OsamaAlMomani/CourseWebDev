import { useState } from 'react'
import { asset } from '../lib/asset'
import Container from './Container'

export default function Watch() {
  // true while the video is playing, driven by the video's own play / pause events
  const [playing, setPlaying] = useState(false)

  return (
    <section id="watch" className="bg-paper py-16 md:py-28">
      <Container className="reveal grid grid-cols-[minmax(0,1fr)] items-center gap-6 md:grid-cols-[360px_minmax(0,1fr)] md:gap-12">
        <div className="mx-auto aspect-[9/16] w-[min(100%,360px)] overflow-hidden rounded-[28px] bg-ink shadow-[0_18px_40px_rgba(20,18,43,0.3)]">
          <video
            controls
            playsInline
            preload="none"
            poster={asset('video/reel-poster.jpg')}
            aria-label="GlobalBooks in 14 seconds"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            className="h-full w-full object-cover"
          >
            <source src={asset('video/reel.mp4')} type="video/mp4" />
            Your browser can&apos;t play this video.
          </video>
        </div>
        <div>
          <p className="mb-2 text-base font-bold text-coral" aria-live="polite">
            {playing ? 'Now playing' : 'Tap play to watch'}
          </p>
          <h2 className="font-display text-[clamp(2.4rem,9vw,4.5rem)] leading-[0.95] font-extrabold tracking-[-0.035em] md:text-[clamp(2.2rem,4.6vw,4.5rem)]">
            GlobalBooks in 14 seconds
          </h2>
          <p className="mt-4 max-w-[46ch] text-xl text-muted">
            A quick tour of every reader group, from first picture books to study guides. Tap play; the video only
            loads when you do, so it won&apos;t use your data on the way in.
          </p>
        </div>
      </Container>
    </section>
  )
}
