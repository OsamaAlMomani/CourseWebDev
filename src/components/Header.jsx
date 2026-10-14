import { useState } from 'react'
import { groups } from '../data/books'
import { themes } from '../data/themes'
import Container from './Container'
import Button from './Button'

export default function Header({ route }) {
  // is the phone menu open? That's the only thing the header needs to remember
  const [open, setOpen] = useState(false)

  // the header takes on the colours of the page you're on
  const theme = themes[route] ?? themes.home

  return (
    <header className={`sticky top-0 z-50 pt-[env(safe-area-inset-top,0px)] transition-colors ${theme.header}`}>
      <Container className="flex min-h-16 items-center justify-between gap-2.5">
        <a href="#/" className="text-[1.15rem] font-extrabold tracking-[-0.02em] min-[360px]:text-[1.4rem] font-display">
          Global<span className={theme.logoAccent}>Books</span>
        </a>

        {/* phones: dropdown that shows when open is true. md and up: always a row */}
        <nav
          id="nav"
          aria-label="Main"
          className={`${open ? 'flex' : 'hidden'} fixed inset-x-0 top-[calc(64px_+_env(safe-area-inset-top,0px))] max-h-[calc(100dvh_-_64px_-_env(safe-area-inset-top,0px))] flex-col overflow-y-auto border-t border-current/10 px-[var(--gutter)] pt-2 pb-4 md:static md:flex md:max-h-none md:flex-row md:gap-6 md:overflow-visible md:border-0 md:bg-transparent md:p-0 ${theme.navBg}`}
        >
          {groups.map((g) => (
            <a
              key={g.id}
              href={`#/${g.id}`}
              aria-current={route === g.id ? 'page' : undefined}
              onClick={() => setOpen(false)}
              className={`flex min-h-11 items-center text-[1.05rem] font-medium underline-offset-8 aria-[current=page]:font-bold aria-[current=page]:underline aria-[current=page]:decoration-2 md:min-h-0 md:text-base ${theme.navLink}`}
            >
              {g.title}
            </a>
          ))}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className={`flex min-h-11 items-center text-[1.05rem] font-medium md:hidden ${theme.closeLink}`}
          >
            Close menu
          </button>
        </nav>

        <div className="flex items-center gap-1.5">
          <Button href="#contact" variant="none" compact className={`rounded-full text-[0.9rem] min-[360px]:text-base ${theme.contactBtn}`}>
            Contact
          </Button>
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="nav"
            onClick={() => setOpen(!open)}
            className="grid size-11 place-content-center gap-[5px] md:hidden"
          >
            <span className={`block h-0.5 w-[22px] bg-current transition ${open ? 'translate-y-[7px] rotate-45' : ''}`} />
            <span className={`block h-0.5 w-[22px] bg-current transition ${open ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-[22px] bg-current transition ${open ? '-translate-y-[7px] -rotate-45' : ''}`} />
          </button>
        </div>
      </Container>
    </header>
  )
}
