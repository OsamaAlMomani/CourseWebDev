import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCatalog } from '../context/CatalogContext'
import { useShop } from '../context/ShopContext'
import { authClient } from '../lib/authClient'
import { themes, voices } from '../data/themes'
import Container from './Container'
import Button from './Button'
import { goToContact } from '../lib/contactLink'
import useCategory, { pickCategory } from '../lib/useCategory'
import SlidingTabs from './SlidingTabs'
import { useHeaderScroll } from '../lib/useHeaderScroll'
import { useHeaderHeight } from '../lib/useHeaderHeight'

export default function Header({ route, skin, world }) {
  const { groups, books } = useCatalog()
  const { user, openAuth, setCartOpen, cartCount, notify } = useShop()
  const [open, setOpen] = useState(false)
  const headerRef = useRef(null)

  // scroll drives data-tuck on the header DOM node (no re-render)
  useHeaderScroll(headerRef)
  // measure the header once, write --header-h to <html>
  useHeaderHeight(headerRef)

  // Escape closes the mobile menu
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const theme = themes[route] ?? themes[skin] ?? themes.home
  const kidsWorld = world === 'kids'

  const ordered = useMemo(() => {
    const kids = []
    const rest = []
    for (const g of groups) (g.world === 'kids' ? kids : rest).push(g)
    return [...kids, ...rest]
  }, [groups])

  const tabs = useMemo(
    () => [
      { id: 'home', label: 'All shelves', icon: '🏠', href: '#/' },
      ...ordered.map((g) => ({
        id: g.id,
        label: g.title,
        icon: (voices[g.id] ?? voices.home).icon,
        href: `#/${g.id}`,
      })),
    ],
    [ordered],
  )

  const activeGroup = useMemo(
    () => groups.find((g) => g.id === route) ?? null,
    [groups, route],
  )
  const activeTab = route === '' ? 'home' : activeGroup?.id ?? null

  // one pass over books for every section count (was N+1 filters per render)
  const subTabs = useMemo(() => {
    if (!activeGroup || activeGroup.id === 'scientists') return []
    const categories = activeGroup.categories
    if (!categories?.length) return []

    const counts = new Map()
    let total = 0
    for (const b of books) {
      if (b.group !== activeGroup.id) continue
      total++
      if (b.category) counts.set(b.category, (counts.get(b.category) ?? 0) + 1)
    }

    const result = [{ id: 'all', label: 'Everything', count: total }]
    for (const c of categories) {
      const count = counts.get(c.id) ?? 0
      if (count > 0) result.push({ id: c.id, label: c.label, icon: c.icon, count })
    }
    return result
  }, [activeGroup, books])

  const picked = useCategory()
  const showSub = subTabs.length > 2
  const activeSub = subTabs.some((c) => c.id === picked) ? picked : 'all'

  const closeMenu = useCallback(() => setOpen(false), [])
  const handleSubSelect = useCallback((item) => pickCategory(item.id), [])

  return (
    <header
      ref={headerRef}
      data-tuck="none"
      className={`site-header sticky top-0 z-50 pt-[env(safe-area-inset-top,0px)] transition-colors ${theme.header}`}
    >
      <Container className="flex min-h-16 items-center justify-between gap-2.5">
        <a href="#/" className="text-[1.15rem] font-extrabold tracking-[-0.02em] min-[360px]:text-[1.4rem] font-display">
          Global<span className={theme.logoAccent}>Books</span>
          {kidsWorld && (
            <span className="ml-1.5 rounded-full bg-sun px-2 py-0.5 align-middle text-[0.65em] font-extrabold text-ink">
              Kids
            </span>
          )}
        </a>

        <nav
          id="nav"
          aria-label="Main"
          className={`${open ? 'flex' : 'hidden'} fixed inset-x-0 top-[calc(64px_+_env(safe-area-inset-top,0px))] max-h-[calc(100dvh_-_64px_-_env(safe-area-inset-top,0px))] flex-col overflow-y-auto border-t border-current/10 px-[var(--gutter)] pt-2 pb-4 md:static md:flex md:max-h-none md:flex-row md:gap-6 md:overflow-visible md:border-0 md:bg-transparent md:p-0 ${theme.navBg}`}
        >
          {user ? (
            <>
              <a
                href="#/account"
                aria-current={route === 'account' ? 'page' : undefined}
                onClick={closeMenu}
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
            onClick={closeMenu}
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
              <span key={cartCount} className="absolute top-0.5 right-0 grid min-w-5 animate-bump place-items-center rounded-full bg-sun px-1 text-xs font-extrabold text-ink motion-reduce:animate-none">
                {cartCount}
              </span>
            )}
          </button>
          <Button href="#contact" onClick={goToContact} variant="none" compact className={`rounded-full text-[0.9rem] min-[360px]:text-base ${theme.contactBtn}`}>
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

      {/* Both tab rows live inside one bordered wrapper, as before. */}
      <div className="border-t border-line/70">
        <div className="site-header-row" data-row="tabs">
          <div>
            <Container>
              <SlidingTabs
                label="Shelves"
                items={tabs}
                activeId={activeTab}
                tone="blue"
                onSelect={closeMenu}
              />
            </Container>
          </div>
        </div>

        {showSub && (
          <div className="site-header-row" data-row="subtabs">
            <div>
              <Container className="pb-1.5">
                <SlidingTabs
                  label={`${activeGroup.title} sections`}
                  items={subTabs}
                  activeId={activeSub}
                  tone="coral"
                  size="sm"
                  onSelect={handleSubSelect}
                />
              </Container>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}