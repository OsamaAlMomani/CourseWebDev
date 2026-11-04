import { lazy, Suspense, useEffect, useRef } from 'react'
import { useCatalog } from '../../context/CatalogContext'
import Home from '../../pages/Home/Home'
import AudiencePage from '../../pages/Shelf/AudiencePage'
import { scrollToContactIfAsked } from '../../lib/contactLink'
import ErrorBoundary from '../../shared/ErrorBoundary'

// Pages nobody sees on first load are fetched when they are opened (Stripe, the research reader and the motion lab are big),
// so the first screen downloads and parses much less JavaScript. Home and the shelves stay in the main bundle.
const AccountPage = lazy(() => import('../../pages/Account/AccountPage'))
const MotionLab = lazy(() => import('../../pages/MotionLab/MotionLab'))
const ResearchPage = lazy(() => import('../../pages/Research/ResearchPage'))
const CheckoutPage = lazy(() => import('../../pages/Checkout/CheckoutPage'))

// The router outlet: shows the home page, or the page for whichever group is in the address.
// Checkout is one screen of step boxes: #/checkout (cart), #/checkout?book=ID (Buy now), #/checkout/12 (back from Stripe).
// #/order/12 is the old return address of Stripe's hosted page and opens the same screen on its last box.
export default function Main({ route }) {
  const { groups } = useCatalog()
  const group = groups.find((g) => g.id === route) // undefined means home
  const isAccount = route === 'account'
  const isLab = route === 'motion-lab'
  const flowMatch = route.match(/^(?:checkout|order)(?:\/(\d+))?$/)
  const isCheckout = Boolean(flowMatch)
  const orderId = flowMatch?.[1] ? Number(flowMatch[1]) : null
  const isResearch = group?.id === 'scientists' // the scientists shelf became the Research & Book news portal

  // when the page changes: back to the top, and a title that matches
  const first = useRef(true)
  useEffect(() => {
    document.title = isCheckout
      ? orderId
        ? `Order #${orderId} | GlobalBooks`
        : 'Checkout | GlobalBooks'
      : isResearch
        ? 'Research & Book | GlobalBooks'
        : isLab
          ? 'Motion lab | GlobalBooks'
          : isAccount
            ? 'My account | GlobalBooks'
            : group
              ? `${group.title} | GlobalBooks`
              : 'GlobalBooks | Books for every reader'
    if (first.current) {
      first.current = false // don't jump on first load, someone might have opened #contact
      return
    }
    // arriving from the Contact button on another page: glide to the form instead of the top
    if (scrollToContactIfAsked()) return
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [group, isAccount, isLab, isResearch, isCheckout, orderId])

  return (
    <main id="main">
      {/* key makes React start a fresh page (and a fresh filter) when you switch groups; the boundary keeps one broken page from taking the header down with it */}
      <ErrorBoundary key={route}>
        <Suspense fallback={<div role="status" aria-label="Loading" className="min-h-[60vh]" />}>
        {isLab ? (
          <MotionLab />
        ) : isResearch ? (
          <ResearchPage />
        ) : isAccount ? (
          <AccountPage />
        ) : isCheckout ? (
          <CheckoutPage orderId={orderId} />
        ) : group ? (
          <AudiencePage key={group.id} group={group} />
        ) : (
          <Home />
        )}
        </Suspense>
      </ErrorBoundary>
    </main>
  )
}
