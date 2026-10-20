import { useCatalog } from '../context/CatalogContext'
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



export default function Chooser() {
  const { groups } = useCatalog()
  // the Kids Corner has its own banner right below, so the tiles here are teens to scientists
  const general = groups.filter((g) => g.world === 'general')
  return (
    <section id="choose" className="bg-paper [background-image:radial-gradient(rgba(91,61,245,0.12)_2px,transparent_2px)] [background-size:30px_30px] py-16 md:py-28">
      <Container>
        <h2 className="font-display text-[clamp(2.6rem,11vw,6rem)] leading-[0.92] font-extrabold tracking-[-0.045em]">
          Find your shelf
        </h2>
        <p className="mt-4 mb-10 max-w-[44ch] text-xl text-muted md:mb-14 md:text-2xl">
          From teens to scientists, pick your level and everything is sorted for you. Shopping for a child? The Kids Corner is just below.
        </p>

        <div className="grid gap-5 sm:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {general.map((g) => {
            const t = themes[g.id]
            return (
              <a
                key={g.id}
                href={`#/${g.id}`}
                className={`group relative isolate flex min-h-[260px] flex-col justify-between gap-8 overflow-hidden p-6 transition-transform duration-200 hover:-translate-y-2 md:min-h-[320px] md:p-8 ${t.heroBg} ${t.heroPattern} ${t.tileShape} ${t.font}`}
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
