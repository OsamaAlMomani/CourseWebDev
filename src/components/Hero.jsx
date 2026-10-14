import { groups } from '../data/books'
import { themes } from '../data/themes'
import { asset, cover } from '../lib/asset'
import Container from './Container'
import Button from './Button'

// the fan of covers: how far each one is pushed sideways (x) and tilted (r)
const fan = [
  { id: 'glass-orbit', x: -160, r: -16, z: 1, delay: 0 },
  { id: 'moon-bakery', x: -80, r: -7, z: 3, delay: -1.2 },
  { id: 'cartographer', x: 0, r: 2, z: 5, delay: -2.4 },
  { id: 'learning-machines', x: 80, r: 10, z: 3, delay: -3.6 },
  { id: 'global-novel', x: 160, r: 18, z: 1, delay: -4.8 },
]

export default function Hero() {
  return (
    <section
      id="top"
      className="relative isolate flex overflow-hidden bg-ink pt-12 pb-16 text-white md:pt-20 md:pb-24 lg:min-h-[85svh] lg:items-center short-landscape:pt-6 short-landscape:pb-8"
    >
      <video
        className="absolute inset-0 -z-20 h-full w-full object-cover opacity-55 motion-reduce:hidden"
        src={asset('video/hero.mp4')}
        poster={asset('video/hero-poster.jpg')}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        disablePictureInPicture
        aria-hidden="true"
        tabIndex={-1}
      />
      {/* dark gradient so the text stays readable over the video */}
      <div className="absolute inset-0 -z-10 bg-linear-to-b from-ink/85 to-ink/50 lg:bg-linear-to-r lg:from-ink/90 lg:via-ink/45 lg:via-70% lg:to-ink/20" />

      <Container className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center short-landscape:grid-cols-[minmax(0,1fr)]">
        <div>
          <h1 className="mb-6 font-display text-[clamp(3rem,13vw,5.5rem)] leading-[0.92] font-extrabold tracking-[-0.045em] md:text-[clamp(4rem,10vw,6.5rem)] lg:text-[clamp(3.5rem,7vw,6.5rem)]">
            Books for <span className="text-sun">every reader,</span> delivered anywhere.
          </h1>
          <p className="mb-8 max-w-[40ch] text-xl text-[#e3e0ff] md:text-2xl">
            Picture books to textbooks. Shipped to over 180 countries.
          </p>
          <Button large href="#choose" className="shadow-[0_10px_0_rgba(0,0,0,0.25)]">
            Choose your shelf
          </Button>
          <div className="mt-8 flex flex-wrap gap-3">
            {groups.map((g) => (
              <a
                key={g.id}
                href={`#/${g.id}`}
                className={`inline-flex min-h-12 items-center rounded-full px-6 text-lg font-bold transition hover:-translate-y-0.5 ${themes[g.id].pill}`}
              >
                {g.title}
              </a>
            ))}
          </div>
        </div>

        <div
          aria-hidden="true"
          className="relative flex h-[250px] justify-center [--s:0.5] min-[400px]:[--s:0.7] min-[500px]:h-[300px] min-[500px]:[--s:0.85] md:h-[370px] md:[--s:1] lg:h-[370px] lg:[--s:0.8] xl:h-[440px] xl:[--s:1] short-landscape:hidden"
        >
          {fan.map((c) => (
            <img
              key={c.id}
              src={cover(c.id)}
              alt=""
              width="200"
              height="270"
              decoding="async"
              className="absolute bottom-0 h-auto w-32 animate-float rounded-xl shadow-[0_24px_48px_rgba(0,0,0,0.5)] motion-reduce:animate-none min-[500px]:w-44 md:w-56 lg:w-52 xl:w-64"
              style={{
                '--x': `${c.x}px`,
                '--r': `${c.r}deg`,
                zIndex: c.z,
                animationDelay: `${c.delay}s`,
                transform: 'translateX(calc(var(--x) * var(--s))) rotate(var(--r))',
              }}
            />
          ))}
          {/* sticker */}
          <div className="absolute top-0 right-0 z-10 grid size-24 rotate-12 place-content-center rounded-full bg-coral text-center font-display leading-none font-extrabold md:size-32 lg:right-2">
            <span className="text-3xl md:text-4xl">180+</span>
            <span className="text-sm md:text-base">countries</span>
          </div>
        </div>
      </Container>
    </section>
  )
}
