import { themes } from '../../data/themes'
import Container from '../Container'

// ONE hero for the whole site (home, the five shelves, Research & Book).
// Same title size, same floating covers, and the same background: the hero sits straight on the aurora behind the whole
// site (no video, no wash, no dots), in the Night theme and in the light glass theme alike.
// Only the words and the covers change from page to page.
//
//   kicker   small pill above the title (optional)
//   title    the h1 content (a string or JSX; wrap the accent part in <span className="text-blue">)
//   intro    the paragraph under the title
//   actions  buttons / links under the intro (JSX)
//   covers   list of { src, x, r, z, delay } for the floating fan (use fanOf to build it), or leave out
//   extra    anything that sits on top of the covers (like the "180+ countries" sticker)

const theme = themes.home // every page shares one theme, so any of them gives the same answer

// Turns a list of image paths into fan positions: middle one straight, the others spread and tilted out.
export function fanOf(srcs, gap = 95) {
  const mid = (srcs.length - 1) / 2
  return srcs.map((src, i) => {
    const spot = i - mid // negative = left of centre
    return { src, x: spot * gap, r: spot * 9, z: 10 - Math.round(Math.abs(spot) * 2), delay: -i * 1.2 }
  })
}

// The covers that float up and down. --x / --r / --z / --delay are read by .fan-cover (PageHero.css) and the float keyframes (styles/animations.css).
function CoverFan({ covers, children }) {
  return (
    <div
      aria-hidden="true"
      className="relative flex h-[250px] justify-center [--s:0.5] min-[400px]:[--s:0.7] min-[500px]:h-[300px] min-[500px]:[--s:0.85] md:h-[370px] md:[--s:1] lg:[--s:0.8] xl:h-[440px] xl:[--s:1] short-landscape:hidden"
    >
      {covers.map((c) => (
        <img
          key={c.src}
          src={c.src}
          alt=""
          width="200"
          height="270"
          decoding="async"
          className={`fan-cover absolute bottom-0 h-auto w-32 min-[500px]:w-44 md:w-56 lg:w-52 xl:w-64 ${theme.coverCls} ${theme.fanAnim}`}
          style={{ '--x': `${c.x}px`, '--r': `${c.r}deg`, '--z': c.z, '--delay': `${c.delay}s` }}
        />
      ))}
      {children}
    </div>
  )
}

export default function PageHero({ id, kicker, title, intro, actions, covers = [], extra }) {
  return (
    <section
      id={id}
      className={`ink-hero relative isolate overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 lg:flex lg:min-h-[80svh] lg:items-center short-landscape:pt-6 short-landscape:pb-8 ${theme.font} ${theme.heroBg}`}
    >
      <Container className={`grid grid-cols-[minmax(0,1fr)] gap-12 short-landscape:grid-cols-[minmax(0,1fr)] ${covers.length ? 'lg:grid-cols-[1.1fr_1fr] lg:items-center' : ''}`}>
        <div>
          {kicker && <p className={`rise d1 mb-6 ${theme.kicker}`}>{kicker}</p>}
          <h1 className={`rise d2 mb-6 ${theme.heroHeading}`}>{title}</h1>
          {intro && <p className={`rise d3 mb-8 ${theme.intro}`}>{intro}</p>}
          {actions && <div className="rise d4">{actions}</div>}
        </div>
        {covers.length > 0 && (
          // outer box plays the load-in, inner box turns with the pointer (they can't share one transform)
          <div className="rise d3 short-landscape:hidden">
            <div className="ink-tilt">
              <CoverFan covers={covers}>{extra}</CoverFan>
            </div>
          </div>
        )}
      </Container>
    </section>
  )
}
