import { useEffect, useState } from 'react'
import { useCatalog } from '../context/CatalogContext'
import { useShop } from '../context/ShopContext'
import { authClient } from '../lib/authClient'
import { themes } from '../data/themes'
import Container from './Container'
import Button from './Button'

export default function Header({ route, skin, world }) {
  const { groups } = useCatalog()
  const { user, openAuth, setCartOpen, cartCount, notify } = useShop()
  // is the phone menu open? That's the only thing the header needs to remember
  const [open, setOpen] = useState(false)

  // pressing Escape closes the menu. The listener is removed again when the header goes away
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // the header takes on the colours of the page you're on
  const theme = themes[route] ?? themes[skin] ?? themes.home
  const kidsWorld = world === 'kids'
  // the nav only shows the half you are in, with one link over to the other half
  const navGroups = groups.filter((g) => g.world === world)

  return (
    <header className={`sticky top-0 z-50 pt-[env(safe-area-inset-top,0px)] transition-colors ${theme.header}`}>
      <Container className="flex min-h-16 items-center justify-between gap-2.5">
        <a href="#/" className="text-[1.15rem] font-extrabold tracking-[-0.02em] min-[360px]:text-[1.4rem] font-display">
          Global<span className={theme.logoAccent}>Books</span>
          {kidsWorld && <span className="ml-1.5 rounded-full bg-sun px-2 py-0.5 align-middle text-[0.65em] font-extrabold text-ink">Kids</span>}
        </a>

        {/* phones: dropdown that shows when open is true. md and up: always a row */}
        <nav
          id="nav"
          aria-label="Main"
          className={`${open ? 'flex' : 'hidden'} fixed inset-x-0 top-[calc(64px_+_env(safe-area-inset-top,0px))] max-h-[calc(100dvh_-_64px_-_env(safe-area-inset-top,0px))] flex-col overflow-y-auto border-t border-current/10 px-[var(--gutter)] pt-2 pb-4 md:static md:flex md:max-h-none md:flex-row md:gap-6 md:overflow-visible md:border-0 md:bg-transparent md:p-0 ${theme.navBg}`}
        >
          {navGroups.map((g) => (
            <a
              key={g.id}
              href={`#/${g.id}`}
              aria-current={route === g.id ? 'page' : undefined}
              onClick={() => setOpen(false)}
              className={`flex min-h-11 items-center text-[1.05rem] font-medium underline-offset-8 aria-[current=page]:font-bold aria-[current=page]:underline aria-[current=page]:decoration-2 md:min-h-0 md:text-base ${theme.navLink}`}
            >
              {kidsWorld ? 'Kids Corner' : g.title}
            </a>
          ))}
          {/* the way over to the other half of the shop */}
          {kidsWorld ? (
            <a
              href="#/"
              onClick={() => setOpen(false)}
              className={`flex min-h-11 items-center text-[1.05rem] font-bold underline underline-offset-4 md:min-h-0 md:text-base ${theme.navLink}`}
            >
              Main shop →
            </a>
          ) : (
            <a
              href="#/kids"
              onClick={() => setOpen(false)}
              className="my-1 flex min-h-11 items-center self-start rounded-full bg-sun px-4 text-[1.05rem] font-extrabold text-ink md:my-0 md:min-h-9 md:text-base"
            >
              🧸 Kids Corner
            </a>
          )}
          {/* account links: what you see depends on whether the server says you are signed in */}
          {user ? (
            <>
              <a
                href="#/account"
                aria-current={route === 'account' ? 'page' : undefined}
                onClick={() => setOpen(false)}
                className={`flex min-h-11 items-center text-[1.05rem] font-medium underline-offset-8 aria-[current=page]:font-bold aria-[current=page]:underline md:min-h-0 md:text-base ${theme.navLink}`}
              >
                My account
              </a>
              <button
                type="button"
                onClick={async () => {
                  setOpen(false)
                  await authClient.signOut()
                  notify('You are signed out.')
                  if (route === 'account') window.location.hash = '#/'
                }}
                className={`flex min-h-11 items-center text-[1.05rem] font-medium md:min-h-0 md:text-base ${theme.navLink}`}
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                openAuth('signin')
              }}
              className={`flex min-h-11 items-center text-[1.05rem] font-bold md:min-h-0 md:text-base ${theme.navLink}`}
            >
              Sign in
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className={`flex min-h-11 items-center text-[1.05rem] font-medium md:hidden ${theme.closeLink}`}
          >
            Close menu
          </button>
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Open cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
            className="relative grid size-11 place-items-center transition-transform hover:scale-110"
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 8H6" />
              <circle cx="9.5" cy="20" r="1.2" />
              <circle cx="17" cy="20" r="1.2" />
            </svg>
            {cartCount > 0 && (
              // key={cartCount}: React makes a fresh badge each time the number changes, so the bump plays again
              <span key={cartCount} className="absolute top-0.5 right-0 grid min-w-5 animate-bump place-items-center rounded-full bg-sun px-1 text-xs font-extrabold text-ink motion-reduce:animate-none">
                {cartCount}
              </span>
            )}
          </button>
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
