# GlobalBooks `src/` folder guide

Every page has its own folder. The JSX files and the page's CSS live together, so everything
about a page is in one place.

```
src/
├── index.css            Entry point: only @import lines + the cascade order (read its header first)
├── main.jsx, App.jsx    Starts the app; App picks the page from the address (#/...)
│
├── styles/              GLOBAL CSS (no JSX): the same on every page
│   ├── tokens.css        colours, fonts, easing, skin variables (the light theme)
│   ├── theme-night.css   the Night theme = the INKWELL palette (ink-black, cream, amber / rose / violet), under html[data-theme="dark"]. The DEFAULT theme.
│   ├── inkwell.css      the INKWELL look: aurora layers, glass cards, gradient buttons, shimmer headings, reveal. Dark theme only (fonts + .rise apply to both)
│   ├── animations.css    @keyframes
│   ├── base.css          html/body defaults, focus ring, gutters
│   ├── ui-kit.css        .skin-card  .skin-btn*  .skin-input
│   ├── dialogs.css       dialog.drawer / dialog.popup
│   ├── typography.css    .t-display  .t-section  .t-title ...
│   ├── controls.css      .btn  .chip  .badge  .card-lift
│   ├── scroll-effects.css  .reveal  .fab-away
│   ├── accessibility.css reduced motion / contrast / forced colours
│   └── kill-switch.css   .skin-reduce-fx for slow devices (imported last)
│
├── layout/              The app shell that is on every page
│   ├── Header/           Header.jsx, SlidingTabs.jsx, Header.css
│   ├── InkwellBackground/ aurora, particle canvas, cursor spotlight, vignette, grain, and the side scroll rail (Night theme only)
│   ├── Footer/  CartDrawer/  AuthDialog/  Toast/  ChatFab/
│   └── Main/             Main.jsx: shows the page for the current route
│
├── pages/               One folder per page: JSX + its CSS together
│   ├── Home/             Home.jsx + Hero, Chooser, KidsBanner, Marquee, NewArrivals (sideways shelf), Perks, FeatureBook, Watch, Newsletter, Contact + Home.css, NewArrivals.css
│   ├── Shelf/            AudiencePage, Shelf, BookCard, Decor, ... + Shelf.css   (Kids, Teens, Students ...)
│   ├── Account/          AccountPage, ProfilePanel, primitives, ProfileBackdrop, useAccountData + Account.css
│   ├── Research/         ResearchPage, cards, Modal, OrderModal, SearchModal, bits + Research.css
│   └── MotionLab/        MotionLab.jsx + MotionLab.css
│
├── shared/              Used by more than one page
│   ├── PageHero/ PurchasedBook/ MathPlane/   (JSX + CSS)
│   ├── LoadMore.jsx      the "More" button: shows 5 cards, 5 more per press (PAGE_SIZE) + useLoadMore hook
│   ├── AdvancedToggle.jsx  the "Advanced search" button that opens/closes a filter panel
│   └── Button, Container, Stepper, BackgroundVideo, ErrorBoundary, CountUp (number that counts up on screen)
│
└── context/  data/  lib/   State, static data, helpers. New in lib/: inkwellFx.js (reveal on scroll, card tilt, magnetic buttons, started in main.jsx), useDragRail.js (the sideways shelf engine)
```

## Adding or changing styles

* **Page-only style** -> the CSS file inside that page's folder.
* **Used on several pages** -> `styles/` (or the `shared/<Part>/` folder if it belongs to one component).
* **New CSS file** -> add one `@import` line to `index.css` in the right group. Order matters: later wins.
* Every CSS file starts with a header: what it is for, which JSX uses it, and a class index.

## The INKWELL look (what is where)

* **Default theme is Night = INKWELL.** `lib/theme.js` starts in dark; the header button switches to the light (sky-blue) theme and the choice is remembered.
* **Colours** are only variables: `styles/theme-night.css` (dark) and `styles/tokens.css` (light + the raw `--ink-*` palette).
* **Effects** are in `styles/inkwell.css`. It is deliberately NOT in a cascade layer, so it beats Tailwind utilities without `!important`.
* **No JSX knows about the tilt / glow / magnetic effect.** `lib/inkwellFx.js` listens on the whole page: give an element `.card-lift`, `.skin-btn`, `.ink-hero` or `.reveal` / `.ink-reveal` and it just works.
* **Turning the heavy parts off:** `prefers-reduced-motion`, `prefers-reduced-transparency`, or `document.body.classList.add('skin-reduce-fx')`.
