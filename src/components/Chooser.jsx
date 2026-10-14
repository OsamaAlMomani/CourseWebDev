import { groups } from '../data/books'
import { themes } from '../data/themes'
import Container from './Container'
import { Bear, Die, Globe, Pencil, Atom } from './Decor'

// each tile has its own little drawing, matching the page it leads to
const art = {
  kids: <Bear className="w-24 md:w-36" />,
  teens: <Die className="w-24 rotate-12 md:w-36" />,
  adults: <Globe className="w-24 text-gold/70 md:w-36" />,
  students: <Pencil className="w-8 rotate-[35deg] md:w-12" />,
  scientists: <Atom className="w-24 md:w-36 [&_*]:stroke-teal" />,
}

// how many columns each tile takes on the big layout (3 on top, 2 below)
const spans = {
  kids: 'lg:col-span-2',
  teens: 'lg:col-span-2',
  adults: 'lg:col-span-2',
  students: 'lg:col-span-3',
  scientists: 'sm:col-span-2 lg:col-span-3',
}

export default function Chooser() {
  return (
    <section id="choose" className="bg-paper py-16 md:py-28">
      <Container>
        <h2 className="font-display text-[clamp(2.6rem,11vw,6rem)] leading-[0.92] font-extrabold tracking-[-0.045em]">
          Who are you shopping for?
        </h2>
        <p className="mt-4 mb-10 max-w-[44ch] text-xl text-muted md:mb-14 md:text-2xl">
          Every reader gets a shelf of their own, made to feel right for them.
        </p>

        <div className="grid gap-5 sm:grid-cols-2 md:gap-8 lg:grid-cols-6">
          {groups.map((g) => {
            const t = themes[g.id]
            return (
              <a
                key={g.id}
                href={`#/${g.id}`}
                className={`group relative isolate flex min-h-[260px] flex-col justify-between gap-8 overflow-hidden p-6 transition-transform duration-200 hover:-translate-y-2 md:min-h-[320px] md:p-8 ${t.heroBg} ${t.heroPattern} ${t.tileShape} ${t.font} ${spans[g.id]}`}
              >
                <div className="relative z-10">
                  <h3 className={`text-[clamp(2.2rem,6.5vw,3.75rem)] leading-none font-extrabold ${t.heroHeading}`}>{g.title}</h3>
                  <p className={`mt-3 max-w-[22ch] text-lg md:text-xl ${t.tileLine}`}>{g.homeLine}</p>
                </div>
                <span className={`relative z-10 text-lg font-bold underline decoration-2 underline-offset-4 ${t.tileCta}`}>
                  Enter the {g.title.toLowerCase()} shelf →
                </span>
                <div aria-hidden="true" className="absolute right-4 bottom-4 z-0 transition-transform duration-200 group-hover:rotate-6 group-hover:scale-110">
                  {art[g.id]}
                </div>
              </a>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
