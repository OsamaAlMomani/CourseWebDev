import { books } from '../data/books'
import { cover } from '../lib/asset'
import Container from './Container'
import Button from './Button'

// "Stories that are *all yours!*" -> the starred bit gets the accent style
const renderHeadline = (text, accent) =>
  text.split('*').map((part, i) => (i % 2 ? <span key={i} className={accent}>{part}</span> : part))

export default function AudienceHero({ group, theme }) {
  const fanBooks = books.filter((b) => b.group === group.id).slice(0, 4)
  const gap = fanBooks.length <= 2 ? 130 : 95 // fewer books, wider spread

  return (
    <section
      className={`relative isolate overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 lg:flex lg:min-h-[80svh] lg:items-center ${theme.font} ${theme.heroBg} ${theme.heroPattern}`}
    >
      <Container className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <p className={`mb-6 ${theme.kicker}`}>{group.kicker}</p>
          <h1
            className={`mb-6 text-[clamp(3rem,13vw,5.5rem)] font-extrabold md:text-[clamp(4rem,10vw,6.5rem)] lg:text-[clamp(3.5rem,7vw,6.5rem)] ${theme.heroHeading}`}
          >
            {renderHeadline(group.headline, theme.accent)}
          </h1>
          <p className={`mb-8 max-w-[40ch] text-xl md:text-2xl ${theme.intro}`}>{group.intro}</p>
          <Button large variant="none" href="#shelf" className={theme.cta}>
            {group.cta}
          </Button>
        </div>

        {/* this group's own covers, fanned out */}
        <div
          aria-hidden="true"
          className="relative flex h-[250px] justify-center [--s:0.5] min-[400px]:[--s:0.7] min-[500px]:h-[300px] min-[500px]:[--s:0.85] md:h-[370px] md:[--s:1] lg:[--s:0.8] xl:h-[440px] xl:[--s:1]"
        >
          {fanBooks.map((b, i) => {
            const mid = (fanBooks.length - 1) / 2
            const spot = i - mid // negative = left of centre
            return (
              <img
                key={b.id}
                src={cover(b.id)}
                alt=""
                width="200"
                height="270"
                decoding="async"
                className={`absolute bottom-0 h-auto w-32 min-[500px]:w-44 md:w-56 lg:w-52 xl:w-64 ${theme.coverCls} ${theme.fanAnim}`}
                style={{
                  '--x': `${spot * gap}px`,
                  '--r': `${spot * 9}deg`,
                  zIndex: 10 - Math.round(Math.abs(spot) * 2),
                  animationDelay: `${-i * 1.2}s`,
                  transform: 'translateX(calc(var(--x) * var(--s))) rotate(var(--r))',
                }}
              />
            )
          })}
        </div>
      </Container>
    </section>
  )
}
